import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendItemsToTelegram(telegramId: number, items: any[], positionName: string) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const itemsText = items.map((item, index) => 
    `${index + 1}. ${item.content}`
  ).join('\n\n');

  const message = `✅ Ваша покупка: ${positionName}\n\nКоличество: ${items.length} шт.\n\n${itemsText}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
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
    console.error('Error sending items to Telegram:', error);
    throw error;
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

    const { purchase_id } = await req.json();

    if (!purchase_id) {
      return new Response(
        JSON.stringify({ error: 'purchase_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get purchase details
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from('purchases')
      .select(`
        *,
        user:profiles!purchases_user_id_fkey(telegram_id, first_name),
        position:positions!purchases_position_id_fkey(name)
      `)
      .eq('id', purchase_id)
      .single();

    if (purchaseError || !purchase) {
      console.error('Purchase not found:', purchaseError);
      return new Response(
        JSON.stringify({ error: 'Purchase not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get purchased items
    const { data: purchaseItems, error: itemsError } = await supabaseClient
      .from('purchase_items')
      .select('item:items!purchase_items_item_id_fkey(id, content)')
      .eq('purchase_id', purchase_id);

    if (itemsError || !purchaseItems || purchaseItems.length === 0) {
      console.error('Items not found:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Items not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const items = purchaseItems.map(pi => pi.item).filter(Boolean);

    if (!purchase.user?.telegram_id) {
      return new Response(
        JSON.stringify({ error: 'User has no telegram_id' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send items to Telegram
    await sendItemsToTelegram(
      purchase.user.telegram_id,
      items,
      purchase.position?.name || 'Unknown'
    );

    console.log(`Items delivered for purchase ${purchase_id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Items delivered successfully',
        items_count: items.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in deliver-items function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
