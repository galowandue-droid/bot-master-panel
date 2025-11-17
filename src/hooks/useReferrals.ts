import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_amount: number;
  reward_given_at?: string;
  created_at: string;
  referrer?: {
    username?: string;
    first_name?: string;
    telegram_id?: number;
  };
  referred?: {
    username?: string;
    first_name?: string;
    telegram_id?: number;
  };
}

export interface ReferralStats {
  total: number;
  pending: number;
  completed: number;
  rewarded: number;
  totalRewards: number;
}

export const useReferrals = () => {
  const queryClient = useQueryClient();

  const { data: referrals, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          *,
          referrer:profiles!referrals_referrer_id_fkey(username, first_name, telegram_id),
          referred:profiles!referrals_referred_id_fkey(username, first_name, telegram_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Referral[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("status, reward_amount");

      if (error) throw error;

      const stats: ReferralStats = {
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        completed: data.filter(r => r.status === 'completed').length,
        rewarded: data.filter(r => r.status === 'rewarded').length,
        totalRewards: data.reduce((sum, r) => sum + (Number(r.reward_amount) || 0), 0),
      };

      return stats;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["referral-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_bot_settings")
        .select("key, value")
        .in("key", [
          "referral_enabled",
          "referral_reward_type",
          "referral_reward_amount",
          "referral_min_purchase"
        ]);

      if (error) throw error;

      return data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const promises = Object.entries(settings).map(([key, value]) =>
        supabase
          .from("public_bot_settings")
          .upsert({ key, value }, { onConflict: "key" })
      );

      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-settings"] });
      toast({ title: "Настройки сохранены" });
    },
    onError: () => {
      toast({ 
        title: "Ошибка при сохранении настроек", 
        variant: "destructive" 
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'completed' | 'rewarded' }) => {
      const updateData: any = { status };
      
      if (status === 'rewarded') {
        updateData.reward_given_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("referrals")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
      toast({ title: "Статус обновлен" });
    },
    onError: () => {
      toast({ 
        title: "Ошибка при обновлении статуса", 
        variant: "destructive" 
      });
    },
  });

  const deleteReferral = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("referrals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
      toast({ title: "Реферал удален" });
    },
    onError: () => {
      toast({ 
        title: "Ошибка при удалении", 
        variant: "destructive" 
      });
    },
  });

  return {
    referrals,
    stats,
    settings,
    isLoading,
    updateSettings,
    updateStatus,
    deleteReferral,
  };
};
