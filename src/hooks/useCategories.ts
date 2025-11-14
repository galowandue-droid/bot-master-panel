import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  position: number;
  is_visible: boolean;
  created_at: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parent_id?: string;
  position?: number;
  is_visible?: boolean;
}

export const useCategories = () => {
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (category: CreateCategoryInput) => {
      const { data, error } = await supabase
        .from("categories")
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Категория создана" });
    },
    onError: () => {
      toast({ title: "Ошибка при создании категории", variant: "destructive" });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Категория обновлена" });
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении категории", variant: "destructive" });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Категория удалена" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении категории", variant: "destructive" });
    },
  });

  return {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};