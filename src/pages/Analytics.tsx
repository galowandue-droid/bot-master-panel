import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";
import { useStatistics } from "@/hooks/useStatistics";
import { useMemo } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Analytics() {
  const { statistics: stats } = useStatistics();

  const chartData = useMemo(() => {
    if (!stats) return [];
    return stats.slice(-30).map(stat => ({
      date: new Date(stat.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      users: stat.new_users || 0,
      revenue: stat.purchases_amount || 0,
      deposits: stat.deposits_amount || 0,
      purchases: stat.purchases_count || 0,
    }));
  }, [stats]);

  const totalMetrics = useMemo(() => {
    if (!stats || stats.length === 0) return { users: 0, revenue: 0, deposits: 0, purchases: 0 };
    const last30Days = stats.slice(-30);
    return {
      users: last30Days.reduce((sum, s) => sum + (s.new_users || 0), 0),
      revenue: last30Days.reduce((sum, s) => sum + (s.purchases_amount || 0), 0),
      deposits: last30Days.reduce((sum, s) => sum + (s.deposits_amount || 0), 0),
      purchases: last30Days.reduce((sum, s) => sum + (s.purchases_count || 0), 0),
    };
  }, [stats]);

  const conversionData = useMemo(() => {
    if (!stats || stats.length === 0) return [];
    const last30Days = stats.slice(-30);
    const totalUsers = last30Days.reduce((sum, s) => sum + (s.new_users || 0), 0);
    const withDeposits = last30Days.reduce((sum, s) => sum + (s.deposits_count || 0), 0);
    const withPurchases = last30Days.reduce((sum, s) => sum + (s.purchases_count || 0), 0);

    return [
      { name: 'Новые пользователи', value: totalUsers, color: '#3b82f6' },
      { name: 'Сделали депозит', value: withDeposits, color: '#10b981' },
      { name: 'Совершили покупку', value: withPurchases, color: '#f59e0b' },
    ];
  }, [stats]);

  return (
    <>
      <PageHeader
        title="Аналитика"
        description="Подробная аналитика эффективности и метрики роста"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
      />

      <PageContainer>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Новые пользователи</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMetrics.users}</div>
                <p className="text-xs text-muted-foreground">за последние 30 дней</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Выручка</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMetrics.revenue.toFixed(0)} ₽</div>
                <p className="text-xs text-muted-foreground">за последние 30 дней</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Депозиты</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMetrics.deposits.toFixed(0)} ₽</div>
                <p className="text-xs text-muted-foreground">за последние 30 дней</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Покупки</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMetrics.purchases}</div>
                <p className="text-xs text-muted-foreground">за последние 30 дней</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="revenue">Выручка</TabsTrigger>
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="conversion">Воронка</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <Card>
                <CardHeader>
                  <CardTitle>Динамика выручки и депозитов</CardTitle>
                  <CardDescription>Сравнение выручки от продаж и поступлений за 30 дней</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#f59e0b" fill="#fbbf24" name="Выручка" />
                      <Area type="monotone" dataKey="deposits" stackId="1" stroke="#10b981" fill="#34d399" name="Депозиты" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Рост пользовательской базы</CardTitle>
                  <CardDescription>Количество новых пользователей и покупок</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Новые пользователи" />
                      <Line type="monotone" dataKey="purchases" stroke="#f59e0b" strokeWidth={2} name="Покупки" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversion">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Воронка конверсии</CardTitle>
                    <CardDescription>От регистрации до покупки</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={conversionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {conversionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Метрики конверсии</CardTitle>
                    <CardDescription>Процент прохождения воронки</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Регистрация → Депозит</span>
                        <span className="text-sm text-muted-foreground">
                          {totalMetrics.users > 0 
                            ? ((conversionData[1]?.value / conversionData[0]?.value * 100) || 0).toFixed(1) 
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${totalMetrics.users > 0 ? (conversionData[1]?.value / conversionData[0]?.value * 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Депозит → Покупка</span>
                        <span className="text-sm text-muted-foreground">
                          {conversionData[1]?.value > 0 
                            ? ((conversionData[2]?.value / conversionData[1]?.value * 100) || 0).toFixed(1) 
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500" 
                          style={{ width: `${conversionData[1]?.value > 0 ? (conversionData[2]?.value / conversionData[1]?.value * 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Общая конверсия</span>
                        <span className="text-sm text-muted-foreground">
                          {totalMetrics.users > 0 
                            ? ((conversionData[2]?.value / conversionData[0]?.value * 100) || 0).toFixed(1) 
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${totalMetrics.users > 0 ? (conversionData[2]?.value / conversionData[0]?.value * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </>
  );
}
