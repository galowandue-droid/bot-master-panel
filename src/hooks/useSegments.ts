import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface UserSegment {
  id: string;
  name: string;
  description?: string;
  conditions: {
    hasBalance?: boolean;
    minBalance?: number;
    hasPurchases?: boolean;
    minPurchases?: number;
    isBlocked?: boolean;
    registeredAfter?: string;
    registeredBefore?: string;
  };
  created_at: string;
  updated_at: string;
  memberCount?: number;
}

export interface CreateSegmentInput {
  name: string;
  description?: string;
  conditions: UserSegment['conditions'];
}

export const useSegments = () => {
  const queryClient = useQueryClient();

  const { data: segments, isLoading } = useQuery({
    queryKey: ["user-segments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_segments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts for each segment
      const segmentsWithCounts = await Promise.all(
        (data || []).map(async (segment) => {
          const { count } = await supabase
            .from("user_segment_members")
            .select("*", { count: "exact", head: true })
            .eq("segment_id", segment.id);

          return {
            ...segment,
            memberCount: count || 0,
          };
        })
      );

      return segmentsWithCounts as UserSegment[];
    },
  });

  const createSegment = useMutation({
    mutationFn: async (input: CreateSegmentInput) => {
      const { data, error } = await supabase
        .from("user_segments")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-segments"] });
      toast({ title: "Сегмент создан" });
    },
    onError: () => {
      toast({ title: "Ошибка при создании сегмента", variant: "destructive" });
    },
  });

  const updateSegment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserSegment> & { id: string }) => {
      const { data, error } = await supabase
        .from("user_segments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-segments"] });
      toast({ title: "Сегмент обновлен" });
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении сегмента", variant: "destructive" });
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_segments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-segments"] });
      toast({ title: "Сегмент удален" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении сегмента", variant: "destructive" });
    },
  });

  const calculateSegmentSize = useMutation({
    mutationFn: async (conditions: UserSegment['conditions']) => {
      // Build query based on conditions
      let query = supabase.from("profiles").select("id", { count: "exact", head: true });

      if (conditions.hasBalance) {
        query = query.gt("balance", 0);
      }
      if (conditions.minBalance) {
        query = query.gte("balance", conditions.minBalance);
      }
      if (conditions.isBlocked !== undefined) {
        query = query.eq("is_blocked", conditions.isBlocked);
      }
      if (conditions.registeredAfter) {
        query = query.gte("created_at", conditions.registeredAfter);
      }
      if (conditions.registeredBefore) {
        query = query.lte("created_at", conditions.registeredBefore);
      }

      const { count, error } = await query;
      if (error) throw error;

      return count || 0;
    },
  });

  return {
    segments,
    isLoading,
    createSegment,
    updateSegment,
    deleteSegment,
    calculateSegmentSize,
  };
};
