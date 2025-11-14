import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  });

  return {
    activities,
    isLoading,
  };
};