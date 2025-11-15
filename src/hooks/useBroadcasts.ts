import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BroadcastButton {
  id?: string;
  text: string;
  url?: string;
  row: number;
  position: number;
}

export interface Broadcast {
  id: string;
  message: string;
  media_url?: string;
  media_type?: 'photo' | 'video' | 'document';
  media_caption?: string;
  status: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
  completed_at?: string;
  created_by?: string;
  segment_id?: string;
  schedule_at?: string;
  buttons?: BroadcastButton[];
  segment?: {
    name: string;
  };
}

export interface CreateBroadcastInput {
  message: string;
  media_url?: string;
  media_type?: 'photo' | 'video' | 'document';
  media_caption?: string;
  segment_id?: string;
  schedule_at?: string;
  buttons?: Omit<BroadcastButton, 'id'>[];
}

export const useBroadcasts = () => {
  const queryClient = useQueryClient();

  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ["broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcasts")
        .select(`
          *,
          segment:user_segments(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch buttons for each broadcast
      const broadcastsWithButtons = await Promise.all(
        (data || []).map(async (broadcast) => {
          const { data: buttons } = await supabase
            .from("broadcast_buttons")
            .select("*")
            .eq("broadcast_id", broadcast.id)
            .order("row")
            .order("position");

          return {
            ...broadcast,
            buttons: buttons || [],
          };
        })
      );

      return broadcastsWithButtons as Broadcast[];
    },
  });

  const createBroadcast = useMutation({
    mutationFn: async (input: CreateBroadcastInput) => {
      const { buttons, ...broadcastData } = input;

      const { data: broadcast, error: broadcastError } = await supabase
        .from("broadcasts")
        .insert([broadcastData])
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      // Insert buttons if provided
      if (buttons && buttons.length > 0) {
        const buttonsWithBroadcastId = buttons.map((btn) => ({
          ...btn,
          broadcast_id: broadcast.id,
        }));

        const { error: buttonsError } = await supabase
          .from("broadcast_buttons")
          .insert(buttonsWithBroadcastId);

        if (buttonsError) throw buttonsError;
      }

      // If not scheduled, send immediately
      if (!broadcast.schedule_at) {
        const { error: sendError } = await supabase.functions.invoke('send-broadcast', {
          body: { broadcast_id: broadcast.id }
        });

        if (sendError) {
          console.error('Error sending broadcast:', sendError);
          toast({ title: "Ошибка при отправке рассылки", variant: "destructive" });
        }
      }

      return broadcast;
    },
    onSuccess: (broadcast) => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
      if (broadcast.schedule_at) {
        toast({ title: "Рассылка запланирована" });
      } else {
        toast({ title: "Рассылка отправляется" });
      }
    },
    onError: () => {
      toast({ title: "Ошибка при создании рассылки", variant: "destructive" });
    },
  });

  const deleteBroadcast = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("broadcasts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
      toast({ title: "Рассылка удалена" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении рассылки", variant: "destructive" });
    },
  });

  return {
    broadcasts,
    isLoading,
    createBroadcast,
    deleteBroadcast,
  };
};
