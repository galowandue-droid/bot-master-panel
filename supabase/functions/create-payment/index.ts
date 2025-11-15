import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function createCryptoBotPayment(token: string, amount: number, userId: string) {
  const response = await fetch('https://pay.crypt.bot/api/createInvoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Crypto-Pay-API-Token': token,
    },
    body: JSON.stringify({
      amount: amount,
      currency_type: 'fiat',
      fiat: 'RUB',
      description: `Пополнение баланса на ${amount} ₽`,
      payload: userId,
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`CryptoBot API error: ${JSON.stringify(data)}`);
  }

  return data.result.pay_url;
}

async function createTelegramStarsPayment(amount: number, userId: string) {
  // Telegram Stars работает через бота напрямую
  // Возвращаем специальную ссылку для обработки в боте
  return `tg://resolve?domain=YOUR_BOT_USERNAME&start=pay_${userId}_${amount}`;
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

    if (!user_id || !amount || !payment_method) {
      return new Response(
        JSON.stringify({ error: 'user_id, amount, and payment_method are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be positive' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get payment system settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('bot_settings')
      .select('*')
      .in('key', [
        `${payment_method}_token`,
        `${payment_method}_enabled`,
        `${payment_method}_min_amount`,
        `${payment_method}_max_amount`
      ]);

    if (settingsError) {
      throw settingsError;
    }

    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>) || {};

    // Check if payment method is enabled
    if (settingsMap[`${payment_method}_enabled`] !== 'true') {
      return new Response(
        JSON.stringify({ error: 'Payment method is disabled' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check limits
    const minAmount = parseFloat(settingsMap[`${payment_method}_min_amount`] || '0');
    const maxAmount = parseFloat(settingsMap[`${payment_method}_max_amount`] || '999999');

    if (amount < minAmount || amount > maxAmount) {
      return new Response(
        JSON.stringify({ 
          error: `Amount must be between ${minAmount} and ${maxAmount}` 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let paymentUrl: string;

    switch (payment_method) {
      case 'cryptobot': {
        const token = settingsMap['cryptobot_token'];
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'CryptoBot token not configured' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        paymentUrl = await createCryptoBotPayment(token, amount, user_id);
        break;
      }

      case 'telegram_stars': {
        paymentUrl = await createTelegramStarsPayment(amount, user_id);
        break;
      }

      case 'wata':
      case 'heleket': {
        // Эти платежные системы требуют кастомной интеграции
        // Здесь нужно реализовать их API
        const customLink = settingsMap[`${payment_method}_custom_link`];
        if (customLink) {
          paymentUrl = `${customLink}?amount=${amount}&user_id=${user_id}`;
        } else {
          return new Response(
            JSON.stringify({ error: `${payment_method} not fully configured` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported payment method' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Create pending deposit record
    const { data: deposit, error: depositError } = await supabaseClient
      .from('deposits')
      .insert({
        user_id,
        amount,
        payment_method,
        status: 'pending',
      })
      .select()
      .single();

    if (depositError) {
      console.error('Error creating deposit:', depositError);
      throw depositError;
    }

    console.log(`Payment created: ${deposit.id}, method: ${payment_method}, amount: ${amount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        payment_url: paymentUrl,
        deposit_id: deposit.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-payment function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
