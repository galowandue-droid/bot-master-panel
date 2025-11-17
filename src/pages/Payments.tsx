import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wallet, TrendingUp, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePaymentStats } from "@/hooks/usePaymentStats";
import { EmptyState } from "@/components/EmptyState";
import { useMemo, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Payments() {
  const { data: paymentStats, isLoading, refetch: refetchStats } = usePaymentStats();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('deposits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deposits'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Новый платеж!",
              description: `Поступил платеж на сумму ${payload.new.amount} ₽`,
            });
          }
          
          refetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchStats();
      toast({
        title: "Обновлено",
        description: "Статистика успешно обновлена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статистику",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const depositStats = useMemo(() => {
    if (!paymentStats?.depositsByMethod) return [];

    return Object.entries(paymentStats.depositsByMethod).map(([method, stats]) => ({
      method,
      count: stats.count,
      total: stats.total,
      completed: stats.completed,
      averageCheck: Math.round(stats.total / stats.count),
    }));
  }, [paymentStats]);

  const hasData = paymentStats?.dailyStats && paymentStats.dailyStats.length > 0;

  const chartData = useMemo(() => {
    if (!paymentStats?.dailyStats) return [];
    
    return paymentStats.dailyStats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      amount: stat.total,
    }));
  }, [paymentStats]);

  const totalRevenue = useMemo(() => {
    return depositStats.reduce((sum, stat) => sum + stat.total, 0);
  }, [depositStats]);

  const totalTransactions = useMemo(() => {
    return depositStats.reduce((sum, stat) => sum + stat.count, 0);
  }, [depositStats]);

  return (
    <>
      <PageHeader
        title="Платежи"
        description="Статистика платежей и пополнений"
        icon={<Wallet className="h-5 w-5 text-primary" />}
        gradient
        actions={
          <Button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            variant="outline"
            size="sm"
          >
            {isLoading || isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Обновить</span>
          </Button>
        }
      />

      <PageContainer>
        {!hasData ? (
          <EmptyState
            icon={TrendingUp}
            title="Нет данных о платежах"
            description="Платежи появятся здесь после их поступления"
          />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-2 xs:gap-3 md:gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="p-3 xs:p-4 md:p-6 pb-2">
                  <CardDescription className="text-xs xs:text-sm">Всего получено</CardDescription>
                  <CardTitle className="text-xl xs:text-2xl md:text-3xl">{totalRevenue.toLocaleString()} ₽</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="p-3 xs:p-4 md:p-6 pb-2">
                  <CardDescription className="text-xs xs:text-sm">Транзакций</CardDescription>
                  <CardTitle className="text-xl xs:text-2xl md:text-3xl">{totalTransactions}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="p-3 xs:p-4 md:p-6 pb-2">
                  <CardDescription className="text-xs xs:text-sm">Средний чек</CardDescription>
                  <CardTitle className="text-xl xs:text-2xl md:text-3xl">
                    {paymentStats?.averageCheck ? Math.round(paymentStats.averageCheck) : 0} ₽
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="p-3 xs:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base xs:text-lg md:text-xl">
                  <Activity className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />
                  Динамика платежей
                </CardTitle>
                <CardDescription className="text-xs xs:text-sm">За последние 7 дней</CardDescription>
              </CardHeader>
              <CardContent className="p-3 xs:p-4 md:p-6 pt-0">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '10px' }}
                      tickMargin={5}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '10px' }}
                      tickMargin={5}
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                      name="Сумма (₽)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader className="p-3 xs:p-4 md:p-6">
                <CardTitle className="text-base xs:text-lg md:text-xl">Платежные системы</CardTitle>
                <CardDescription className="text-xs xs:text-sm">Статистика по методам оплаты</CardDescription>
              </CardHeader>
              <CardContent className="p-3 xs:p-4 md:p-6 pt-0">
                <div className="space-y-2 xs:space-y-3">
                  {depositStats.map((stat) => (
                    <div
                      key={stat.method}
                      className="flex items-center justify-between p-2 xs:p-3 md:p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="space-y-0.5 xs:space-y-1">
                        <p className="font-medium capitalize text-xs xs:text-sm md:text-base">{stat.method}</p>
                        <div className="flex items-center gap-1 xs:gap-2 text-[10px] xs:text-xs md:text-sm text-muted-foreground flex-wrap">
                          <Badge variant="secondary" className="text-[9px] xs:text-xs h-4 xs:h-5 px-1 xs:px-2">{stat.count} платежей</Badge>
                          <Badge variant="outline" className="text-[9px] xs:text-xs h-4 xs:h-5 px-1 xs:px-2">{stat.completed} завершено</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base xs:text-xl md:text-2xl font-bold text-success">
                          {stat.total.toLocaleString()} ₽
                        </p>
                        <p className="text-[10px] xs:text-xs md:text-sm text-muted-foreground truncate">
                          ~{stat.averageCheck} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </PageContainer>
    </>
  );
}
