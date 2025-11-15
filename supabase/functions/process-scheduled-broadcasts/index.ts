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

    console.log('Processing scheduled broadcasts...');

    // Get all pending broadcasts that are scheduled for now or earlier
    const { data: broadcasts, error: broadcastsError } = await supabaseClient
      .from('broadcasts')
      .select('*')
      .eq('status', 'pending')
      .not('schedule_at', 'is', null)
      .lte('schedule_at', new Date().toISOString());

    if (broadcastsError) {
      console.error('Error fetching broadcasts:', broadcastsError);
      throw broadcastsError;
    }

    console.log(`Found ${broadcasts?.length || 0} broadcasts to process`);

    const results = [];

    for (const broadcast of broadcasts || []) {
      try {
        console.log(`Processing broadcast ${broadcast.id}`);

        // Call send-broadcast function for each scheduled broadcast
        const sendResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-broadcast`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ broadcast_id: broadcast.id }),
          }
        );

        const result = await sendResponse.json();
        
        if (sendResponse.ok) {
          console.log(`Successfully processed broadcast ${broadcast.id}`);
          results.push({
            broadcast_id: broadcast.id,
            success: true,
            ...result,
          });
        } else {
          console.error(`Failed to process broadcast ${broadcast.id}:`, result);
          
          // Update broadcast status to failed
          await supabaseClient
            .from('broadcasts')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', broadcast.id);

          results.push({
            broadcast_id: broadcast.id,
            success: false,
            error: result.error,
          });
        }
      } catch (error: any) {
        console.error(`Error processing broadcast ${broadcast.id}:`, error);
        
        // Update broadcast status to failed
        await supabaseClient
          .from('broadcasts')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', broadcast.id);

        results.push({
          broadcast_id: broadcast.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in process-scheduled-broadcasts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
