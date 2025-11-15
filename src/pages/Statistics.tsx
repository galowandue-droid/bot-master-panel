import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { useStatistics } from "@/hooks/useStatistics";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, TrendingUp, DollarSign, Wallet, Download, BarChart3 } from "lucide-react";
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
    <>
      <PageHeader
        title="Детальная аналитика"
        description="Статистика продаж и платежей"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        gradient
        actions={
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        }
      />

      <PageContainer gradient>
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
      </PageContainer>
    </>
  );
}
