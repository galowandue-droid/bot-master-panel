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

    const { table } = await req.json();

    // Fetch all data from the specified table
    const { data, error } = await supabaseClient
      .from(table)
      .select('*');

    if (error) {
      console.error('Error fetching data:', error);
      throw error;
    }

    // If no data, return empty CSV with table name as header
    if (!data || data.length === 0) {
      const csvContent = `# No data in table: ${table}\n# Export date: ${new Date().toISOString()}`;
      
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${table}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${table}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting database:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});