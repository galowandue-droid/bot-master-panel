import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BroadcastVariant {
  id: string;
  broadcast_id: string;
  variant_name: string;
  message: string;
  media_url?: string;
  media_type?: 'photo' | 'video' | 'document';
  media_caption?: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  click_through_rate: number;
  open_rate: number;
  is_winner: boolean;
  created_at: string;
}

export interface CreateVariantInput {
  broadcast_id: string;
  variant_name: string;
  message: string;
  media_url?: string;
  media_type?: 'photo' | 'video' | 'document';
  media_caption?: string;
}

export const useBroadcastVariants = (broadcastId?: string) => {
  const queryClient = useQueryClient();

  const { data: variants, isLoading } = useQuery({
    queryKey: ["broadcast-variants", broadcastId],
    queryFn: async () => {
      if (!broadcastId) return [];
      
      const { data, error } = await supabase
        .from("broadcast_variants" as any)
        .select("*")
        .eq("broadcast_id", broadcastId)
        .order("variant_name");

      if (error) throw error;
      return data as unknown as BroadcastVariant[];
    },
    enabled: !!broadcastId,
  });

  const createVariant = useMutation({
    mutationFn: async (input: CreateVariantInput) => {
      const { data, error } = await supabase
        .from("broadcast_variants" as any)
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-variants"] });
      toast({ title: "Вариант создан" });
    },
    onError: () => {
      toast({ title: "Ошибка при создании варианта", variant: "destructive" });
    },
  });

  const selectWinner = useMutation({
    mutationFn: async (variantId: string) => {
      const variant = variants?.find(v => v.id === variantId);
      if (!variant) throw new Error("Variant not found");

      // Set this variant as winner
      await supabase
        .from("broadcast_variants" as any)
        .update({ is_winner: true } as any)
        .eq("id", variantId);

      // Update broadcast with winning variant
      await supabase
        .from("broadcasts")
        .update({ winning_variant_id: variantId } as any)
        .eq("id", variant.broadcast_id);

      // Unset other variants as winners
      await supabase
        .from("broadcast_variants" as any)
        .update({ is_winner: false } as any)
        .eq("broadcast_id", variant.broadcast_id)
        .neq("id", variantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-variants"] });
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
      toast({ title: "Победитель выбран" });
    },
    onError: () => {
      toast({ title: "Ошибка при выборе победителя", variant: "destructive" });
    },
  });

  const getBestVariant = () => {
    if (!variants || variants.length === 0) return null;
    return variants.reduce((best, current) => 
      current.click_through_rate > best.click_through_rate ? current : best
    );
  };

  return {
    variants,
    isLoading,
    createVariant,
    selectWinner,
    getBestVariant,
  };
};
