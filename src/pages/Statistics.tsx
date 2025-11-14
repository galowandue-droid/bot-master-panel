import { useState, useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, ShoppingCart, DollarSign, Wallet, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Statistics() {
  const [period, setPeriod] = useState("month");

  const stats = useMemo(() => ({
    day: {
      newUsers: 45,
      purchases: 23,
      revenue: 3420,
      deposits: 12,
      depositsAmount: 5600,
      growth: 12.5,
    },
    week: {
      newUsers: 234,
      purchases: 156,
      revenue: 24530,
      deposits: 89,
      depositsAmount: 42100,
      growth: 18.3,
    },
    month: {
      newUsers: 892,
      purchases: 634,
      revenue: 98450,
      deposits: 367,
      depositsAmount: 165200,
      growth: 24.7,
    },
    all: {
      newUsers: 8945,
      purchases: 6334,
      revenue: 945230,
      deposits: 3421,
      depositsAmount: 1523400,
      growth: 156.2,
    },
  }), []);

  const currentStats = useMemo(() => stats[period as keyof typeof stats], [period, stats]);

  const salesData = useMemo(() => [
    { date: "01", sales: 45, revenue: 6800 },
    { date: "05", sales: 52, revenue: 7900 },
    { date: "10", sales: 38, revenue: 5700 },
    { date: "15", sales: 71, revenue: 10800 },
    { date: "20", sales: 63, revenue: 9500 },
    { date: "25", sales: 89, revenue: 13500 },
    { date: "30", sales: 95, revenue: 14300 },
  ], []);

  const usersGrowthData = useMemo(() => [
    { month: "Июл", users: 145 },
    { month: "Авг", users: 234 },
    { month: "Сен", users: 389 },
    { month: "Окт", users: 567 },
    { month: "Ноя", users: 892 },
    { month: "Дек", users: 1245 },
  ], []);

  const categoriesData = useMemo(() => [
    { name: "Промокоды", value: 35, color: "hsl(250, 95%, 63%)" },
    { name: "Аккаунты", value: 28, color: "hsl(280, 89%, 66%)" },
    { name: "Подписки", value: 22, color: "hsl(142, 76%, 36%)" },
    { name: "Игры", value: 15, color: "hsl(38, 92%, 50%)" },
  ], []);

  const paymentMethodsData = useMemo(() => [
    { method: "CryptoBot", amount: 45200 },
    { method: "ЮMoney", amount: 38100 },
    { method: "Telegram Stars", amount: 28900 },
    { method: "Карты", amount: 22800 },
  ], []);

  const topProducts = useMemo(() => [
    { name: "Промокод Самокат", category: "Промокоды", sales: 145, revenue: 21750 },
    { name: "Spotify Premium", category: "Аккаунты", sales: 112, revenue: 16800 },
    { name: "Discord Nitro", category: "Подписки", sales: 98, revenue: 14700 },
    { name: "Netflix 4K", category: "Подписки", sales: 87, revenue: 13050 },
    { name: "Steam Wallet", category: "Игры", sales: 76, revenue: 11400 },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Статистика
            </h1>
            <p className="text-sm text-muted-foreground">Детальная аналитика и визуализация данных</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={period} onValueChange={setPeriod} className="space-y-6">
          <TabsList className="bg-card border shadow-sm">
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
                description={
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success">+{currentStats.growth}%</span>
                  </div>
                }
              />
              <StatsCard
                title="Продажи"
                value={currentStats.purchases.toString()}
                icon={ShoppingCart}
                description="Количество заказов"
              />
              <StatsCard
                title="Выручка"
                value={`₽${currentStats.revenue.toLocaleString()}`}
                icon={DollarSign}
                description={
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>Средний чек: ₽{Math.round(currentStats.revenue / currentStats.purchases)}</span>
                  </div>
                }
              />
              <StatsCard
                title="Пополнения"
                value={currentStats.deposits.toString()}
                icon={Wallet}
                description={`На сумму ₽${currentStats.depositsAmount.toLocaleString()}`}
              />
            </div>

            {/* Графики продаж и пользователей */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* График продаж */}
              <Card className="overflow-hidden border-border/40 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-br from-card to-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Динамика продаж
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Продажи и выручка за период</p>
                    </div>
                    <Badge variant="default" className="bg-gradient-primary">
                      +{currentStats.growth}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(250, 95%, 63%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(250, 95%, 63%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(280, 89%, 66%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(280, 89%, 66%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        animationDuration={200}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="hsl(250, 95%, 63%)"
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        name="Продажи"
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(280, 89%, 66%)"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Выручка (₽)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* График роста пользователей */}
              <Card className="overflow-hidden border-border/40 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-br from-card to-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-success" />
                        Рост пользователей
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Новые регистрации по месяцам</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usersGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        animationDuration={200}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar 
                        dataKey="users" 
                        fill="hsl(142, 76%, 36%)" 
                        radius={[8, 8, 0, 0]} 
                        name="Пользователи"
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Распределение по категориям и методам оплаты */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Продажи по категориям */}
              <Card className="overflow-hidden border-border/40 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-card to-muted/20">
                  <CardTitle>Популярные категории</CardTitle>
                  <p className="text-sm text-muted-foreground">Распределение продаж по типам товаров</p>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoriesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {categoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip animationDuration={200} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Методы оплаты */}
              <Card className="overflow-hidden border-border/40 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-card to-muted/20">
                  <CardTitle>Способы оплаты</CardTitle>
                  <p className="text-sm text-muted-foreground">Популярность платежных систем</p>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={paymentMethodsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="method" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                      <Tooltip
                        animationDuration={200}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="hsl(250, 95%, 63%)" 
                        radius={[0, 8, 8, 0]} 
                        name="Сумма (₽)"
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Топ товаров */}
            <Card className="overflow-hidden border-border/40 shadow-lg">
              <CardHeader className="bg-gradient-to-br from-card to-muted/20">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Топ товаров
                </CardTitle>
                <p className="text-sm text-muted-foreground">Самые продаваемые позиции за период</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/20 to-transparent border border-border/40 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{product.sales} продаж</p>
                        <p className="text-sm text-muted-foreground">₽{product.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
