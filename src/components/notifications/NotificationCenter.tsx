import { Bell, Info, CheckCircle, AlertTriangle, XCircle, Trash2, Check } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function getNotificationIcon(type: string) {
  switch (type) {
    case "success": return <CheckCircle className="h-5 w-5 text-success" />;
    case "warning": return <AlertTriangle className="h-5 w-5 text-warning" />;
    case "error": return <XCircle className="h-5 w-5 text-destructive" />;
    default: return <Info className="h-5 w-5 text-info" />;
  }
}

export function NotificationCenter() {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const filteredNotifications = notifications?.filter(n => filter === "all" ? true : !n.is_read) || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Уведомления</h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()} className="text-xs h-8">
                <Check className="h-3 w-3 mr-1" />
                Прочитать все
              </Button>
            )}
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
            <TabsList className="w-full overflow-x-auto no-scrollbar sm:grid sm:w-full sm:grid-cols-2">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="unread">
                Непрочитанные{unreadCount > 0 && <span className="ml-1 text-xs">({unreadCount})</span>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Загрузка...</p>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div key={notification.id} className={cn("group p-3 rounded-lg border transition-colors relative", !notification.is_read && "bg-primary/5 border-primary/20")}>
                    <div className="flex gap-3 cursor-pointer" onClick={() => {
                      if (!notification.is_read) markAsRead.mutate(notification.id);
                      if (notification.action_url) window.location.href = notification.action_url;
                    }}>
                      <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1 pr-8">
                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ru })}</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {!notification.is_read && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); markAsRead.mutate(notification.id); }}>
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(notification.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">{filter === "unread" ? "Нет непрочитанных уведомлений" : "Нет уведомлений"}</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
