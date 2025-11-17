import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function TopProducts() {
  const { data: topProducts, isLoading } = useQuery({
    queryKey: ["top-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          position_id,
          quantity,
          total_price,
          positions (
            name,
            price
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Aggregate by position
      const productMap = new Map();
      data?.forEach((purchase: any) => {
        const positionId = purchase.position_id;
        const existing = productMap.get(positionId);
        
        if (existing) {
          existing.count += purchase.quantity;
          existing.revenue += purchase.total_price;
        } else {
          productMap.set(positionId, {
            id: positionId,
            name: purchase.positions?.name || "Неизвестный товар",
            count: purchase.quantity,
            revenue: purchase.total_price,
            price: purchase.positions?.price || 0,
          });
        }
      });

      // Convert to array and sort by count
      return Array.from(productMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-3 xs:px-6 pt-3 xs:pt-6 pb-2 xs:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm xs:text-base">
            <Package className="h-4 w-4 xs:h-5 xs:w-5" />
            Топ товаров
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 xs:space-y-4 px-3 xs:px-6 pb-3 xs:pb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 xs:h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!topProducts || topProducts.length === 0) {
    return (
      <Card>
        <CardHeader className="px-3 xs:px-6 pt-3 xs:pt-6 pb-2 xs:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm xs:text-base">
            <Package className="h-4 w-4 xs:h-5 xs:w-5" />
            Топ товаров
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 xs:px-6 pb-3 xs:pb-6">
          <p className="text-xs xs:text-sm text-muted-foreground">Нет данных о продажах</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-3 xs:px-6 pt-3 xs:pt-6 pb-2 xs:pb-3">
        <CardTitle className="flex items-center gap-2 text-sm xs:text-base">
          <Package className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />
          Топ товаров
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 xs:space-y-3 px-3 xs:px-6 pb-3 xs:pb-6">
        {topProducts.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center gap-2 xs:gap-4 p-2 xs:p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 rounded-full bg-primary/10 text-primary text-xs xs:text-sm font-bold">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-muted-foreground">
                <span>{product.count} продаж</span>
                <span>•</span>
                <span className="text-success font-medium">
                  {product.revenue.toFixed(0)} ₽
                </span>
              </div>
            </div>
            {index === 0 && (
              <Badge variant="default" className="shrink-0 text-[10px] xs:text-xs px-1.5 xs:px-2 py-0.5">
                <TrendingUp className="h-2.5 w-2.5 xs:h-3 xs:w-3 mr-0.5 xs:mr-1" />
                #1
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
