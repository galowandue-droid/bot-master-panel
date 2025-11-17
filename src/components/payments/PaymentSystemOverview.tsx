import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Settings, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface PaymentSystemOverviewProps {
  system: {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
  };
  enabled: boolean;
  status: "connected" | "disconnected" | "checking";
  balance: any;
  commission: string;
  onToggle: () => void;
  onCheckConnection: () => void;
  onRefreshBalance: () => void;
  onOpenDetails: () => void;
}

export function PaymentSystemOverview({
  system,
  enabled,
  status,
  balance,
  commission,
  onToggle,
  onCheckConnection,
  onRefreshBalance,
  onOpenDetails,
}: PaymentSystemOverviewProps) {
  const Icon = system.icon;

  const getStatusBadge = () => {
    if (!enabled) {
      return (
        <Badge variant="secondary" className="gap-1">
          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
          Не настроено
        </Badge>
      );
    }

    if (status === "checking") {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Проверка...
        </Badge>
      );
    }

    if (status === "connected") {
      return (
        <Badge variant="default" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          Подключено
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-1">
        <div className="h-2 w-2 rounded-full bg-destructive" />
        Ошибка
      </Badge>
    );
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{system.name}</CardTitle>
              <CardDescription className="text-sm">{system.description}</CardDescription>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Статус</span>
          {getStatusBadge()}
        </div>

        {enabled && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Баланс</span>
              <span className="font-medium">
                {balance ? `${balance} ₽` : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Комиссия</span>
              <span className="font-medium">{commission}%</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onCheckConnection} className="flex-1">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Проверить
              </Button>
              <Button variant="outline" size="sm" onClick={onRefreshBalance} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Обновить
              </Button>
              <Button variant="secondary" size="sm" onClick={onOpenDetails}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {!enabled && (
          <Button variant="outline" className="w-full" onClick={onOpenDetails}>
            <Settings className="mr-2 h-4 w-4" />
            Настроить
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
