import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RequiredChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_username?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChannelInput {
  channel_id: string;
  channel_name: string;
  channel_username?: string;
  is_active?: boolean;
}

export interface ChannelSubscriptionStatus {
  all_subscribed: boolean;
  subscriptions: Record<string, boolean>;
  channels: Array<{
    id: string;
    name: string;
    username?: string;
  }>;
}

export const useRequiredChannels = () => {
  const queryClient = useQueryClient();

  const { data: channels, isLoading } = useQuery({
    queryKey: ["required-channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("required_channels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RequiredChannel[];
    },
  });

  const createChannel = useMutation({
    mutationFn: async (input: CreateChannelInput) => {
      const { data, error } = await supabase
        .from("required_channels")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["required-channels"] });
      toast({ title: "Канал добавлен" });
    },
    onError: () => {
      toast({ title: "Ошибка при добавлении канала", variant: "destructive" });
    },
  });

  const updateChannel = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RequiredChannel> & { id: string }) => {
      const { error } = await supabase
        .from("required_channels")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["required-channels"] });
      toast({ title: "Канал обновлен" });
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении канала", variant: "destructive" });
    },
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("required_channels")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["required-channels"] });
      toast({ title: "Канал удален" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении канала", variant: "destructive" });
    },
  });

  const checkSubscription = useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke('check-channel-subscription', {
        body: { user_id }
      });

      if (error) throw error;
      return data as ChannelSubscriptionStatus;
    },
  });

  return {
    channels,
    isLoading,
    createChannel,
    updateChannel,
    deleteChannel,
    checkSubscription,
  };
};
