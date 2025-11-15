import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export function ConversionFunnel() {
  const { data: funnelData, isLoading } = useQuery({
    queryKey: ["conversion-funnel"],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get users who made deposits
      const { data: depositors } = await supabase
        .from("deposits")
        .select("user_id")
        .eq("status", "completed");

      const uniqueDepositors = new Set(depositors?.map((d) => d.user_id) || []);

      // Get users who made purchases
      const { data: purchasers } = await supabase
        .from("purchases")
        .select("user_id");

      const uniquePurchasers = new Set(purchasers?.map((p) => p.user_id) || []);

      // Get users who made repeat purchases
      const purchasesByUser = purchasers?.reduce((acc, p) => {
        acc[p.user_id] = (acc[p.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const repeatPurchasers = Object.values(purchasesByUser).filter((count) => count > 1).length;

      return {
        totalUsers: totalUsers || 0,
        depositors: uniqueDepositors.size,
        purchasers: uniquePurchasers.size,
        repeatPurchasers,
      };
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  const stages = [
    { label: "Всего пользователей", value: funnelData?.totalUsers || 0 },
    { label: "Пополнили баланс", value: funnelData?.depositors || 0 },
    { label: "Совершили покупку", value: funnelData?.purchasers || 0 },
    { label: "Повторные покупки", value: funnelData?.repeatPurchasers || 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Воронка конверсии</CardTitle>
        <CardDescription>Путь пользователя от регистрации до повторных покупок</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const prevStage = stages[index - 1];
            const conversionRate = prevStage
              ? ((stage.value / prevStage.value) * 100).toFixed(1)
              : "100.0";

            return (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{stage.label}</p>
                      <p className="text-2xl font-bold">{stage.value}</p>
                    </div>
                  </div>
                  {index > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Конверсия</p>
                      <p className="text-xl font-bold text-success">{conversionRate}%</p>
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/60 transition-all"
                    style={{
                      width: `${((stage.value / (stages[0].value || 1)) * 100).toFixed(1)}%`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-foreground drop-shadow-md">
                      {((stage.value / (stages[0].value || 1)) * 100).toFixed(1)}% от начала
                    </span>
                  </div>
                </div>

                {index < stages.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
