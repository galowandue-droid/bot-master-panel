import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Wallet, ShoppingBag, CreditCard, Mail, Ban } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: number;
    username: string;
    balance: number;
    purchases: number;
    firstName?: string;
  } | null;
}

export function UserDetailsDialog({ open, onOpenChange, user }: UserDetailsDialogProps) {
  const [newBalance, setNewBalance] = useState("");

  if (!user) return null;

  const handleBalanceChange = () => {
    toast({
      title: "Баланс изменен",
      description: `Новый баланс: ₽${newBalance}`,
    });
    setNewBalance("");
  };

  const mockPurchases = [
    { id: 1, item: "Premium аккаунт", date: "2024-01-15", amount: 500 },
    { id: 2, item: "VIP подписка", date: "2024-01-10", amount: 1200 },
    { id: 3, item: "Стандарт", date: "2024-01-05", amount: 300 },
  ];

  const mockDeposits = [
    { id: 1, method: "CryptoBot", date: "2024-01-14", amount: 1000 },
    { id: 2, method: "ЮMoney", date: "2024-01-08", amount: 500 },
    { id: 3, method: "Карта", date: "2024-01-01", amount: 2000 },
  ];

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
                {user.firstName || `User ${user.id}`}
              </p>
              <p className="text-sm font-normal text-muted-foreground">
                @{user.username} • ID: {user.id}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="purchases">Покупки</TabsTrigger>
            <TabsTrigger value="deposits">Пополнения</TabsTrigger>
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
                    <p className="text-lg font-medium">{user.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Username</Label>
                    <p className="text-lg font-medium">@{user.username}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Баланс</Label>
                    <p className="text-lg font-medium text-success">₽{user.balance}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Покупок</Label>
                    <p className="text-lg font-medium">{user.purchases}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Управление балансом</CardTitle>
                <CardDescription>
                  Изменить баланс пользователя
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Введите новый баланс"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleBalanceChange} disabled={!newBalance}>
                    Изменить
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  История покупок
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium">{purchase.item}</p>
                        <p className="text-sm text-muted-foreground">{purchase.date}</p>
                      </div>
                      <Badge variant="secondary">₽{purchase.amount}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  История пополнений
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDeposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium">{deposit.method}</p>
                        <p className="text-sm text-muted-foreground">{deposit.date}</p>
                      </div>
                      <Badge variant="default" className="bg-success text-success-foreground">
                        +₽{deposit.amount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Действия с пользователем</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  Отправить сообщение
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Wallet className="h-4 w-4" />
                  Начислить бонус
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Заблокировать пользователя
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
