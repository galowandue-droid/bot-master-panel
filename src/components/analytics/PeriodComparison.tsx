import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useState } from "react";
import { useStatistics } from "@/hooks/useStatistics";

type Period = "7" | "30" | "90";

export function PeriodComparison() {
  const [period, setPeriod] = useState<Period>("30");
  const currentPeriod = useStatistics(Number(period));
  const previousPeriod = useStatistics(Number(period) * 2);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-success" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const metrics = [
    {
      title: "Новые пользователи",
      current: currentPeriod.totals?.newUsers || 0,
      previous: previousPeriod.totals?.newUsers || 0,
    },
    {
      title: "Покупки",
      current: currentPeriod.totals?.purchases || 0,
      previous: previousPeriod.totals?.purchases || 0,
    },
    {
      title: "Выручка",
      current: currentPeriod.totals?.revenue || 0,
      previous: previousPeriod.totals?.revenue || 0,
      format: (val: number) => `${val.toFixed(0)} ₽`,
    },
    {
      title: "Пополнения",
      current: currentPeriod.totals?.deposits || 0,
      previous: previousPeriod.totals?.deposits || 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Сравнение периодов</CardTitle>
            <CardDescription>Динамика ключевых метрик</CardDescription>
          </div>
          <Select value={period} onValueChange={(val) => setPeriod(val as Period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 дней</SelectItem>
              <SelectItem value="30">30 дней</SelectItem>
              <SelectItem value="90">90 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => {
            const change = calculateChange(metric.current, metric.previous);
            return (
              <div
                key={metric.title}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">
                    {metric.format ? metric.format(metric.current) : metric.current}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(change)}
                    <span
                      className={`text-sm font-medium ${
                        change > 0
                          ? "text-success"
                          : change < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {Math.abs(change).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
