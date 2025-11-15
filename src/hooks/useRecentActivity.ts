import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Activity {
  type: string;
  id: string;
  created_at: string;
  user_id: string;
  username: string | null;
  first_name: string | null;
  item_name: string;
  amount: number;
}

export const useRecentActivity = (limit: number = 5) => {
  const queryClient = useQueryClient();
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ["recent-activity", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recent_activity")
        .select("*")
        .limit(limit);

      if (error) throw error;
      return data as Activity[];
    },
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // Realtime subscription for new purchases and deposits
  useEffect(() => {
    const purchasesChannel = supabase
      .channel('recent-purchases')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchases'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
        }
      )
      .subscribe();

    const depositsChannel = supabase
      .channel('recent-deposits')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deposits'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(purchasesChannel);
      supabase.removeChannel(depositsChannel);
    };
  }, [queryClient]);

  return {
    activities,
    isLoading,
  };
};