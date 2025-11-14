import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentSystemStats {
  system: string;
  enabled: boolean;
  balance: any;
  status: string;
  error?: string;
}

export interface PaymentStats {
  paymentStats: PaymentSystemStats[];
  depositsByMethod: Record<string, {
    count: number;
    total: number;
    completed: number;
  }>;
  success: boolean;
}

export const usePaymentStats = () => {
  return useQuery({
    queryKey: ["payment-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('payment-stats');

      if (error) throw error;
      return data as PaymentStats;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
