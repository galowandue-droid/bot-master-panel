import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users,
  ShoppingCart,
  Wallet,
  Package,
  TrendingUp,
  Download,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Dashboard() {
  // Mock data - replace with actual API calls
  const stats = {
    users: {
      total: 1247,
      today: 23,
      week: 156,
    },
    sales: {
      total: 892,
      today: 15,
      week: 98,
    },
    revenue: {
      total: 45680,
      today: 2340,
      week: 12560,
    },
    products: {
      total: 156,
      categories: 8,
      positions: 45,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Дашборд</h1>
            <p className="text-sm text-muted-foreground">
              Общая статистика и аналитика
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Скачать БД
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Пользователи"
            value={stats.users.total.toLocaleString()}
            change={`+${stats.users.today} сегодня`}
            changeType="positive"
            icon={Users}
            description={`${stats.users.week} за неделю`}
          />
          <StatsCard
            title="Продажи"
            value={stats.sales.total.toLocaleString()}
            change={`+${stats.sales.today} сегодня`}
            changeType="positive"
            icon={ShoppingCart}
            description={`${stats.sales.week} за неделю`}
          />
          <StatsCard
            title="Доход"
            value={`₽${stats.revenue.total.toLocaleString()}`}
            change={`+₽${stats.revenue.today.toLocaleString()} сегодня`}
            changeType="positive"
            icon={Wallet}
            description={`₽${stats.revenue.week.toLocaleString()} за неделю`}
          />
          <StatsCard
            title="Товары"
            value={stats.products.total}
            icon={Package}
            description={`${stats.products.categories} категорий, ${stats.products.positions} позиций`}
          />
        </div>

        {/* Charts & Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Динамика продаж
              </h3>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              График динамики (интеграция с Chart.js)
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Последние транзакции
            </h3>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Покупка #{1000 + i}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Пользователь @user{i}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      ₽{(Math.random() * 1000 + 100).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* System Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Статус системы
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Бот активен</p>
                <p className="text-xs text-muted-foreground">Работает нормально</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Платежи</p>
                <p className="text-xs text-muted-foreground">Все системы работают</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-success" />
              <div>
                <p className="text-sm font-medium text-foreground">База данных</p>
                <p className="text-xs text-muted-foreground">Подключена</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
