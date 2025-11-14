import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Bitcoin, Wallet, Star, CreditCard } from "lucide-react";

export default function Payments() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Платежи</h1>
            <p className="text-sm text-muted-foreground">
              Управление платежными системами
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* CryptoBot */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Bitcoin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">CryptoBot</h3>
                <p className="text-sm text-muted-foreground">
                  Прием криптовалюты через @CryptoBot
                </p>
              </div>
            </div>
            <Switch />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Баланс
              </p>
              <p className="text-2xl font-bold text-foreground">
                ₽12,340
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Статус
              </p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-sm font-medium text-success">Подключен</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm">
              Изменить токен
            </Button>
            <Button variant="outline" size="sm">
              Проверить
            </Button>
          </div>
        </Card>

        {/* ЮMoney */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">ЮMoney</h3>
                <p className="text-sm text-muted-foreground">
                  Прием платежей через ЮMoney
                </p>
              </div>
            </div>
            <Switch />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Баланс
              </p>
              <p className="text-2xl font-bold text-foreground">
                ₽8,567
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Статус
              </p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-sm font-medium text-success">Подключен</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm">
              Авторизация OAuth
            </Button>
            <Button variant="outline" size="sm">
              Проверить
            </Button>
          </div>
        </Card>

        {/* Stars */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Telegram Stars</h3>
                <p className="text-sm text-muted-foreground">
                  Встроенные платежи Telegram
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Транзакций
              </p>
              <p className="text-2xl font-bold text-foreground">
                234
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Статус
              </p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-sm font-medium text-success">Активен</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Карты */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Карты</h3>
                <p className="text-sm text-muted-foreground">
                  Прием на банковские карты
                </p>
              </div>
            </div>
            <Switch />
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm">
              Настроить реквизиты
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
