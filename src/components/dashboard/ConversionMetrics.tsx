import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function ConversionMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["conversion-metrics"],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get users with purchases
      const { data: buyersData } = await supabase
        .from("purchases")
        .select("user_id");

      const uniqueBuyers = new Set(buyersData?.map(p => p.user_id)).size;

      // Get total purchases and revenue
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("total_price, quantity");

      const totalPurchases = purchasesData?.length || 0;
      const totalRevenue = purchasesData?.reduce((sum, p) => sum + p.total_price, 0) || 0;
      const averageCheck = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

      // Calculate conversion
      const conversion = totalUsers ? (uniqueBuyers / totalUsers) * 100 : 0;

      return {
        totalUsers: totalUsers || 0,
        uniqueBuyers,
        conversion: conversion.toFixed(1),
        averageCheck: Math.round(averageCheck),
        totalRevenue: Math.round(totalRevenue),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Конверсия</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{metrics?.conversion}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics?.uniqueBuyers} из {metrics?.totalUsers} купили
          </p>
        </CardContent>
        <div className="absolute bottom-0 right-0 w-24 h-24 -mr-8 -mb-8 opacity-5">
          <TrendingUp className="w-full h-full" />
        </div>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Покупатели</span>
            <Users className="h-4 w-4 text-success" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-success">{metrics?.uniqueBuyers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Уникальных покупателей
          </p>
        </CardContent>
        <div className="absolute bottom-0 right-0 w-24 h-24 -mr-8 -mb-8 opacity-5">
          <Users className="w-full h-full" />
        </div>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Средний чек</span>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{metrics?.averageCheck} ₽</div>
          <p className="text-xs text-muted-foreground mt-1">
            На одну покупку
          </p>
        </CardContent>
        <div className="absolute bottom-0 right-0 w-24 h-24 -mr-8 -mb-8 opacity-5">
          <ShoppingCart className="w-full h-full" />
        </div>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Выручка</span>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{metrics?.totalRevenue} ₽</div>
          <p className="text-xs text-muted-foreground mt-1">
            Всего заработано
          </p>
        </CardContent>
        <div className="absolute bottom-0 right-0 w-24 h-24 -mr-8 -mb-8 opacity-5">
          <DollarSign className="w-full h-full" />
        </div>
      </Card>
    </div>
  );
}
