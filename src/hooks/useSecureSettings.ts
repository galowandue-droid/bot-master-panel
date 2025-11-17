import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Hook for managing secure payment tokens via edge function
// Tokens are stored in secure_bot_settings table (SERVICE_ROLE only)
// This prevents client-side exposure of payment API tokens

export const useSecureSettings = () => {
  const queryClient = useQueryClient();

  const updateSecureToken = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      // Call edge function to update secure setting with SERVICE_ROLE
      const { data, error } = await supabase.functions.invoke('update-secure-setting', {
        body: { key, value }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-connection-status"] });
      toast({
        title: "Токен сохранен",
        description: "Платежная система обновлена",
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

  const checkConnection = useMutation({
    mutationFn: async (paymentMethod: string) => {
      // Call edge function to check connection status
      const { data, error } = await supabase.functions.invoke('check-payment-connection', {
        body: { payment_method: paymentMethod }
      });

      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка проверки",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    updateSecureToken,
    checkConnection,
  };
};
