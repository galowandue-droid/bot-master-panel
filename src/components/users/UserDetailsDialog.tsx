import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Wallet, ShoppingBag, CreditCard, Ban, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useUpdateBalance, useToggleBlockUser } from "@/hooks/useProfiles";
import type { UserProfile } from "@/hooks/useProfiles";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export function UserDetailsDialog({ open, onOpenChange, user }: UserDetailsDialogProps) {
  const [balanceAmount, setBalanceAmount] = useState("");
  const updateBalance = useUpdateBalance();
  const toggleBlock = useToggleBlockUser();

  if (!user) return null;

  const handleBalanceChange = () => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount === 0) return;

    updateBalance.mutate(
      { userId: user.id, amount },
      {
        onSuccess: () => {
          setBalanceAmount("");
        },
      }
    );
  };

  const handleBlockToggle = () => {
    toggleBlock.mutate({
      userId: user.id,
      isBlocked: !user.is_blocked,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xl">
                {user.first_name || user.username || `User ${user.telegram_id}`}
              </p>
              <p className="text-sm font-normal text-muted-foreground">
                {user.username && `@${user.username}`} • ID: {user.telegram_id}
              </p>
            </div>
            {user.is_blocked && (
              <Badge variant="destructive" className="ml-auto">
                Заблокирован
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="stats">Статистика</TabsTrigger>
            <TabsTrigger value="actions">Действия</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Telegram ID</Label>
                    <p className="text-lg font-medium">{user.telegram_id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Username</Label>
                    <p className="text-lg font-medium">
                      {user.username ? `@${user.username}` : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Имя</Label>
                    <p className="text-lg font-medium">{user.first_name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Дата регистрации</Label>
                    <p className="text-lg font-medium">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Баланс</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₽{user.balance}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Покупок</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.purchases_count}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Потрачено</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₽{user.total_spent}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Управление балансом</CardTitle>
                <CardDescription>
                  Введите положительное число для пополнения или отрицательное для списания
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Сумма (например, 100 или -50)"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                  />
                  <Button
                    onClick={handleBalanceChange}
                    disabled={updateBalance.isPending || !balanceAmount}
                  >
                    {updateBalance.isPending ? "Изменение..." : "Изменить"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Текущий баланс: <span className="font-semibold">₽{user.balance}</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Управление доступом</CardTitle>
                <CardDescription>
                  Блокировка пользователя запретит ему использовать бота
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant={user.is_blocked ? "default" : "destructive"}
                  onClick={handleBlockToggle}
                  disabled={toggleBlock.isPending}
                  className="w-full"
                >
                  {user.is_blocked ? (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Разблокировать пользователя
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Заблокировать пользователя
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
