import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkChannelSubscription(telegramId: number, channelId: string) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelId}&user_id=${telegramId}`
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return false;
    }

    const status = data.result?.status;
    return ['creator', 'administrator', 'member'].includes(status);
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
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

    const { user_id, position_id, quantity, telegram_id } = await req.json();

    if (!user_id || !position_id || !quantity) {
      return new Response(
        JSON.stringify({ error: 'user_id, position_id, and quantity are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's telegram_id if not provided
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
      return new Response(
        JSON.stringify({ 
          error: 'User has no telegram_id',
          can_purchase: false
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all active required channels
    const { data: channels, error: channelsError } = await supabaseClient
      .from('required_channels')
      .select('*')
      .eq('is_active', true);

    if (channelsError) throw channelsError;

    // Check subscription for each channel
    if (channels && channels.length > 0) {
      const unsubscribedChannels = [];

      for (const channel of channels) {
        const isSubscribed = await checkChannelSubscription(userTelegramId, channel.channel_id);
        
        if (!isSubscribed) {
          unsubscribedChannels.push({
            id: channel.channel_id,
            name: channel.channel_name,
            username: channel.channel_username,
          });
        }

        // Update subscription status in database
        await supabaseClient
          .from('user_channel_subscriptions')
          .upsert({
            user_id,
            channel_id: channel.channel_id,
            is_subscribed: isSubscribed,
            last_checked_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,channel_id'
          });
      }

      if (unsubscribedChannels.length > 0) {
        return new Response(
          JSON.stringify({ 
            can_purchase: false,
            error: 'User is not subscribed to all required channels',
            required_channels: unsubscribedChannels,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Get position details
    const { data: position, error: positionError } = await supabaseClient
      .from('positions')
      .select('*')
      .eq('id', position_id)
      .single();

    if (positionError) throw positionError;

    if (!position) {
      return new Response(
        JSON.stringify({ error: 'Position not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user has enough balance
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('balance')
      .eq('id', user_id)
      .single();

    if (profileError) throw profileError;

    const totalPrice = Number(position.price) * quantity;
    
    if (Number(profile.balance) < totalPrice) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient balance',
          can_purchase: false,
          required_balance: totalPrice,
          current_balance: profile.balance,
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get available items
    const { data: availableItems, error: itemsError } = await supabaseClient
      .from('items')
      .select('*')
      .eq('position_id', position_id)
      .eq('is_sold', false)
      .limit(quantity);

    if (itemsError) throw itemsError;

    if (!availableItems || availableItems.length < quantity) {
      return new Response(
        JSON.stringify({ 
          error: 'Not enough items in stock',
          can_purchase: false,
          available_quantity: availableItems?.length || 0,
          requested_quantity: quantity,
        }),
        { 
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from('purchases')
      .insert({
        user_id,
        position_id,
        quantity,
        total_price: totalPrice,
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Mark items as sold and link to purchase
    const itemIds = availableItems.map(item => item.id);
    
    const { error: updateItemsError } = await supabaseClient
      .from('items')
      .update({
        is_sold: true,
        buyer_id: user_id,
        sold_at: new Date().toISOString(),
      })
      .in('id', itemIds);

    if (updateItemsError) throw updateItemsError;

    // Link items to purchase
    const purchaseItems = itemIds.map(item_id => ({
      purchase_id: purchase.id,
      item_id,
    }));

    const { error: purchaseItemsError } = await supabaseClient
      .from('purchase_items')
      .insert(purchaseItems);

    if (purchaseItemsError) throw purchaseItemsError;

    // Deduct balance
    const { error: balanceError } = await supabaseClient
      .from('profiles')
      .update({
        balance: Number(profile.balance) - totalPrice,
      })
      .eq('id', user_id);

    if (balanceError) throw balanceError;

    // Get purchased items content
    const purchasedItemsContent = availableItems.map(item => item.content);

    // Deliver items to user via Telegram in background
    try {
      await supabaseClient.functions.invoke('deliver-items', {
        body: { purchase_id: purchase.id }
      });
    } catch (deliveryError) {
      console.error('Error delivering items:', deliveryError);
      // Don't fail the purchase if delivery fails - it can be retried
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        can_purchase: true,
        purchase_id: purchase.id,
        items: purchasedItemsContent,
        total_price: totalPrice,
        remaining_balance: Number(profile.balance) - totalPrice,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error processing purchase:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        can_purchase: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
