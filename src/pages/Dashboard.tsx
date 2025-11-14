import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Users, ShoppingCart, TrendingUp, DollarSign, Package, Download, Send } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useStatistics } from "@/hooks/useStatistics";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { BroadcastDialog } from "@/components/broadcasts/BroadcastDialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Dashboard() {
  const { statistics, totals, isLoading } = useStatistics(30);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  const handleDownloadDB = async () => {
    setDownloading(true);
    try {
      const tables = ['profiles', 'categories', 'positions', 'items', 'purchases', 'deposits', 'statistics'];
      
      for (const table of tables) {
        const { data, error } = await supabase.functions.invoke('export-database', {
          body: { table }
        });

        if (error) throw error;

        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${table}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Успешно",
        description: "База данных экспортирована",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const chartData = statistics?.map((stat) => ({
    date: format(new Date(stat.date), "dd MMM", { locale: ru }),
    users: stat.new_users,
    purchases: stat.purchases_count,
    revenue: Number(stat.purchases_amount),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Панель управления
            </h1>
            <p className="text-sm text-muted-foreground">
              Обзор статистики за последние 30 дней
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary/20 hover:bg-primary/10"
            onClick={handleDownloadDB}
            disabled={downloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading ? "Загрузка..." : "Скачать БД"}
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Всего пользователей"
              value={totals?.users || 0}
              icon={Users}
              description={`+${totals?.newUsers || 0} новых`}
            />
            <StatsCard
              title="Продажи"
              value={totals?.purchases || 0}
              icon={ShoppingCart}
              description={`₽${(totals?.revenue || 0).toFixed(0)} выручка`}
            />
            <StatsCard
              title="Выручка"
              value={`₽${(totals?.revenue || 0).toFixed(0)}`}
              icon={DollarSign}
              description={`${totals?.purchases || 0} заказов`}
            />
            <StatsCard
              title="Пополнения"
              value={totals?.deposits || 0}
              icon={TrendingUp}
              description={`₽${(totals?.depositsAmount || 0).toFixed(0)} сумма`}
            />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6 border-border/40 shadow-lg hover:shadow-xl transition-shadow">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Новые пользователи
              </h3>
              <p className="text-sm text-muted-foreground">Регистрации по дням</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(250, 95%, 63%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(250, 95%, 63%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(250, 95%, 63%)"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    name="Пользователи"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-6 border-border/40 shadow-lg hover:shadow-xl transition-shadow">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-success" />
                Продажи и выручка
              </h3>
              <p className="text-sm text-muted-foreground">Динамика по дням</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="purchases"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    name="Продажи"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(280, 89%, 66%)"
                    strokeWidth={2}
                    name="Выручка (₽)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <RecentActivity />

        <Card className="p-6 border-border/40 shadow-lg">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Быстрые действия</h3>
            <p className="text-sm text-muted-foreground">Управление ботом</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <button 
              onClick={() => navigate('/catalog')}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left hover:shadow-md"
            >
              <div className="rounded-lg bg-primary/10 p-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">Добавить товары</div>
                <div className="text-sm text-muted-foreground">Пополнить каталог</div>
              </div>
            </button>
            <button 
              onClick={() => setBroadcastOpen(true)}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left hover:shadow-md"
            >
              <div className="rounded-lg bg-primary/10 p-3">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">Рассылка</div>
                <div className="text-sm text-muted-foreground">Отправить сообщение всем</div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/statistics')}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left hover:shadow-md"
            >
              <div className="rounded-lg bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">Отчеты</div>
                <div className="text-sm text-muted-foreground">Скачать статистику</div>
              </div>
            </button>
          </div>
        </Card>
      </div>

      <BroadcastDialog open={broadcastOpen} onOpenChange={setBroadcastOpen} />
    </div>
  );
}
