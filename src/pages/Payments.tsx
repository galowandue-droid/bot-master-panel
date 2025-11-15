import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, DollarSign } from "lucide-react";
import { usePaymentStats } from "@/hooks/usePaymentStats";
import { PaymentCharts } from "@/components/payments/PaymentCharts";
import { EmptyState } from "@/components/EmptyState";
import { useMemo, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Payments() {
  const { data: paymentStats, isLoading: isLoadingStats, refetch: refetchStats } = usePaymentStats();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time subscription to deposits
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
          console.log('Deposit change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Новый платеж!",
              description: `Поступил платеж на сумму ${payload.new.amount} ₽`,
            });
          }
          
          // Refetch stats when deposits change
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
    }));
  }, [paymentStats]);

  const hasData = paymentStats?.dailyStats && paymentStats.dailyStats.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Платежи</h1>
          <p className="text-muted-foreground">
            Статистика и аналитика платежей
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoadingStats || isRefreshing}
          variant="outline"
          size="sm"
        >
          {isLoadingStats || isRefreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Обновить</span>
        </Button>
      </div>

      {/* Графики аналитики */}
      {isLoadingStats ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={TrendingUp}
          title="Нет данных о платежах"
          description="Платежи появятся здесь после их поступления. Настройте платежные системы в разделе 'Настройки платежей'."
        />
      ) : (
        <PaymentCharts
          dailyStats={paymentStats.dailyStats}
          depositsByMethod={paymentStats.depositsByMethod}
          averageCheck={paymentStats.averageCheck}
        />
      )}

      {/* Статистика по методам */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Статистика по методам оплаты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {depositStats.map((stat) => (
                <div
                  key={stat.method}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium capitalize">{stat.method}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.count} платежей ({stat.completed} завершено)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stat.total.toLocaleString()} ₽</p>
                    <p className="text-sm text-muted-foreground">
                      ~{Math.round(stat.total / stat.count)} ₽ средний чек
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
