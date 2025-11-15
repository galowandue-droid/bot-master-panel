import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, PieChartIcon, DollarSign } from "lucide-react";
import type { DailyStats } from "@/hooks/usePaymentStats";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'];

interface PaymentChartsProps {
  dailyStats: DailyStats[];
  depositsByMethod: Record<string, { count: number; total: number; completed: number }>;
  averageCheck: number;
}

export function PaymentCharts({ dailyStats, depositsByMethod, averageCheck }: PaymentChartsProps) {
  const methodNames: Record<string, string> = {
    cryptobot: "CryptoBot",
    telegram_stars: "Telegram Stars",
    wata: "Wata",
    heleket: "Heleket",
  };

  // Filter only active payment methods
  const activeMethodsOnly = Object.keys(methodNames);

  const pieData = Object.entries(depositsByMethod)
    .filter(([method]) => activeMethodsOnly.includes(method))
    .map(([method, stats]) => ({
      name: methodNames[method] || method,
      value: stats.total,
    }));

  const formattedDailyStats = dailyStats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    amount: stat.total,
    count: stat.count,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Динамика по дням */}
      <Card className="shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Динамика платежей
          </CardTitle>
          <CardDescription>Последние 7 дней</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={formattedDailyStats}>
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
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
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

      {/* Средний чек */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            Средний чек
          </CardTitle>
          <CardDescription>По завершенным платежам</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {averageCheck.toFixed(0)}
            </div>
            <div className="text-2xl text-muted-foreground mt-2">₽</div>
            <div className="mt-6 text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                Всего платежей за 7 дней
              </div>
              <div className="text-xl font-semibold text-foreground">
                {dailyStats.reduce((sum, day) => sum + day.count, 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Распределение по методам */}
      <Card className="shadow-card lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-accent" />
            Распределение по методам оплаты
          </CardTitle>
          <CardDescription>Объем платежей по каждому методу</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: number) => `${value.toFixed(2)} ₽`}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col justify-center space-y-4">
              {Object.entries(depositsByMethod)
                .filter(([method]) => activeMethodsOnly.includes(method))
                .map(([method, stats], index) => (
                <div 
                  key={method}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-sm">{methodNames[method] || method}</span>
                      <span className="font-semibold text-foreground">
                        {Number(stats.total).toFixed(2)} ₽
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{stats.count} транзакций</span>
                      <span className="text-success">
                        {((stats.completed / stats.count) * 100).toFixed(0)}% успех
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
