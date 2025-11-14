import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useStatistics } from "@/hooks/useStatistics";
import { usePaymentStats } from "@/hooks/usePaymentStats";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, TrendingUp, DollarSign, Wallet, Download } from "lucide-react";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const COLORS = ['hsl(250, 95%, 63%)', 'hsl(280, 89%, 66%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];

export default function Statistics() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
  const { statistics, totals, isLoading } = useStatistics(days);
  const { data: paymentStats, isLoading: paymentStatsLoading } = usePaymentStats();
  const { categories } = useCategories();

  const filteredStatistics = useMemo(() => {
    if (!statistics) return [];
    
    return statistics.filter(stat => {
      const statDate = new Date(stat.date);
      return statDate >= dateRange.from && statDate <= dateRange.to;
    });
  }, [statistics, dateRange]);

  const chartData = useMemo(() => 
    filteredStatistics?.map((stat) => ({
      date: format(new Date(stat.date), "dd MMM", { locale: ru }),
      users: stat.new_users,
      purchases: stat.purchases_count,
      revenue: Number(stat.purchases_amount),
      deposits: stat.deposits_count,
    })) || [],
    [filteredStatistics]
  );

  const pieData = useMemo(() => {
    if (!paymentStats?.depositsByMethod) return [];
    
    return Object.entries(paymentStats.depositsByMethod).map(([method, data]) => ({
      name: method === 'unknown' ? 'Неизвестно' : method,
      value: data.total,
      count: data.count,
    }));
  }, [paymentStats]);

  const handleExportData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('export-database', {
        body: { table: 'statistics' }
      });

      if (error) throw error;

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Успешно",
        description: "Статистика экспортирована",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Детальная аналитика
            </h1>
            <p className="text-sm text-muted-foreground">
              Статистика продаж и платежей
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle>Фильтры</CardTitle>
            <CardDescription>Настройте период и категорию для анализа</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy", { locale: ru })} -{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: ru })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: ru })
                    )
                  ) : (
                    "Выберите период"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border/40 shadow-lg">
              <CardHeader className="pb-2">
                <CardDescription>Новые пользователи</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totals?.newUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">За выбранный период</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-lg">
              <CardHeader className="pb-2">
                <CardDescription>Продажи</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totals?.purchases || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Всего заказов</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-lg">
              <CardHeader className="pb-2">
                <CardDescription>Выручка</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">₽{(totals?.revenue || 0).toFixed(0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Общая сумма</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-lg">
              <CardHeader className="pb-2">
                <CardDescription>Пополнения</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">₽{(totals?.depositsAmount || 0).toFixed(0)}</div>
                <p className="text-xs text-muted-foreground mt-1">{totals?.deposits || 0} транзакций</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Динамика продаж
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      animationDuration={200}
                    />
                    <Area
                      type="monotone"
                      dataKey="purchases"
                      stroke="hsl(250, 95%, 63%)"
                      fill="hsl(250, 95%, 63%)"
                      fillOpacity={0.2}
                      name="Продажи"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                Выручка по дням
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      animationDuration={200}
                    />
                    <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" name="Выручка (₽)" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Systems Stats */}
        <Card className="border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Статистика платежных систем
            </CardTitle>
            <CardDescription>Данные с API платежных систем и локальной базы</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStatsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {paymentStats?.paymentStats.map((stat) => (
                    <Card key={stat.system} className="border-border/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{stat.system}</CardTitle>
                        <CardDescription>
                          {stat.status === 'connected' && <span className="text-success">✓ Подключен</span>}
                          {stat.status === 'disabled' && <span className="text-muted-foreground">○ Отключен</span>}
                          {stat.status === 'error' && <span className="text-destructive">✗ Ошибка</span>}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {stat.enabled && stat.status === 'connected' && (
                          <div className="text-sm space-y-1">
                            {Array.isArray(stat.balance) ? (
                              stat.balance.length > 0 ? (
                                stat.balance.map((b: any, i: number) => (
                                  <div key={i}>
                                    {b.currency_code}: {b.available}
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground">Нет данных</div>
                              )
                            ) : (
                              <div>{stat.balance}</div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Распределение по методам</h3>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            isAnimationActive={false}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip animationDuration={200} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Нет данных о платежах
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Детали по методам</h3>
                    {Object.keys(paymentStats?.depositsByMethod || {}).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(paymentStats?.depositsByMethod || {}).map(([method, data]) => (
                          <Card key={method} className="p-4 border-border/40">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{method === 'unknown' ? 'Неизвестно' : method}</span>
                              <span className="text-sm text-muted-foreground">{data.count} транзакций</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Всего:</span>
                                <span className="font-medium">₽{data.total.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Завершено:</span>
                                <span className="text-success">{data.completed}</span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Нет данных о платежах
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
