import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const useAuditLog = (filters?: {
  action?: string;
  resourceType?: string;
  userId?: string;
}) => {
  return useQuery({
    queryKey: ["audit-log", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.action) {
        query = query.eq("action", filters.action);
      }
      if (filters?.resourceType) {
        query = query.eq("resource_type", filters.resourceType);
      }
      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });
};
