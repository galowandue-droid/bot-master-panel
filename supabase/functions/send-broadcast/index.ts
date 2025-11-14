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

    const { message, media_url } = await req.json();

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
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

    // Create broadcast record
    const { data: broadcast, error: broadcastError } = await supabaseClient
      .from('broadcasts')
      .insert({
        message,
        media_url,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (broadcastError) throw broadcastError;

    console.log('Broadcast created:', broadcast.id);

    // Get all active profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('telegram_id')
      .not('telegram_id', 'is', null);

    if (profilesError) throw profilesError;

    let sentCount = 0;
    let failedCount = 0;

    // Here you would integrate with your Telegram bot API
    // For now, we'll just simulate the sending process
    console.log(`Sending broadcast to ${profiles?.length || 0} users`);
    
    // Simulate sending (replace with actual Telegram API calls)
    sentCount = profiles?.length || 0;

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