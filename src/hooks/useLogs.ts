import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Log {
  id: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export const useLogs = () => {
  const queryClient = useQueryClient();

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Log[];
    },
  });

  const clearLogs = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      toast({
        title: "Логи очищены",
        description: "Все логи успешно удалены",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    logs,
    isLoading,
    refetch,
    clearLogs,
  };
};