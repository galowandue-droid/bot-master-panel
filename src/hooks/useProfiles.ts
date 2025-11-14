import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  balance: number;
  is_blocked: boolean;
  created_at: string;
  purchases_count: number;
  total_spent: number;
}

export function useProfiles(searchQuery?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["profiles", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          purchases:purchases(count),
          total_spent:purchases(total_price)
        `)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,telegram_id.eq.${searchQuery}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include aggregated fields
      return data.map(profile => ({
        id: profile.id,
        telegram_id: profile.telegram_id,
        username: profile.username,
        first_name: profile.first_name,
        balance: Number(profile.balance || 0),
        is_blocked: profile.is_blocked || false,
        created_at: profile.created_at,
        purchases_count: profile.purchases?.[0]?.count || 0,
        total_spent: profile.total_spent?.reduce((sum: number, p: any) => sum + Number(p.total_price || 0), 0) || 0,
      })) as UserProfile[];
    },
  });
}

export function useUpdateBalance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data, error } = await supabase.rpc("update_user_balance", {
        user_id: userId,
        amount_change: amount,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Баланс обновлен",
        description: "Баланс пользователя успешно изменен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useToggleBlockUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: isBlocked })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: variables.isBlocked ? "Пользователь заблокирован" : "Пользователь разблокирован",
        description: "Статус пользователя успешно изменен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
