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

    // Get payment system tokens from bot_settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('bot_settings')
      .select('*')
      .in('key', ['cryptobot_token', 'cryptobot_enabled', 'yoomoney_token', 'yoomoney_enabled', 'telegram_stars_enabled', 'cards_enabled']);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }

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
      .select('payment_method, amount, status');

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError);
    }

    // Aggregate deposits by payment method
    const depositsByMethod = deposits?.reduce((acc, deposit) => {
      if (!acc[deposit.payment_method || 'unknown']) {
        acc[deposit.payment_method || 'unknown'] = {
          count: 0,
          total: 0,
          completed: 0
        };
      }
      acc[deposit.payment_method].count++;
      acc[deposit.payment_method].total += Number(deposit.amount);
      if (deposit.status === 'completed') {
        acc[deposit.payment_method].completed++;
      }
      return acc;
    }, {} as Record<string, { count: number; total: number; completed: number }>) || {};

    return new Response(
      JSON.stringify({
        paymentStats,
        depositsByMethod,
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
