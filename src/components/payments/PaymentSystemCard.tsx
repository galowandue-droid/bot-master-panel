import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface PaymentSystemCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  isEnabled: boolean;
  token: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  commission: string;
  balance?: string | number;
  status?: "connected" | "disconnected" | "checking";
  lastCheck?: string;
  onToggle: () => void;
  onSaveToken: () => void;
  onSaveCommission: () => void;
  onCheckConnection: () => void;
  onRefreshBalance: () => void;
  onTokenChange: (value: string) => void;
  onCommissionChange: (value: string) => void;
  isSaving: boolean;
}

export function PaymentSystemCard({
  id,
  name,
  description,
  icon: Icon,
  isEnabled,
  token,
  tokenLabel,
  tokenPlaceholder,
  commission,
  balance,
  status = "disconnected",
  lastCheck,
  onToggle,
  onSaveToken,
  onSaveCommission,
  onCheckConnection,
  onRefreshBalance,
  onTokenChange,
  onCommissionChange,
  isSaving,
}: PaymentSystemCardProps) {
  return (
    <Card className={`transition-all ${isEnabled ? 'border-primary/30 shadow-lg' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
              <Icon className={`h-6 w-6 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {name}
                {isEnabled && status === "connected" && (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
                {isEnabled && status === "disconnected" && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
          />
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-4">
          {/* Status and Balance */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Статус</p>
              <Badge variant={status === "connected" ? "default" : "secondary"}>
                {status === "connected" ? "Подключено" : "Не подключено"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Баланс</p>
              <p className="text-sm font-medium">
                {balance !== undefined ? `${balance}` : "—"}
              </p>
            </div>
          </div>

          {lastCheck && (
            <p className="text-xs text-muted-foreground">
              Последняя проверка: {lastCheck}
            </p>
          )}

          {/* API Token */}
          <div className="space-y-2">
            <Label>{tokenLabel}</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder={tokenPlaceholder}
                value={token}
                onChange={(e) => onTokenChange(e.target.value)}
              />
              <Button
                onClick={onSaveToken}
                disabled={isSaving}
                size="sm"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Commission */}
          <div className="space-y-2">
            <Label>Комиссия (%)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={commission}
                onChange={(e) => onCommissionChange(e.target.value)}
                className="w-24"
              />
              <span className="flex items-center text-sm text-muted-foreground">%</span>
              <Button
                onClick={onSaveCommission}
                disabled={isSaving}
                size="sm"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Пример: платеж 1000₽ = {(1000 * (1 + parseFloat(commission || "0") / 100)).toFixed(0)}₽
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCheckConnection}
              disabled={isSaving}
              className="flex-1"
            >
              Проверить подключение
            </Button>
            <Button
              variant="outline"
              onClick={onRefreshBalance}
              disabled={isSaving}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
