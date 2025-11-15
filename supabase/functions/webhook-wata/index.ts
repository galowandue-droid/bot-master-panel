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
    console.log('Wata webhook received:', payload);

    // Wata webhook format (customize based on actual API documentation)
    // Example: { status: 'success', order_id: '...', user_id: '...', amount: 100 }
    
    if (payload.status === 'success' || payload.status === 'paid') {
      const userId = payload.user_id || payload.merchant_data?.user_id;
      const amount = parseFloat(payload.amount);

      if (!userId || !amount) {
        console.error('Missing user_id or amount in webhook');
        return new Response('Invalid payload', { status: 400 });
      }

      // Create deposit record
      const { error: depositError } = await supabaseClient
        .from('deposits')
        .insert({
          user_id: userId,
          amount: amount,
          payment_method: 'wata',
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
              text: `✅ Баланс успешно пополнен на ${amount} ₽\n\nВаш баланс: ${newBalance} ₽`,
            }),
          });
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in webhook-wata:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
