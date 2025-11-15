import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, crypto-pay-api-signature',
};

async function verifySignature(body: string, signature: string, token: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(token);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get CryptoBot token from settings
    const { data: settings } = await supabaseClient
      .from('bot_settings')
      .select('value')
      .eq('key', 'cryptobot_token')
      .single();

    if (!settings?.value) {
      console.error('CryptoBot token not found in settings');
      return new Response('Token not configured', { status: 500 });
    }

    const token = settings.value;
    const body = await req.text();
    const signature = req.headers.get('crypto-pay-api-signature');

    // Verify webhook signature
    if (!signature || !(await verifySignature(body, signature, token))) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 403 });
    }

    const payload = JSON.parse(body);
    console.log('CryptoBot webhook received:', payload);

    // Handle different update types
    if (payload.update_type === 'invoice_paid') {
      const invoice = payload.payload;
      const userId = invoice.payload; // We stored user_id in payload
      const amount = parseFloat(invoice.amount);

      // Create deposit record
      const { error: depositError } = await supabaseClient
        .from('deposits')
        .insert({
          user_id: userId,
          amount: amount,
          payment_method: 'cryptobot',
          status: 'completed',
        });

      if (depositError) {
        console.error('Error creating deposit:', depositError);
        throw depositError;
      }

      // Update user balance
      const { error: balanceError } = await supabaseClient.rpc(
        'increment_balance',
        { user_id: userId, amount: amount }
      );

      if (balanceError) {
        // If function doesn't exist, update directly
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();

        if (profile) {
          const newBalance = (profile.balance || 0) + amount;
          await supabaseClient
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId);
        }
      }

      console.log(`Balance updated for user ${userId}: +${amount}`);

      // Send notification to user via Telegram
      const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
      if (botToken) {
        const { data: userProfile } = await supabaseClient
          .from('profiles')
          .select('telegram_id, balance')
          .eq('id', userId)
          .single();

        if (userProfile?.telegram_id) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: userProfile.telegram_id,
              text: `✅ Баланс успешно пополнен на ${amount} ₽\n\nВаш баланс: ${userProfile.balance} ₽`,
            }),
          });
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in webhook-cryptobot:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
