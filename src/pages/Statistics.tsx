import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, ShoppingCart, DollarSign, Wallet, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Statistics() {
  const [period, setPeriod] = useState("day");

  const stats = {
    day: {
      newUsers: 45,
      purchases: 23,
      revenue: 3420,
      deposits: 12,
      depositsAmount: 5600,
    },
    week: {
      newUsers: 234,
      purchases: 156,
      revenue: 24530,
      deposits: 89,
      depositsAmount: 42100,
    },
    month: {
      newUsers: 892,
      purchases: 634,
      revenue: 98450,
      deposits: 367,
      depositsAmount: 165200,
    },
    all: {
      newUsers: 8945,
      purchases: 6334,
      revenue: 945230,
      deposits: 3421,
      depositsAmount: 1523400,
    },
  };

  const currentStats = stats[period as keyof typeof stats];

  const topProducts = [
    { name: "Промокод Самокат", category: "Промокоды", sales: 45 },
    { name: "Spotify Premium", category: "Аккаунты", sales: 32 },
    { name: "Discord Nitro", category: "Подписки", sales: 28 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
            <p className="text-sm text-muted-foreground">Детальная аналитика по периодам</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={period} onValueChange={setPeriod} className="space-y-6">
          <TabsList>
            <TabsTrigger value="day">За день</TabsTrigger>
            <TabsTrigger value="week">За неделю</TabsTrigger>
            <TabsTrigger value="month">За месяц</TabsTrigger>
            <TabsTrigger value="all">Всё время</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Новые пользователи"
                value={currentStats.newUsers.toString()}
                icon={Users}
                description="За выбранный период"
              />
              <StatsCard
                title="Продажи"
                value={currentStats.purchases.toString()}
                icon={ShoppingCart}
                description="Количество покупок"
              />
              <StatsCard
                title="Выручка"
                value={`₽${currentStats.revenue.toLocaleString()}`}
                icon={DollarSign}
                description="Общая сумма"
              />
              <StatsCard
                title="Пополнения"
                value={currentStats.deposits.toString()}
                icon={Wallet}
                description={`На сумму ₽${currentStats.depositsAmount.toLocaleString()}`}
              />
            </div>

            {/* Additional cards for "day" period */}
            {period === "day" && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Payment Systems */}
                <Card>
                  <CardHeader>
                    <CardTitle>Платежные системы</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">CryptoBot</span>
                        <span className="font-medium text-foreground">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">ЮMoney</span>
                        <span className="font-medium text-foreground">25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">Telegram Stars</span>
                        <span className="font-medium text-foreground">10%</span>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Топ товаров</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {product.sales} продаж
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              📊 Статистика обновляется автоматически каждые 5 минут. Последнее обновление:{" "}
              {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}