import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TableStat {
  name: string;
  records: number;
}

export const useTableStats = () => {
  return useQuery({
    queryKey: ["table-stats"],
    queryFn: async () => {
      const tables = ["profiles", "categories", "positions", "items", "purchases", "deposits", "logs"];
      
      const stats: TableStat[] = await Promise.all(
        tables.map(async (tableName) => {
          const { count, error } = await supabase
            .from(tableName as any)
            .select("*", { count: "exact", head: true });

          if (error) {
            console.error(`Error fetching count for ${tableName}:`, error);
            return { name: tableName, records: 0 };
          }

          return { name: tableName, records: count || 0 };
        })
      );

      const totalRecords = stats.reduce((sum, stat) => sum + stat.records, 0);

      return {
        tables: stats,
        totalRecords,
      };
    },
    refetchInterval: 30000,
  });
};
