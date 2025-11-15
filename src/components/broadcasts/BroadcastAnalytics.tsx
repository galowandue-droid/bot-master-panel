import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBroadcastAnalytics } from "@/hooks/useBroadcastAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Eye, MousePointer, Send, CheckCircle } from "lucide-react";

interface BroadcastAnalyticsProps {
  broadcastId: string;
}

export const BroadcastAnalytics = ({ broadcastId }: BroadcastAnalyticsProps) => {
  const { analytics, isLoading } = useBroadcastAnalytics(broadcastId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[60px]" />
              <Skeleton className="h-3 w-[120px] mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отправлено</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_sent}</div>
            <p className="text-xs text-muted-foreground">
              Всего сообщений отправлено
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доставлено</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_delivered}</div>
            <p className="text-xs text-muted-foreground">
              Успешно доставлено
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.open_rate.toFixed(1)}%</div>
            <Progress value={analytics.open_rate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.total_opened} открытий
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.click_rate.toFixed(1)}%</div>
            <Progress value={analytics.click_rate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.total_clicked} кликов
            </p>
          </CardContent>
        </Card>
      </div>

      {analytics.button_clicks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Клики по кнопкам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.button_clicks.map((button) => (
                <div key={button.button_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{button.button_text}</span>
                    <span className="text-muted-foreground">{button.clicks} кликов</span>
                  </div>
                  <Progress 
                    value={(button.clicks / analytics.total_clicked) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
