import { Badge } from "@/components/ui/badge";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function RecentActivity() {
  const { activities, isLoading } = useRecentActivity(5);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Нет недавней активности</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => {
        const isDeposit = activity.type === "deposit";
        
        return (
          <div
            key={activity.id}
            className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <Badge variant={isDeposit ? "secondary" : "default"}>
                  {isDeposit ? "Пополнение" : "Покупка"}
                </Badge>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {activity.username ? `@${activity.username}` : activity.first_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.item_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: ru,
                })}
              </div>
              <div className="text-lg font-bold text-success">
                {Number(activity.amount).toFixed(0)} ₽
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}