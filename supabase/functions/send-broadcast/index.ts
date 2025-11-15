import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { retryWithBackoff, withTimeout, createLogger, createErrorResponse } from "../_shared/edge-utils.ts";

const logger = createLogger('send-broadcast');

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
  let body: any = { chat_id: chatId, text: message };

  if (mediaUrl && mediaType) {
    const caption = mediaCaption || message;
    switch (mediaType) {
      case 'photo':
        method = 'sendPhoto';
        body = { chat_id: chatId, photo: mediaUrl, caption };
        break;
      case 'video':
        method = 'sendVideo';
        body = { chat_id: chatId, video: mediaUrl, caption };
        break;
      case 'document':
        method = 'sendDocument';
        body = { chat_id: chatId, document: mediaUrl, caption };
        break;
    }
  }

  if (keyboard) body.reply_markup = keyboard;

  return await retryWithBackoff(async () => {
    return await withTimeout(
      fetch(`${baseUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Telegram API error: ${error}`);
        }
        return response.json();
      }),
      15000
    );
  }, { maxRetries: 2, initialDelay: 1000 });
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
      logger.error('Missing broadcast_id');
      return new Response(JSON.stringify({ error: 'broadcast_id is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logger.info('Starting broadcast', { broadcast_id });

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      logger.error('Unauthorized');
      throw new Error('Unauthorized');
    }

    const { data: broadcast, error: broadcastError } = await supabaseClient
      .from('broadcasts')
      .select('*')
      .eq('id', broadcast_id)
      .single();

    if (broadcastError || !broadcast) {
      logger.error('Broadcast not found', { broadcast_id });
      throw new Error('Broadcast not found');
    }

    const { data: buttons } = await supabaseClient
      .from('broadcast_buttons')
      .select('*')
      .eq('broadcast_id', broadcast_id)
      .order('row', { ascending: true })
      .order('position', { ascending: true });

    let targetUsers;
    if (broadcast.segment_id) {
      const { data: segmentMembers } = await supabaseClient
        .from('user_segment_members')
        .select('user_id, profiles!inner(*)')
        .eq('segment_id', broadcast.segment_id);
      targetUsers = segmentMembers?.map(m => m.profiles) || [];
    } else {
      const { data: allUsers } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('is_blocked', false);
      targetUsers = allUsers || [];
    }

    logger.info('Target users', { count: targetUsers.length });

    await supabaseClient
      .from('broadcasts')
      .update({ status: 'sending' })
      .eq('id', broadcast_id);

    let sentCount = 0;
    let failedCount = 0;

    for (const user of targetUsers) {
      if (!user.telegram_id) {
        failedCount++;
        continue;
      }

      try {
        await sendTelegramMessage(
          user.telegram_id,
          broadcast.message,
          broadcast.media_url,
          broadcast.media_type,
          broadcast.media_caption,
          buttons || undefined
        );
        sentCount++;
        logger.info('Message sent', { user_id: user.id });
      } catch (error) {
        failedCount++;
        logger.error('Send failed', { user_id: user.id, error: String(error) });
      }
    }

    await supabaseClient
      .from('broadcasts')
      .update({
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', broadcast_id);

    logger.info('Broadcast completed', { broadcast_id, sentCount, failedCount });

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Broadcast failed', { error: String(error) });
    return createErrorResponse(error as Error);
  }
});
