import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkSubscription(telegramId: number, channelId: string) {
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
    // User is subscribed if they are: creator, administrator, member
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

    const { telegram_id, user_id } = await req.json();

    if (!telegram_id && !user_id) {
      return new Response(
        JSON.stringify({ error: 'telegram_id or user_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's telegram_id if user_id provided
    let telegramId = telegram_id;
    if (!telegramId && user_id) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('telegram_id')
        .eq('id', user_id)
        .single();
      
      telegramId = profile?.telegram_id;
    }

    if (!telegramId) {
      return new Response(
        JSON.stringify({ 
          error: 'User has no telegram_id',
          all_subscribed: false,
          subscriptions: {}
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

    if (!channels || channels.length === 0) {
      return new Response(
        JSON.stringify({ 
          all_subscribed: true,
          subscriptions: {},
          channels: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check subscription for each channel
    const subscriptions: Record<string, boolean> = {};
    let allSubscribed = true;

    for (const channel of channels) {
      const isSubscribed = await checkSubscription(telegramId, channel.channel_id);
      subscriptions[channel.channel_id] = isSubscribed;
      
      if (!isSubscribed) {
        allSubscribed = false;
      }

      // Update subscription status in database
      if (user_id) {
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
    }

    return new Response(
      JSON.stringify({ 
        all_subscribed: allSubscribed,
        subscriptions,
        channels: channels.map(c => ({
          id: c.channel_id,
          name: c.channel_name,
          username: c.channel_username,
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error checking channel subscriptions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
