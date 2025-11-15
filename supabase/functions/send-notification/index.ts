import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendTelegramNotification(chatId: number, message: string) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
}

async function notifyAdmins(supabaseClient: any, message: string) {
  // Get all admin users
  const { data: adminRoles } = await supabaseClient
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (!adminRoles || adminRoles.length === 0) {
    console.log('No admin users found');
    return;
  }

  const adminIds = adminRoles.map((r: any) => r.user_id);

  // Get admin profiles with telegram_id
  const { data: admins } = await supabaseClient
    .from('profiles')
    .select('telegram_id')
    .in('id', adminIds)
    .not('telegram_id', 'is', null);

  if (!admins || admins.length === 0) {
    console.log('No admins with telegram_id found');
    return;
  }

  // Send notification to each admin
  for (const admin of admins) {
    try {
      await sendTelegramNotification(admin.telegram_id, message);
    } catch (error) {
      console.error(`Failed to notify admin ${admin.telegram_id}:`, error);
    }
  }
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

    const { type, data, user_id, telegram_id } = await req.json();

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'type is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let message = '';

    switch (type) {
      case 'purchase': {
        const { position_name, quantity, total_price, username } = data;
        message = `🛒 <b>Новая покупка!</b>\n\n` +
                 `Товар: ${position_name}\n` +
                 `Количество: ${quantity}\n` +
                 `Сумма: ${total_price} ₽\n` +
                 `Покупатель: @${username || 'неизвестно'}`;
        
        // Notify admins
        await notifyAdmins(supabaseClient, message);
        
        // Notify user if telegram_id provided
        if (telegram_id) {
          const userMessage = `✅ <b>Покупка успешно завершена!</b>\n\n` +
                             `Товар: ${position_name}\n` +
                             `Количество: ${quantity}\n` +
                             `Сумма: ${total_price} ₽`;
          await sendTelegramNotification(telegram_id, userMessage);
        }
        break;
      }

      case 'deposit': {
        const { amount, payment_method } = data;
        if (telegram_id) {
          message = `✅ <b>Баланс пополнен!</b>\n\n` +
                   `Сумма: ${amount} ₽\n` +
                   `Метод: ${payment_method}`;
          await sendTelegramNotification(telegram_id, message);
        }
        break;
      }

      case 'referral_reward': {
        const { reward_amount } = data;
        if (telegram_id) {
          message = `🎁 <b>Реферальное вознаграждение!</b>\n\n` +
                   `Ваш реферал совершил покупку.\n` +
                   `Вы получили: ${reward_amount} ₽`;
          await sendTelegramNotification(telegram_id, message);
        }
        break;
      }

      case 'broadcast_completed': {
        const { sent_count, failed_count } = data;
        message = `📨 <b>Рассылка завершена</b>\n\n` +
                 `Отправлено: ${sent_count}\n` +
                 `Ошибок: ${failed_count}`;
        await notifyAdmins(supabaseClient, message);
        break;
      }

      case 'low_stock': {
        const { position_name, available_count } = data;
        message = `⚠️ <b>Низкий остаток товара!</b>\n\n` +
                 `Товар: ${position_name}\n` +
                 `Осталось: ${available_count} шт.`;
        await notifyAdmins(supabaseClient, message);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown notification type' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    console.log(`Notification sent: ${type}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
