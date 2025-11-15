import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { retryWithBackoff, withTimeout, createLogger, createErrorResponse } from "../_shared/edge-utils.ts";

const logger = createLogger('process-purchase');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkChannelSubscription(telegramId: number, channelId: string) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  return await retryWithBackoff(async () => {
    return await withTimeout(
      fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelId}&user_id=${telegramId}`)
        .then(async (response) => {
          const data = await response.json();
          if (!data.ok) return false;
          return ['creator', 'administrator', 'member'].includes(data.result?.status);
        }),
      5000
    );
  }, { maxRetries: 2, initialDelay: 500 });
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

    const { user_id, position_id, quantity, telegram_id } = await req.json();
    logger.info('Purchase started', { user_id, position_id, quantity });

    if (!user_id || !position_id || !quantity) {
      logger.warn('Missing parameters');
      return new Response(JSON.stringify({ error: 'user_id, position_id, and quantity required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let userTelegramId = telegram_id;
    if (!userTelegramId) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('telegram_id')
        .eq('id', user_id)
        .single();
      userTelegramId = profile?.telegram_id;
    }

    if (!userTelegramId) {
      logger.warn('No telegram_id', { user_id });
      return new Response(JSON.stringify({ error: 'User has no telegram_id', can_purchase: false }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: channels } = await supabaseClient
      .from('required_channels')
      .select('*')
      .eq('is_active', true);

    if (channels && channels.length > 0) {
      const unsubscribed = [];
      for (const channel of channels) {
        try {
          const isSubscribed = await checkChannelSubscription(userTelegramId, channel.channel_id);
          if (!isSubscribed) {
            unsubscribed.push({
              id: channel.channel_id,
              name: channel.channel_name,
              username: channel.channel_username,
            });
          }
          await supabaseClient
            .from('user_channel_subscriptions')
            .upsert({
              user_id,
              channel_id: channel.channel_id,
              is_subscribed: isSubscribed,
              last_checked_at: new Date().toISOString(),
            }, { onConflict: 'user_id,channel_id' });
        } catch (error) {
          logger.error('Channel check failed', { channel_id: channel.channel_id, error: String(error) });
        }
      }

      if (unsubscribed.length > 0) {
        logger.warn('Not subscribed', { user_id, unsubscribed });
        return new Response(JSON.stringify({ 
          can_purchase: false,
          error: 'Not subscribed to required channels',
          required_channels: unsubscribed,
        }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const { data: position } = await supabaseClient
      .from('positions')
      .select('*')
      .eq('id', position_id)
      .single();

    if (!position) {
      logger.error('Position not found', { position_id });
      throw new Error('Position not found');
    }

    const { data: availableItems } = await supabaseClient
      .from('items')
      .select('id')
      .eq('position_id', position_id)
      .eq('is_sold', false)
      .limit(quantity);

    if (!availableItems || availableItems.length < quantity) {
      logger.warn('Not enough items', { requested: quantity, available: availableItems?.length });
      return new Response(JSON.stringify({ error: 'Not enough items' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const totalPrice = position.price * quantity;

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('balance')
      .eq('id', user_id)
      .single();

    if (!profile || profile.balance < totalPrice) {
      logger.warn('Insufficient balance', { balance: profile?.balance, required: totalPrice });
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: purchase } = await supabaseClient
      .from('purchases')
      .insert({ user_id, position_id, quantity, total_price: totalPrice })
      .select()
      .single();

    if (!purchase) throw new Error('Failed to create purchase');

    const itemIds = availableItems.map(item => item.id);
    await supabaseClient
      .from('items')
      .update({
        is_sold: true,
        sold_at: new Date().toISOString(),
        buyer_id: user_id,
      })
      .in('id', itemIds);

    const purchaseItems = itemIds.map(item_id => ({ purchase_id: purchase.id, item_id }));
    await supabaseClient.from('purchase_items').insert(purchaseItems);

    await supabaseClient
      .from('profiles')
      .update({ balance: profile.balance - totalPrice })
      .eq('id', user_id);

    logger.info('Purchase completed', { purchase_id: purchase.id, total_price: totalPrice });

    try {
      await supabaseClient.functions.invoke('deliver-items', {
        body: { purchase_id: purchase.id }
      });
    } catch (deliveryError) {
      logger.error('Delivery failed', { error: String(deliveryError) });
    }

    return new Response(JSON.stringify({ success: true, purchase_id: purchase.id, can_purchase: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Purchase failed', { error: String(error) });
    return createErrorResponse(error as Error);
  }
});
