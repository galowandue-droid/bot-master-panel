import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PurchaseHistoryItem {
  id: string;
  created_at: string;
  quantity: number;
  total_price: number;
  position: {
    name: string;
    price: number;
  };
  items: Array<{
    content: string;
  }>;
}

export const usePurchaseHistory = (userId: string | null) => {
  return useQuery({
    queryKey: ["purchase-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select(`
          id,
          created_at,
          quantity,
          total_price,
          position:positions(name, price),
          items:purchase_items(item:items(content))
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return purchases as unknown as PurchaseHistoryItem[];
    },
    enabled: !!userId,
  });
};
