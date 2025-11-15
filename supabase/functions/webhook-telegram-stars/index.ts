import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    console.log('Telegram Stars webhook received:', payload);

    // Telegram Stars работает через Telegram Bot API
    // Обрабатываем successful_payment update
    
    if (payload.message?.successful_payment) {
      const payment = payload.message.successful_payment;
      const userId = payment.invoice_payload; // We stored user_id in payload
      const amount = payment.total_amount / 100; // Stars in kopecks

      if (!userId) {
        console.error('Missing user_id in payment payload');
        return new Response('Invalid payload', { status: 400 });
      }

      // Create deposit record
      const { error: depositError } = await supabaseClient
        .from('deposits')
        .insert({
          user_id: userId,
          amount: amount,
          payment_method: 'telegram_stars',
          status: 'completed',
        });

      if (depositError) {
        console.error('Error creating deposit:', depositError);
        throw depositError;
      }

      // Update user balance
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

        console.log(`Balance updated for user ${userId}: +${amount}`);

        // Send notification to user via Telegram
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        if (botToken && profile.telegram_id) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: profile.telegram_id,
              text: `✅ Баланс успешно пополнен на ${amount} ₽ через Telegram Stars\n\nВаш баланс: ${newBalance} ₽`,
            }),
          });
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in webhook-telegram-stars:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
