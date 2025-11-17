import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

export function HourlyActivity() {
  const isMobile = useIsMobile();
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

      const allData = Array.from(hourMap.values()).map(item => ({
        hour: `${item.hour}:00`,
        count: item.count,
        revenue: Math.round(item.revenue),
      }));

      return allData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-3 xs:px-6 pt-3 xs:pt-6 pb-2 xs:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm xs:text-base">
            <Clock className="h-4 w-4 xs:h-5 xs:w-5" />
            Активность по часам
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 xs:px-6 pb-3 xs:pb-6">
          <Skeleton className="h-[240px] md:h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-3 xs:px-6 pt-3 xs:pt-6 pb-2 xs:pb-3">
        <CardTitle className="flex items-center gap-2 text-sm xs:text-base">
          <Clock className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />
          Активность по часам (24ч)
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-hidden px-2 xs:px-6 pb-3 xs:pb-6">
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 240} className="md:h-[300px]">
          <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: isMobile ? -15 : -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" className="opacity-50" />
            <XAxis 
              dataKey="hour" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: isMobile ? '9px' : '10px' }}
              interval={isMobile ? 2 : "preserveStartEnd"}
              tickMargin={5}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: isMobile ? '9px' : '10px' }}
              width={isMobile ? 25 : 30}
              tickMargin={5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: isMobile ? '10px' : '11px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontSize: isMobile ? '10px' : '11px' }}
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
