import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { retryWithBackoff, withTimeout, createLogger, createErrorResponse } from "../_shared/edge-utils.ts";

const logger = createLogger('create-payment');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function createCryptoBotPayment(token: string, amount: number, userId: string) {
  return await retryWithBackoff(async () => {
    return await withTimeout(
      fetch('https://pay.crypt.bot/api/createInvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Crypto-Pay-API-Token': token,
        },
        body: JSON.stringify({
          amount,
          currency_type: 'fiat',
          fiat: 'RUB',
          description: `Пополнение баланса на ${amount} ₽`,
          payload: userId,
        }),
      }).then(async (response) => {
        const data = await response.json();
        if (!data.ok) throw new Error(`CryptoBot API error: ${JSON.stringify(data)}`);
        return data.result.pay_url;
      }),
      10000
    );
  }, { maxRetries: 2, initialDelay: 1000 });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, amount, payment_method } = await req.json();
    logger.info('Payment creation', { user_id, amount, payment_method });

    if (!user_id || !amount || !payment_method) {
      logger.warn('Missing parameters');
      return new Response(JSON.stringify({ error: 'user_id, amount, and payment_method required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (amount <= 0) {
      logger.warn('Invalid amount', { amount });
      return new Response(JSON.stringify({ error: 'Amount must be positive' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: settings } = await supabaseClient
      .from('bot_settings')
      .select('*')
      .in('key', [
        `${payment_method}_token`,
        `${payment_method}_enabled`,
        `${payment_method}_min_amount`,
        `${payment_method}_max_amount`
      ]);

    const settingsMap = settings?.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>) || {};

    if (settingsMap[`${payment_method}_enabled`] !== 'true') {
      logger.warn('Payment method disabled', { payment_method });
      return new Response(JSON.stringify({ error: 'Payment method is disabled' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const minAmount = parseFloat(settingsMap[`${payment_method}_min_amount`] || '0');
    const maxAmount = parseFloat(settingsMap[`${payment_method}_max_amount`] || '999999');

    if (amount < minAmount || amount > maxAmount) {
      logger.warn('Amount out of limits', { amount, minAmount, maxAmount });
      return new Response(JSON.stringify({ error: `Amount must be between ${minAmount} and ${maxAmount}` }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let paymentUrl: string;

    try {
      switch (payment_method) {
        case 'cryptobot': {
          const token = settingsMap['cryptobot_token'];
          if (!token) {
            logger.error('CryptoBot token missing');
            return new Response(JSON.stringify({ error: 'Payment system not configured' }), {
              status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          paymentUrl = await createCryptoBotPayment(token, amount, user_id);
          break;
        }
        case 'telegram_stars': {
          paymentUrl = `tg://resolve?domain=YOUR_BOT&start=pay_${user_id}_${amount}`;
          break;
        }
        default:
          logger.error('Unsupported payment method', { payment_method });
          return new Response(JSON.stringify({ error: 'Unsupported payment method' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }

      logger.info('Payment created', { user_id, payment_method, amount });
      return new Response(JSON.stringify({ payment_url: paymentUrl }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (apiError) {
      logger.error('Payment provider failed', { payment_method, error: String(apiError) });
      return new Response(JSON.stringify({ 
        error: 'Payment service temporarily unavailable',
        details: String(apiError)
      }), { 
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    logger.error('Payment creation failed', { error: String(error) });
    return createErrorResponse(error as Error);
  }
});
