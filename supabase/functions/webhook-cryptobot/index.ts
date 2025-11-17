import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { createLogger, createErrorResponse, logWebhookRequest } from "../_shared/edge-utils.ts";

const logger = createLogger('webhook-cryptobot');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, crypto-pay-api-signature',
};

async function verifySignature(body: string, signature: string, token: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(token);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const dataBuffer = encoder.encode(body);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataBuffer);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let payload: any;
  let responseStatus = 200;
  let errorMessage: string | undefined;
  let body: string | undefined;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: settings } = await supabaseClient
      .from('bot_settings')
      .select('value')
      .eq('key', 'cryptobot_token')
      .single();

    if (!settings?.value) {
      logger.error('Token not configured');
      responseStatus = 500;
      errorMessage = 'Token not configured';
      
      await logWebhookRequest({
        supabaseClient,
        webhookName: 'webhook-cryptobot',
        requestBody: {},
        responseStatus,
        errorMessage,
        processingTimeMs: Date.now() - startTime,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      });
      
      return new Response('Token not configured', { status: 500 });
    }

    const token = settings.value;
    body = await req.text();
    const signature = req.headers.get('crypto-pay-api-signature');

    if (!signature || !(await verifySignature(body, signature, token))) {
      logger.error('Invalid signature');
      responseStatus = 403;
      errorMessage = 'Invalid signature';
      
      await logWebhookRequest({
        supabaseClient,
        webhookName: 'webhook-cryptobot',
        requestBody: body ? JSON.parse(body) : {},
        responseStatus,
        errorMessage,
        processingTimeMs: Date.now() - startTime,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      });
      
      return new Response('Invalid signature', { status: 403 });
    }

    payload = JSON.parse(body);
    logger.info('Webhook received', { update_type: payload.update_type });

    if (payload.update_type === 'invoice_paid') {
      const invoice = payload.payload;
      const userId = invoice.payload;
      const amount = parseFloat(invoice.amount);

      logger.info('Processing payment', { user_id: userId, amount });

      await supabaseClient.from('deposits').insert({
        user_id: userId,
        amount,
        payment_method: 'cryptobot',
        status: 'completed',
      });

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('balance, telegram_id')
        .eq('id', userId)
        .single();

      if (profile) {
        const newBalance = (profile.balance || 0) + amount;
        await supabaseClient
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);

        logger.info('Balance updated', { user_id: userId, new_balance: newBalance });

        if (profile.telegram_id) {
          try {
            await supabaseClient.functions.invoke('send-notification', {
              body: {
                type: 'deposit',
                telegram_id: profile.telegram_id,
                data: { amount, payment_method: 'cryptobot' }
              }
            });
          } catch (notifError) {
            logger.error('Notification failed', { error: String(notifError) });
          }
        }
      }
    }

    await logWebhookRequest({
      supabaseClient,
      webhookName: 'webhook-cryptobot',
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
      webhookName: 'webhook-cryptobot',
      requestBody: payload,
      responseStatus,
      errorMessage,
      processingTimeMs: Date.now() - startTime,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    });
    
    return createErrorResponse(error as Error);
  }
});
