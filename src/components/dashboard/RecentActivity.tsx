import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { useState, memo } from "react";

export const RecentActivity = memo(function RecentActivity() {
  const [expanded, setExpanded] = useState(false);
  const { activities, isLoading } = useRecentActivity(expanded ? 10 : 5);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Нет недавней активности</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {activities.map((activity) => {
          const isDeposit = activity.type === "deposit";
          
          return (
            <div
              key={activity.id}
              className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Badge variant={isDeposit ? "secondary" : "default"} className="text-xs px-2 py-0.5">
                  {isDeposit ? "Пополнение" : "Покупка"}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {activity.username ? `@${activity.username}` : activity.first_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </div>
                <div className="text-sm font-bold text-success min-w-[60px] text-right">
                  {Number(activity.amount).toFixed(0)} ₽
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length >= 5 && (
        <div className="flex justify-center pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs"
          >
            {expanded ? "Показать меньше" : "Показать больше"}
            <ChevronRight className={`ml-1 h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      )}
    </div>
  );
});