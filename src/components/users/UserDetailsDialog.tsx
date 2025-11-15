import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Wallet, ShoppingBag, CreditCard, Ban, ShieldCheck, Package, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useUpdateBalance, useToggleBlockUser } from "@/hooks/useProfiles";
import type { UserProfile } from "@/hooks/useProfiles";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export function UserDetailsDialog({ open, onOpenChange, user }: UserDetailsDialogProps) {
  const [balanceAmount, setBalanceAmount] = useState("");
  const [optimisticBlocked, setOptimisticBlocked] = useState(user?.is_blocked ?? false);
  const [optimisticBalance, setOptimisticBalance] = useState(user?.balance ?? 0);
  
  const updateBalance = useUpdateBalance();
  const toggleBlock = useToggleBlockUser();
  const { data: purchaseHistory, isLoading: purchasesLoading } = usePurchaseHistory(user?.id || null);

  // Sync local optimistic state with user prop changes
  useEffect(() => {
    if (user) {
      setOptimisticBlocked(user.is_blocked ?? false);
      setOptimisticBalance(user.balance ?? 0);
    }
  }, [user?.id, user?.is_blocked, user?.balance]);

  if (!user) return null;

  const handleBalanceChange = () => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount === 0) return;

    // Optimistically update balance
    const newBalance = Number(optimisticBalance) + amount;
    setOptimisticBalance(newBalance);

    updateBalance.mutate(
      { userId: user.id, amount },
      {
        onSuccess: () => {
          setBalanceAmount("");
        },
        onError: () => {
          // Rollback optimistic update on error
          setOptimisticBalance(Number(user.balance ?? 0));
        },
      }
    );
  };

  const handleBlockToggle = () => {
    // Optimistically toggle block status
    const nextBlocked = !optimisticBlocked;
    setOptimisticBlocked(nextBlocked);

    toggleBlock.mutate(
      {
        userId: user.id,
        isBlocked: nextBlocked,
      },
      {
        onError: () => {
          // Rollback optimistic update on error
          setOptimisticBlocked(!nextBlocked);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="rounded-full bg-primary/10 p-1.5 sm:p-2 shrink-0">
              <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg sm:text-xl truncate">
                {user.first_name || user.username || `User ${user.telegram_id}`}
              </p>
              <p className="text-xs sm:text-sm font-normal text-muted-foreground break-all">
                {user.username && `@${user.username}`} • ID: {user.telegram_id}
              </p>
            </div>
            {optimisticBlocked && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                Заблокирован
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Детальная информация о пользователе
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Профиль</TabsTrigger>
            <TabsTrigger value="purchases" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Покупки</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Статистика</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Действия</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Telegram ID</Label>
                    <p className="text-base sm:text-lg font-medium break-all">{user.telegram_id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Username</Label>
                    <p className="text-base sm:text-lg font-medium break-all">
                      {user.username ? `@${user.username}` : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Имя</Label>
                    <p className="text-base sm:text-lg font-medium break-words">{user.first_name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Дата регистрации</Label>
                    <p className="text-base sm:text-lg font-medium">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  История покупок
                </CardTitle>
                <CardDescription>Все покупки пользователя</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {purchasesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))
                ) : !purchaseHistory || purchaseHistory.length === 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 sm:p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 shrink-0 text-xs">
                          ✅ Покупка #1 (демо)
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold text-base sm:text-lg">139₽</div>
                          <div className="text-xs text-muted-foreground">1 шт.</div>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-border my-2"></div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm sm:text-base">Самокат (Скидка 50%)</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">ℹ️ Ваш товар:</p>
                          <div className="text-xs sm:text-sm font-mono bg-muted/50 px-2 py-1 rounded break-all">
                            • SAMOKAT-TEST-003
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>14.11.2025 21:03</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 shrink-0 text-xs">
                          ✅ Покупка #2 (демо)
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold text-base sm:text-lg">290₽</div>
                          <div className="text-xs text-muted-foreground">2 шт.</div>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-border my-2"></div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm sm:text-base">Яндекс Плюс</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">ℹ️ Ваш товар:</p>
                          <div className="text-xs sm:text-sm font-mono bg-muted/50 px-2 py-1 rounded break-all">
                            • YANDEX-PLUS-001
                          </div>
                          <div className="text-xs sm:text-sm font-mono bg-muted/50 px-2 py-1 rounded break-all">
                            • YANDEX-PLUS-002
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>13.11.2025 18:45</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  purchaseHistory.map((purchase, index) => (
                    <div
                      key={purchase.id}
                      className="p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 shrink-0 text-xs">
                          ✅ Покупка #{purchaseHistory.length - index}
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold text-base sm:text-lg">
                            {purchase.total_price}₽
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {purchase.quantity} шт.
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-border my-2"></div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm sm:text-base">{purchase.position.name}</span>
                        </div>

                        {purchase.items && purchase.items.length > 0 && (
                          <div className="ml-6 space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">ℹ️ Ваш товар:</p>
                            {purchase.items.map((item, idx) => (
                              <div key={idx} className="text-xs sm:text-sm font-mono bg-muted/50 px-2 py-1 rounded break-all">
                                • {item.content}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            {new Date(purchase.created_at).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Баланс</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">₽{optimisticBalance}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Покупок</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{user.purchases_count}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Потрачено</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">₽{user.total_spent}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Управление балансом</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Введите положительное число для пополнения или отрицательное для списания
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="number"
                    placeholder="Сумма (например, 100 или -50)"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleBalanceChange}
                    disabled={updateBalance.isPending || !balanceAmount}
                    className="w-full sm:w-auto shrink-0"
                  >
                    {updateBalance.isPending ? "Изменение..." : "Изменить"}
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Текущий баланс: <span className="font-semibold">₽{optimisticBalance}</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Управление доступом</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Блокировка пользователя запретит ему использовать бота
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant={optimisticBlocked ? "default" : "destructive"}
                  onClick={handleBlockToggle}
                  disabled={toggleBlock.isPending}
                  className="w-full"
                >
                  {toggleBlock.isPending ? (
                    "Обновление..."
                  ) : optimisticBlocked ? (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4 shrink-0" />
                      Разблокировать
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4 shrink-0" />
                      Заблокировать
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
