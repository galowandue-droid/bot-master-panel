import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Statistic {
  id: string;
  date: string;
  new_users: number;
  total_users: number;
  purchases_count: number;
  purchases_amount: number;
  deposits_count: number;
  deposits_amount: number;
  created_at: string;
}

export const useStatistics = (days: number = 30) => {
  const { data: statistics, isLoading } = useQuery({
    queryKey: ["statistics", days],
    queryFn: async () => {
      const date = new Date();
      date.setDate(date.getDate() - days);

      const { data, error } = await supabase
        .from("statistics")
        .select("*")
        .gte("date", date.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;
      return data as Statistic[];
    },
  });

  const totals = statistics?.reduce(
    (acc, stat) => ({
      users: stat.total_users,
      newUsers: acc.newUsers + stat.new_users,
      purchases: acc.purchases + stat.purchases_count,
      revenue: acc.revenue + Number(stat.purchases_amount),
      deposits: acc.deposits + stat.deposits_count,
      depositsAmount: acc.depositsAmount + Number(stat.deposits_amount),
    }),
    { users: 0, newUsers: 0, purchases: 0, revenue: 0, deposits: 0, depositsAmount: 0 }
  );

  return {
    statistics,
    totals,
    isLoading,
  };
};