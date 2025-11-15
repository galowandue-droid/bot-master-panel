import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Clock } from "lucide-react";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function RecentActivity() {
  const { activities, isLoading } = useRecentActivity(10);

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
            className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.username ? `@${activity.username}` : activity.first_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.item_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-success">
                      {Number(activity.amount).toFixed(0)} ₽
                    </div>
                  </div>
                  <Badge variant={isDeposit ? "secondary" : "default"} className="shrink-0">
                    {isDeposit ? "Пополнение" : "Покупка"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: ru,
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}