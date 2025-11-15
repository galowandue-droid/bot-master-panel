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

    // Fetch all logs
    const { data: logs, error } = await supabaseClient
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!logs || logs.length === 0) {
      // Return empty CSV instead of 404
      const headers = ['created_at', 'level', 'message', 'metadata'];
      const csvContent = headers.join(',');
      
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Convert to CSV
    const headers = ['created_at', 'level', 'message', 'metadata'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        `"${log.created_at}"`,
        `"${log.level}"`,
        `"${log.message.replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.metadata || {}).replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting logs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});