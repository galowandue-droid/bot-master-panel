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
        <CardTitle>Последняя активность</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="rounded-full bg-primary/10 p-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">
                  @{activity.username || activity.first_name || "Пользователь"}
                </span>{" "}
                → <span className="text-muted-foreground">Покупка</span> →{" "}
                <span className="font-medium">{activity.item_name}</span>{" "}
                <span className="text-success">(₽{Number(activity.amount).toFixed(0)})</span>
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
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