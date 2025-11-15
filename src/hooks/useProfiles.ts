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
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        const digitsOnly = searchQuery.replace(/\D/g, "");
        // If the query contains digits (even inside brackets), search by telegram_id only
        if (digitsOnly.length > 0) {
          query = query.or(`telegram_id.eq.${digitsOnly},username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%`);
        } else {
          query = query.or(`username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%`);
        }
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Fetch purchase counts and totals separately for each profile
      const profilesWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const { data: purchases, error: purchasesError } = await supabase
            .from("purchases")
            .select("total_price")
            .eq("user_id", profile.id);

          if (purchasesError) {
            console.error("Error fetching purchases:", purchasesError);
            return {
              ...profile,
              balance: Number(profile.balance || 0),
              is_blocked: profile.is_blocked || false,
              purchases_count: 0,
              total_spent: 0,
            };
          }

          return {
            id: profile.id,
            telegram_id: profile.telegram_id,
            username: profile.username,
            first_name: profile.first_name,
            balance: Number(profile.balance || 0),
            is_blocked: profile.is_blocked || false,
            created_at: profile.created_at,
            purchases_count: purchases.length,
            total_spent: purchases.reduce((sum, p) => sum + Number(p.total_price || 0), 0),
          };
        })
      );

      return profilesWithStats as UserProfile[];
    },
  });
}

export function useUpdateBalance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      // Get current balance
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", userId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = Number(profile.balance || 0) + amount;

      // Update balance
      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", userId);

      if (error) throw error;
      return newBalance;
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
    onMutate: async ({ userId, isBlocked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["profiles"] });
      
      // Snapshot previous value
      const previousProfiles = queryClient.getQueryData(["profiles"]);
      
      // Optimistically update
      queryClient.setQueryData(["profiles"], (old: any) => {
        if (!old) return old;
        return old.map((profile: UserProfile) =>
          profile.id === userId ? { ...profile, is_blocked: isBlocked } : profile
        );
      });
      
      return { previousProfiles };
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousProfiles) {
        queryClient.setQueryData(["profiles"], context.previousProfiles);
      }
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isBlocked ? "Пользователь заблокирован" : "Пользователь разблокирован",
        description: "Статус пользователя успешно изменен",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}
