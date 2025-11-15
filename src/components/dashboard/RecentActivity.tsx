import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock } from "lucide-react";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function RecentActivity() {
  const { activities, isLoading } = useRecentActivity(5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Последняя активность</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Последняя активность</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Нет недавней активности</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Последняя активность
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-4 rounded-lg border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all"
          >
            <div className="rounded-full bg-gradient-to-br from-success/20 to-success/10 p-2.5 ring-2 ring-success/20">
              <ShoppingCart className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.username ? `@${activity.username}` : activity.first_name || "Пользователь"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Покупка: <span className="font-medium text-foreground">{activity.item_name}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-success">
                    ₽{Number(activity.amount).toFixed(0)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: ru,
                })}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}