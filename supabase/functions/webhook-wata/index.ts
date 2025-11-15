import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { createLogger, createErrorResponse } from "../_shared/edge-utils.ts";

const logger = createLogger('webhook-wata');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    logger.info('Webhook received', { status: payload.status });
    
    if (payload.status === 'success' || payload.status === 'paid') {
      const userId = payload.user_id || payload.merchant_data?.user_id;
      const amount = parseFloat(payload.amount);

      if (!userId || !amount) {
        logger.warn('Missing data');
        return new Response('Invalid payload', { status: 400 });
      }

      logger.info('Processing', { user_id: userId, amount });

      await supabaseClient.from('deposits').insert({
        user_id: userId,
        amount,
        payment_method: 'wata',
        status: 'completed',
      });

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('balance, telegram_id')
        .eq('id', userId)
        .single();

      if (profile) {
        const newBalance = (profile.balance || 0) + amount;
        await supabaseClient.from('profiles').update({ balance: newBalance }).eq('id', userId);
        logger.info('Balance updated', { user_id: userId, new_balance: newBalance });

        try {
          await supabaseClient.functions.invoke('send-notification', {
            body: {
              type: 'deposit',
              telegram_id: profile.telegram_id,
              data: { amount, payment_method: 'wata' }
            }
          });
        } catch (notifError) {
          logger.error('Notification failed', { error: String(notifError) });
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    logger.error('Webhook failed', { error: String(error) });
    return createErrorResponse(error as Error);
  }
});
