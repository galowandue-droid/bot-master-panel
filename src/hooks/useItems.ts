import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Item {
  id: string;
  content: string;
  position_id: string;
  is_sold: boolean;
  buyer_id: string | null;
  sold_at: string | null;
  created_at: string;
}

export interface CreateItemInput {
  content: string;
  position_id: string;
}

export const useItems = (positionId?: string) => {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["items", positionId],
    queryFn: async () => {
      let query = supabase.from("items").select("*").order("created_at", { ascending: false });
      
      if (positionId) {
        query = query.eq("position_id", positionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Item[];
    },
  });

  const createItem = useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const { data, error } = await supabase
        .from("items")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({
        title: "Товар добавлен",
        description: "Товар успешно добавлен в каталог",
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

  const createItemsBulk = useMutation({
    mutationFn: async (inputs: CreateItemInput[]) => {
      const { data, error } = await supabase
        .from("items")
        .insert(inputs)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({
        title: "Товары добавлены",
        description: `Успешно добавлено товаров: ${data.length} шт.`,
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

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({
        title: "Товар удален",
        description: "Товар успешно удален",
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
    items,
    isLoading,
    createItem,
    createItemsBulk,
    deleteItem,
  };
};