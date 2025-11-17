import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { createLogger, createErrorResponse, logWebhookRequest } from "../_shared/edge-utils.ts";

const logger = createLogger('webhook-telegram-stars');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let payload: any;
  let responseStatus = 200;
  let errorMessage: string | undefined;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    payload = await req.json();
    logger.info('Webhook received', { has_payment: !!payload.message?.successful_payment });
    
    if (payload.message?.successful_payment) {
      const payment = payload.message.successful_payment;
      const userId = payment.invoice_payload;
      const amount = payment.total_amount / 100;

      if (!userId) {
        logger.warn('Missing user_id');
        responseStatus = 400;
        errorMessage = 'Invalid payload: missing user_id';
        
        await logWebhookRequest({
          supabaseClient,
          webhookName: 'webhook-telegram-stars',
          requestBody: payload,
          responseStatus,
          errorMessage,
          processingTimeMs: Date.now() - startTime,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        });
        
        return new Response('Invalid payload', { status: 400 });
      }

      logger.info('Processing', { user_id: userId, amount });

      await supabaseClient.from('deposits').insert({
        user_id: userId,
        amount,
        payment_method: 'telegram_stars',
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
              data: { amount, payment_method: 'telegram_stars' }
            }
          });
        } catch (notifError) {
          logger.error('Notification failed', { error: String(notifError) });
        }
      }
    }

    await logWebhookRequest({
      supabaseClient,
      webhookName: 'webhook-telegram-stars',
      requestBody: payload,
      responseStatus: 200,
      responseBody: 'OK',
      processingTimeMs: Date.now() - startTime,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    logger.error('Webhook failed', { error: String(error) });
    responseStatus = 500;
    errorMessage = String(error);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    await logWebhookRequest({
      supabaseClient,
      webhookName: 'webhook-telegram-stars',
      requestBody: payload,
      responseStatus,
      errorMessage,
      processingTimeMs: Date.now() - startTime,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    });
    
    return createErrorResponse(error as Error);
  }
});
