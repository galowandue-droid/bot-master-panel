import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  content: string;
  variables: string[];
  media_url?: string;
  media_type?: 'photo' | 'video' | 'document';
  media_caption?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: string;
  content: string;
  variables?: string[];
  media_url?: string;
  media_type?: 'photo' | 'video' | 'document';
  media_caption?: string;
  is_active?: boolean;
}

export const useMessageTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as MessageTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data, error } = await supabase
        .from("message_templates" as any)
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: "Шаблон создан" });
    },
    onError: () => {
      toast({ title: "Ошибка при создании шаблона", variant: "destructive" });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: Partial<MessageTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("message_templates" as any)
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: "Шаблон обновлен" });
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении шаблона", variant: "destructive" });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("message_templates" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: "Шаблон удален" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении шаблона", variant: "destructive" });
    },
  });

  const incrementUsage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('increment_template_usage' as any, { template_id: id });
      if (error) throw error;
    },
  });

  const renderTemplate = (template: MessageTemplate, variables: Record<string, string>) => {
    let result = template.content;
    template.variables.forEach(varName => {
      const value = variables[varName] || `{${varName}}`;
      result = result.replace(new RegExp(`\\{${varName}\\}`, 'g'), value);
    });
    return result;
  };

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
    renderTemplate,
  };
};
