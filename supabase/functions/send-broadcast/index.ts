import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BroadcastButton {
  text: string;
  url?: string;
  row: number;
  position: number;
}

// Format buttons for Telegram inline keyboard
function formatButtonsForTelegram(buttons: BroadcastButton[]) {
  const rows = new Map<number, Array<{ text: string; url?: string }>>();
  
  buttons.forEach(btn => {
    if (!rows.has(btn.row)) {
      rows.set(btn.row, []);
    }
    rows.get(btn.row)!.push({
      text: btn.text,
      ...(btn.url && { url: btn.url })
    });
  });

  return Array.from(rows.values()).sort((a, b) => {
    const rowA = buttons.find(btn => btn.text === a[0].text)?.row || 0;
    const rowB = buttons.find(btn => btn.text === b[0].text)?.row || 0;
    return rowA - rowB;
  });
}

// Send message via Telegram Bot API
async function sendTelegramMessage(
  chatId: number,
  message: string,
  mediaUrl?: string,
  mediaType?: string,
  mediaCaption?: string,
  buttons?: BroadcastButton[]
) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const baseUrl = `https://api.telegram.org/bot${botToken}`;
  
  const keyboard = buttons && buttons.length > 0 ? {
    inline_keyboard: formatButtonsForTelegram(buttons)
  } : undefined;

  let method = 'sendMessage';
  let body: any = {
    chat_id: chatId,
    text: message,
  };

  if (mediaUrl && mediaType) {
    const caption = mediaCaption || message;
    
    switch (mediaType) {
      case 'photo':
        method = 'sendPhoto';
        body = {
          chat_id: chatId,
          photo: mediaUrl,
          caption: caption,
        };
        break;
      case 'video':
        method = 'sendVideo';
        body = {
          chat_id: chatId,
          video: mediaUrl,
          caption: caption,
        };
        break;
      case 'document':
        method = 'sendDocument';
        body = {
          chat_id: chatId,
          document: mediaUrl,
          caption: caption,
        };
        break;
    }
  }

  if (keyboard) {
    body.reply_markup = keyboard;
  }

  const response = await fetch(`${baseUrl}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return await response.json();
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

    const { broadcast_id } = await req.json();

    if (!broadcast_id) {
      return new Response(
        JSON.stringify({ error: 'broadcast_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabaseClient
      .from('broadcasts')
      .select('*')
      .eq('id', broadcast_id)
      .single();

    if (broadcastError) throw broadcastError;

    console.log('Processing broadcast:', broadcast.id);

    // Get buttons for this broadcast
    const { data: buttons } = await supabaseClient
      .from('broadcast_buttons')
      .select('*')
      .eq('broadcast_id', broadcast.id)
      .order('row')
      .order('position');

    // Update status to sending
    await supabaseClient
      .from('broadcasts')
      .update({ status: 'sending' })
      .eq('id', broadcast.id);

    // Get target users based on segment
    let profilesQuery = supabaseClient
      .from('profiles')
      .select('telegram_id')
      .not('telegram_id', 'is', null);

    if (broadcast.segment_id) {
      // Get users in this segment
      const { data: segmentMembers } = await supabaseClient
        .from('user_segment_members')
        .select('user_id')
        .eq('segment_id', broadcast.segment_id);

      const userIds = segmentMembers?.map(m => m.user_id) || [];
      
      if (userIds.length === 0) {
        console.log('No users in segment');
        await supabaseClient
          .from('broadcasts')
          .update({
            status: 'completed',
            sent_count: 0,
            failed_count: 0,
            completed_at: new Date().toISOString(),
          })
          .eq('id', broadcast.id);

        return new Response(
          JSON.stringify({ 
            success: true,
            broadcast_id: broadcast.id,
            sent_count: 0,
            failed_count: 0,
            message: 'No users in segment'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      profilesQuery = profilesQuery.in('id', userIds);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) throw profilesError;

    let sentCount = 0;
    let failedCount = 0;

    console.log(`Sending broadcast to ${profiles?.length || 0} users`);
    
    // Send to each user
    for (const profile of profiles || []) {
      try {
        await sendTelegramMessage(
          profile.telegram_id!,
          broadcast.message,
          broadcast.media_url,
          broadcast.media_type,
          broadcast.media_caption,
          buttons || []
        );
        sentCount++;
        console.log(`Sent to user ${profile.telegram_id}`);
      } catch (error: any) {
        failedCount++;
        const errorMessage = error.message || String(error);
        
        // Check if it's a "chat not found" error
        if (errorMessage.includes('chat not found')) {
          console.warn(`User ${profile.telegram_id} has not started the bot or blocked it`);
        } else {
          console.error(`Failed to send to user ${profile.telegram_id}:`, error);
        }
      }
    }

    // Update broadcast status
    const { error: updateError } = await supabaseClient
      .from('broadcasts')
      .update({
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', broadcast.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true,
        broadcast_id: broadcast.id,
        sent_count: sentCount,
        failed_count: failedCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending broadcast:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
