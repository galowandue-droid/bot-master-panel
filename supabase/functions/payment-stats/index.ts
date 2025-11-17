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

    // Get payment tokens from secure_bot_settings (SERVICE_ROLE only)
    const { data: secureSettings, error: secureError } = await supabaseClient
      .from('secure_bot_settings')
      .select('*')
      .in('key', ['cryptobot_token', 'yoomoney_token']);

    if (secureError) {
      console.error('Error fetching secure settings:', secureError);
      throw secureError;
    }

    // Get public settings from public_bot_settings
    const { data: publicSettings, error: publicError } = await supabaseClient
      .from('public_bot_settings')
      .select('*')
      .in('key', ['cryptobot_enabled', 'yoomoney_enabled', 'telegram_stars_enabled', 'cards_enabled']);

    if (publicError) {
      console.error('Error fetching public settings:', publicError);
      throw publicError;
    }

    const settings = [...(secureSettings || []), ...(publicSettings || [])];

    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>) || {};

    const paymentStats = [];

    // CryptoBot stats
    if (settingsMap['cryptobot_enabled'] === 'true' && settingsMap['cryptobot_token']) {
      try {
        const response = await fetch('https://pay.crypt.bot/api/getMe', {
          headers: {
            'Crypto-Pay-API-Token': settingsMap['cryptobot_token']
          }
        });
        const data = await response.json();
        
        if (data.ok) {
          const balanceResponse = await fetch('https://pay.crypt.bot/api/getBalance', {
            headers: {
              'Crypto-Pay-API-Token': settingsMap['cryptobot_token']
            }
          });
          const balanceData = await balanceResponse.json();
          
          paymentStats.push({
            system: 'CryptoBot',
            enabled: true,
            balance: balanceData.result || [],
            status: 'connected'
          });
        }
      } catch (error) {
        console.error('CryptoBot API error:', error);
        paymentStats.push({
          system: 'CryptoBot',
          enabled: true,
          balance: [],
          status: 'error',
          error: 'Failed to fetch data'
        });
      }
    } else {
      paymentStats.push({
        system: 'CryptoBot',
        enabled: false,
        balance: [],
        status: 'disabled'
      });
    }

    // ЮMoney stats (placeholder - requires OAuth setup)
    if (settingsMap['yoomoney_enabled'] === 'true' && settingsMap['yoomoney_token']) {
      paymentStats.push({
        system: 'ЮMoney',
        enabled: true,
        balance: 'Requires OAuth setup',
        status: 'connected'
      });
    } else {
      paymentStats.push({
        system: 'ЮMoney',
        enabled: false,
        balance: 0,
        status: 'disabled'
      });
    }

    // Get local database statistics for deposits
    const { data: deposits, error: depositsError } = await supabaseClient
      .from('deposits')
      .select('payment_method, amount, status, created_at');

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError);
    }

    // Aggregate deposits by payment method (only active systems)
    const allowedMethods = ['cryptobot', 'telegram_stars', 'wata', 'heleket'];
    const depositsByMethod = deposits?.reduce((acc, deposit) => {
      const method = deposit.payment_method || 'unknown';
      // Skip old payment methods
      if (!allowedMethods.includes(method)) {
        return acc;
      }
      if (!acc[method]) {
        acc[method] = {
          count: 0,
          total: 0,
          completed: 0
        };
      }
      acc[method].count++;
      acc[method].total += Number(deposit.amount);
      if (deposit.status === 'completed') {
        acc[method].completed++;
      }
      return acc;
    }, {} as Record<string, { count: number; total: number; completed: number }>) || {};

    // Aggregate deposits by day for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const depositsByDay = deposits?.reduce((acc, deposit) => {
      const date = new Date(deposit.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          count: 0,
          total: 0
        };
      }
      acc[date].count++;
      acc[date].total += Number(deposit.amount);
      return acc;
    }, {} as Record<string, { count: number; total: number }>) || {};

    const dailyStats = last7Days.map(date => ({
      date,
      count: depositsByDay[date]?.count || 0,
      total: depositsByDay[date]?.total || 0
    }));

    // Calculate average check
    const totalDeposits = deposits?.filter(d => d.status === 'completed').length || 0;
    const totalAmount = deposits?.filter(d => d.status === 'completed').reduce((sum, d) => sum + Number(d.amount), 0) || 0;
    const averageCheck = totalDeposits > 0 ? totalAmount / totalDeposits : 0;

    return new Response(
      JSON.stringify({
        paymentStats,
        depositsByMethod,
        dailyStats,
        averageCheck,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error fetching payment stats:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
