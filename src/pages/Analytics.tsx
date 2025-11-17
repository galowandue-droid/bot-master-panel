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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, TrendingUp, DollarSign, Users, ShoppingCart, Wallet, Download, BarChart3, Target } from "lucide-react";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";

const COLORS = ['hsl(250, 95%, 63%)', 'hsl(280, 89%, 66%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [desktopOpen, setDesktopOpen] = useState(false);
  const isMobile = useIsMobile();
  
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

  const chartData = useMemo(() => {
    const allData = filteredStatistics?.map((stat) => ({
      date: format(new Date(stat.date), "dd MMM", { locale: ru }),
      users: stat.new_users,
      purchases: stat.purchases_count,
      revenue: Number(stat.purchases_amount),
      deposits: stat.deposits_count,
      depositsAmount: Number(stat.deposits_amount),
    })) || [];
    
    // На мобильных показываем каждую 2-3 точку если данных больше 15
    if (isMobile && allData.length > 15) {
      return allData.filter((_, index) => index % 2 === 0);
    }
    
    return allData;
  }, [filteredStatistics, isMobile]);

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
      a.download = `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Успешно",
        description: "Аналитика экспортирована",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const conversionRate = totals?.users && totals?.purchases 
    ? ((totals.purchases / totals.users) * 100).toFixed(1)
    : "0";

  const stages = [
    { name: "Всего пользователей", value: totals?.users || 0, percentage: 100 },
    { name: "Сделали депозит", value: totals?.deposits || 0, percentage: totals?.users ? ((totals.deposits / totals.users) * 100) : 0 },
    { name: "Совершили покупку", value: totals?.purchases || 0, percentage: totals?.users ? ((totals.purchases / totals.users) * 100) : 0 },
  ];

  return (
    <>
      <PageHeader
        title="Аналитика"
        description="Детальный анализ бизнес-метрик"
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
        <Card className="border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle>Фильтры</CardTitle>
            <CardDescription>Настройте период и категорию для анализа</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col xs:flex-row gap-2 xs:gap-4">
            <div className="flex-1 min-w-[200px]">
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-center gap-1.5 px-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-xs whitespace-nowrap">
                        {format(dateRange.from, "dd.MM", { locale: ru })}-{format(dateRange.to, "dd.MM", { locale: ru })}
                      </span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto max-h-[60vh] overflow-y-auto">
                    <SheetHeader className="pb-3">
                      <SheetTitle>Выберите период</SheetTitle>
                    </SheetHeader>
                    
                    {/* Быстрые пресеты */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2"
                        onClick={() => setDateRange({ from: new Date(), to: new Date() })}
                      >
                        Сегодня
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2"
                        onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                      >
                        7 дней
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2"
                        onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                      >
                        30 дней
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2"
                        onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
                      >
                        90 дней
                      </Button>
                    </div>
                    
                    {/* Отображение выбранного периода */}
                    <div className="text-sm text-muted-foreground mb-3 text-center">
                      {dateRange.from && dateRange.to && (
                        <>
                          {format(dateRange.from, "dd MMM", { locale: ru })} - {format(dateRange.to, "dd MMM yyyy", { locale: ru })}
                        </>
                      )}
                    </div>
                    
                    {/* Range Calendar */}
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        if (range?.from) {
                          setDateRange({
                            from: range.from,
                            to: range.to || range.from
                          });
                        }
                      }}
                      locale={ru}
                      numberOfMonths={1}
                      className="mx-auto"
                    />
                  </SheetContent>
                </Sheet>
              ) : (
                <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-auto md:min-w-[280px] justify-start text-left font-normal text-sm gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="truncate">
                        {format(dateRange.from, "dd MMM yyyy", { locale: ru })} — {format(dateRange.to, "dd MMM yyyy", { locale: ru })}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 md:w-[620px] max-w-[95vw]" align="start" side="bottom" sideOffset={8}>
                    <div className="p-3 space-y-3">
                      {/* Быстрые пресеты */}
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setDateRange({ from: new Date(), to: new Date() });
                            setDesktopOpen(false);
                          }}
                        >
                          Сегодня
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setDateRange({ from: subDays(new Date(), 7), to: new Date() });
                            setDesktopOpen(false);
                          }}
                        >
                          7 дней
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setDateRange({ from: subDays(new Date(), 30), to: new Date() });
                            setDesktopOpen(false);
                          }}
                        >
                          30 дней
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setDateRange({ from: subDays(new Date(), 90), to: new Date() });
                            setDesktopOpen(false);
                          }}
                        >
                          90 дней
                        </Button>
                      </div>

                      {/* Отображение выбранного периода */}
                      <div className="text-sm text-muted-foreground text-center">
                        {dateRange.from && dateRange.to && (
                          <>
                            {format(dateRange.from, "dd MMM", { locale: ru })} — {format(dateRange.to, "dd MMM yyyy", { locale: ru })}
                          </>
                        )}
                      </div>
                      
                      {/* Range Calendar */}
                      <Calendar
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => {
                          if (range?.from) {
                            const newRange = { from: range.from, to: range.to || range.from };
                            setDateRange(newRange);
                            if (range?.to) {
                              setDesktopOpen(false);
                            }
                          }
                        }}
                        locale={ru}
                        numberOfMonths={2}
                        pagedNavigation
                        fixedWeeks
                        showOutsideDays
                      />

                      {/* Управление */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setDateRange({ from: subDays(new Date(), 30), to: new Date() });
                            setDesktopOpen(false);
                          }}
                        >
                          Сбросить
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs"
                          onClick={() => setDesktopOpen(false)}
                        >
                          Готово
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="text-xs xs:text-sm">
                  <SelectValue placeholder="Выберите категорию" />
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
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-2 xs:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/40 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs xs:text-sm font-medium">Новые пользователи</CardTitle>
              <Users className="h-3 w-3 xs:h-4 xs:w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-6 xs:h-8 w-16 xs:w-24" />
              ) : (
                <div className="text-xl xs:text-2xl font-bold">{totals?.newUsers || 0}</div>
              )}
              <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                Всего: {totals?.users || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs xs:text-sm font-medium">Покупки</CardTitle>
              <ShoppingCart className="h-3 w-3 xs:h-4 xs:w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-6 xs:h-8 w-16 xs:w-24" />
              ) : (
                <div className="text-xl xs:text-2xl font-bold">{totals?.purchases || 0}</div>
              )}
              <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                Конверсия: {conversionRate}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs xs:text-sm font-medium">Выручка</CardTitle>
              <DollarSign className="h-3 w-3 xs:h-4 xs:w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-6 xs:h-8 w-20 xs:w-32" />
              ) : (
                <div className="text-xl xs:text-2xl font-bold">{totals?.revenue?.toFixed(2) || 0} ₽</div>
              )}
              <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                Средний чек: {totals?.purchases ? (totals.revenue / totals.purchases).toFixed(0) : 0} ₽
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs xs:text-sm font-medium">Депозиты</CardTitle>
              <Wallet className="h-3 w-3 xs:h-4 xs:w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-6 xs:h-8 w-16 xs:w-24" />
              ) : (
                <div className="text-xl xs:text-2xl font-bold">{totals?.deposits || 0}</div>
              )}
              <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                На сумму: {totals?.depositsAmount?.toFixed(2) || 0} ₽
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full xs:w-auto xs:inline-flex">
            <TabsTrigger value="revenue" className="text-xs xs:text-sm">Выручка</TabsTrigger>
            <TabsTrigger value="users" className="text-xs xs:text-sm">Пользователи</TabsTrigger>
            <TabsTrigger value="conversion" className="text-xs xs:text-sm">Воронка</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <Card className="border-border/40 shadow-lg">
              <CardHeader>
                <CardTitle>Динамика выручки</CardTitle>
                <CardDescription>График выручки и депозитов за выбранный период</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] xs:h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                    <AreaChart data={chartData} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? -20 : 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: isMobile ? '10px' : '12px' }}
                        interval={isMobile ? "preserveStartEnd" : "preserveEnd"}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: isMobile ? '10px' : '12px' }}
                        width={isMobile ? 35 : 60}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          fontSize: isMobile ? '11px' : '14px'
                        }} 
                      />
                      {!isMobile && <Legend />}
                      <Area type="monotone" dataKey="revenue" name="Выручка" stroke={COLORS[0]} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="depositsAmount" name="Депозиты" stroke={COLORS[1]} fillOpacity={1} fill="url(#colorDeposits)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-lg">
              <CardHeader>
                <CardTitle>Ежедневная выручка</CardTitle>
                <CardDescription>Выручка по дням</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] xs:h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                    <BarChart data={chartData} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? -20 : 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: isMobile ? '10px' : '12px' }}
                        interval={isMobile ? "preserveStartEnd" : "preserveEnd"}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: isMobile ? '10px' : '12px' }}
                        width={isMobile ? 35 : 60}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          fontSize: isMobile ? '11px' : '14px'
                        }} 
                      />
                      <Bar dataKey="revenue" name="Выручка" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-border/40 shadow-lg">
              <CardHeader>
                <CardTitle>Рост пользователей</CardTitle>
                <CardDescription>Новые пользователи за период</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] xs:h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                    <LineChart data={chartData} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? -20 : 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: isMobile ? '10px' : '12px' }}
                        interval={isMobile ? "preserveStartEnd" : "preserveEnd"}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: isMobile ? '10px' : '12px' }}
                        width={isMobile ? 35 : 60}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          fontSize: isMobile ? '11px' : '14px'
                        }} 
                      />
                      {!isMobile && <Legend />}
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        name="Новые пользователи" 
                        stroke={COLORS[2]} 
                        strokeWidth={2} 
                        dot={isMobile ? false : { r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-lg">
              <CardHeader>
                <CardTitle>Покупки и депозиты</CardTitle>
                <CardDescription>Количество операций по дням</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] xs:h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                    <BarChart data={chartData} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? -20 : 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: isMobile ? '10px' : '12px' }}
                        interval={isMobile ? "preserveStartEnd" : "preserveEnd"}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: isMobile ? '10px' : '12px' }}
                        width={isMobile ? 35 : 60}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          fontSize: isMobile ? '11px' : '14px'
                        }} 
                      />
                      {!isMobile && <Legend />}
                      <Bar dataKey="purchases" name="Покупки" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
                      <Bar dataKey="deposits" name="Депозиты" fill={COLORS[1]} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <Card className="border-border/40 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Воронка конверсии
                </CardTitle>
                <CardDescription>
                  Путь пользователя от регистрации до покупки
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : (
                  stages.map((stage, index) => (
                    <div key={stage.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                            index === 0 ? "bg-primary/20 text-primary" :
                            index === 1 ? "bg-secondary/20 text-secondary" :
                            "bg-accent/20 text-accent"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{stage.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {stage.value} пользователей
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{stage.percentage.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">конверсия</div>
                        </div>
                      </div>
                      <Progress value={stage.percentage} className="h-2" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/40 shadow-lg">
                <CardHeader>
                  <CardTitle>Общая конверсия</CardTitle>
                  <CardDescription>Процент пользователей, совершивших покупку</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <div className="text-4xl font-bold text-primary">{conversionRate}%</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-lg">
                <CardHeader>
                  <CardTitle>Средний чек</CardTitle>
                  <CardDescription>Средняя сумма покупки</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <div className="text-4xl font-bold text-primary">
                      {totals?.purchases ? (totals.revenue / totals.purchases).toFixed(2) : 0} ₽
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
