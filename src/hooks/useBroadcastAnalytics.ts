import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BroadcastAnalytics {
  broadcast_id: string;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
  button_clicks: {
    button_id: string;
    button_text: string;
    clicks: number;
  }[];
}

export const useBroadcastAnalytics = (broadcastId?: string) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["broadcast-analytics", broadcastId],
    queryFn: async () => {
      if (!broadcastId) return null;

      // Get broadcast data
      const { data: broadcast, error: broadcastError } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("id", broadcastId)
        .single();

      if (broadcastError) throw broadcastError;

      // Get button clicks
      const { data: buttonClicks, error: clicksError } = await supabase
        .from("broadcast_button_clicks" as any)
        .select(`
          button_id,
          broadcast_buttons (
            text
          )
        `)
        .eq("broadcast_id", broadcastId);

      if (clicksError) throw clicksError;

      // Aggregate button clicks
      const buttonClickMap = new Map<string, { text: string; clicks: number }>();
      buttonClicks?.forEach((click: any) => {
        const buttonId = click.button_id;
        const buttonText = click.broadcast_buttons?.text || 'Unknown';
        
        if (!buttonClickMap.has(buttonId)) {
          buttonClickMap.set(buttonId, { text: buttonText, clicks: 0 });
        }
        buttonClickMap.get(buttonId)!.clicks++;
      });

      const buttonClicksArray = Array.from(buttonClickMap.entries()).map(([button_id, data]) => ({
        button_id,
        button_text: data.text,
        clicks: data.clicks,
      }));

      const broadcastData = broadcast as any;
      const openRate = broadcastData.delivered_count > 0 
        ? (broadcastData.opened_count / broadcastData.delivered_count) * 100 
        : 0;

      const clickRate = broadcastData.delivered_count > 0 
        ? (broadcastData.clicked_count / broadcastData.delivered_count) * 100 
        : 0;

      return {
        broadcast_id: broadcastId,
        total_sent: broadcast.sent_count,
        total_delivered: broadcastData.delivered_count || 0,
        total_opened: broadcastData.opened_count || 0,
        total_clicked: broadcastData.clicked_count || 0,
        open_rate: openRate,
        click_rate: clickRate,
        button_clicks: buttonClicksArray,
      } as BroadcastAnalytics;
    },
    enabled: !!broadcastId,
  });

  return {
    analytics,
    isLoading,
  };
};
