import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WebhookLog {
  id: string;
  webhook_name: string;
  request_body: any;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  processing_time_ms: number | null;
  ip_address: string | null;
  created_at: string;
}

export const useWebhookLogs = (filters?: {
  webhookName?: string;
  status?: number;
}) => {
  return useQuery({
    queryKey: ["webhook-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.webhookName) {
        query = query.eq("webhook_name", filters.webhookName);
      }
      if (filters?.status) {
        query = query.eq("response_status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WebhookLog[];
    },
  });
};
