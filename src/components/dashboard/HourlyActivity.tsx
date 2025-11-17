import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function HourlyActivity() {
  const { data: hourlyData, isLoading } = useQuery({
    queryKey: ["hourly-activity"],
    queryFn: async () => {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("purchases")
        .select("created_at, total_price")
        .gte("created_at", dayAgo.toISOString());

      if (error) throw error;

      // Group by hour
      const hourMap = new Map();
      for (let i = 0; i < 24; i++) {
        hourMap.set(i, { hour: i, count: 0, revenue: 0 });
      }

      data?.forEach((purchase) => {
        const hour = new Date(purchase.created_at).getHours();
        const existing = hourMap.get(hour);
        if (existing) {
          existing.count++;
          existing.revenue += purchase.total_price;
        }
      });

      return Array.from(hourMap.values()).map(item => ({
        hour: `${item.hour}:00`,
        count: item.count,
        revenue: Math.round(item.revenue),
      }));
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Активность по часам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Активность по часам (24ч)
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-hidden">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="hour" 
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
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
              name="Продаж"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
