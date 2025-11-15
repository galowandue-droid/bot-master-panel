import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorMapper";

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "user";
  created_at: string;
}

export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      let query = supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserRole[];
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      // Get user info for logging
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, first_name")
        .eq("id", userId)
        .single();

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;

      // Log the role assignment
      const username = profile?.username || profile?.first_name || "Unknown";
      await supabase.from("logs").insert({
        level: "info",
        message: `Роль "${role}" назначена пользователю ${username}`,
        metadata: { user_id: userId, role, action: "assign_role" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Роль назначена",
        description: "Роль пользователя успешно изменена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      // Get user info for logging
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, first_name")
        .eq("id", userId)
        .single();

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      // Log the role removal
      const username = profile?.username || profile?.first_name || "Unknown";
      await supabase.from("logs").insert({
        level: "info",
        message: `Роль "${role}" удалена у пользователя ${username}`,
        metadata: { user_id: userId, role, action: "remove_role" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Роль удалена",
        description: "Роль пользователя успешно удалена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    },
  });
}
