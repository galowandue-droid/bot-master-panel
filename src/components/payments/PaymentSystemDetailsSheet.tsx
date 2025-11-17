import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, RefreshCw } from "lucide-react";

interface PaymentSystemDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system: {
    id: string;
    name: string;
    icon: React.ElementType;
    tokenLabel: string;
    placeholder: string;
  };
  token: string;
  commission: string;
  customLink: string;
  status: "connected" | "disconnected" | "checking";
  balance: any;
  lastCheck: string;
  onTokenChange: (value: string) => void;
  onCommissionChange: (value: string) => void;
  onCustomLinkChange: (value: string) => void;
  onCheckConnection: () => void;
  onRefreshBalance: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PaymentSystemDetailsSheet({
  open,
  onOpenChange,
  system,
  token,
  commission,
  customLink,
  status,
  balance,
  lastCheck,
  onTokenChange,
  onCommissionChange,
  onCustomLinkChange,
  onCheckConnection,
  onRefreshBalance,
  onSave,
  isSaving,
}: PaymentSystemDetailsSheetProps) {
  const Icon = system.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle>{system.name}</SheetTitle>
              <SheetDescription>Настройка платежной системы</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Подключение</h3>
            
            <div className="space-y-2">
              <Label htmlFor="token">{system.tokenLabel}</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => onTokenChange(e.target.value)}
                placeholder={system.placeholder}
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_link">Пользовательская ссылка (опционально)</Label>
              <Input
                id="custom_link"
                value={customLink}
                onChange={(e) => onCustomLinkChange(e.target.value)}
                placeholder="https://example.com/payment"
              />
              <p className="text-sm text-muted-foreground">
                Собственный URL для обработки платежей
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Комиссия</h3>
            
            <div className="space-y-2">
              <Label htmlFor="commission">Комиссия (%)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commission}
                onChange={(e) => onCommissionChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Процент комиссии, взимаемой с платежей
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Статус подключения</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Статус</span>
                {status === "connected" && (
                  <Badge variant="default" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Подключено
                  </Badge>
                )}
                {status === "disconnected" && (
                  <Badge variant="destructive">Не подключено</Badge>
                )}
                {status === "checking" && (
                  <Badge variant="secondary">
                    <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                    Проверка...
                  </Badge>
                )}
              </div>

              {balance !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Баланс</span>
                  <span className="font-medium">{balance} ₽</span>
                </div>
              )}

              {lastCheck && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Последняя проверка</span>
                  <span className="text-sm">{lastCheck}</span>
                </div>
              )}

              <div className="flex flex-col xs:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCheckConnection}
                  disabled={status === "checking"}
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-1 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                  <span className="text-xs xs:text-sm">Проверить</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshBalance}
                  disabled={status === "checking"}
                  className="flex-1"
                >
                  <RefreshCw className="mr-1 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                  <span className="text-xs xs:text-sm">Обновить</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onSave} disabled={isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Отмена
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
