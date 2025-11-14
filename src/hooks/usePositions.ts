import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Position {
  id: string;
  name: string;
  price: number;
  category_id: string;
  description?: string;
  photo_url?: string;
  product_type: "account" | "promo" | "link";
  position: number;
  is_visible: boolean;
  created_at: string;
}

export interface CreatePositionInput {
  name: string;
  price: number;
  category_id: string;
  description?: string;
  photo_url?: string;
  product_type?: "account" | "promo" | "link";
  position?: number;
  is_visible?: boolean;
}

export const usePositions = (categoryId?: string) => {
  const queryClient = useQueryClient();

  const { data: positions, isLoading } = useQuery({
    queryKey: ["positions", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("positions")
        .select("*")
        .order("position", { ascending: true });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Position[];
    },
  });

  const createPosition = useMutation({
    mutationFn: async (position: CreatePositionInput) => {
      const { data, error } = await supabase
        .from("positions")
        .insert([position])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({ title: "Позиция создана" });
    },
    onError: () => {
      toast({ title: "Ошибка при создании позиции", variant: "destructive" });
    },
  });

  const updatePosition = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Position> & { id: string }) => {
      const { data, error } = await supabase
        .from("positions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({ title: "Позиция обновлена" });
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении позиции", variant: "destructive" });
    },
  });

  const deletePosition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("positions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({ title: "Позиция удалена" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении позиции", variant: "destructive" });
    },
  });

  return {
    positions,
    isLoading,
    createPosition,
    updatePosition,
    deletePosition,
  };
};