import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bitcoin, Wallet, Star, CreditCard, Check, X, Loader2, TrendingUp, DollarSign } from "lucide-react";
import { useBotSettings } from "@/hooks/useBotSettings";
import { usePaymentStats } from "@/hooks/usePaymentStats";
import { toast } from "@/hooks/use-toast";

export default function Payments() {
  const { getSetting, updateSetting } = useBotSettings();
  const { data: paymentStats } = usePaymentStats();
  const [testingStatus, setTestingStatus] = useState<Record<string, boolean>>({});

  const paymentSystems = [
    {
      id: "cryptobot",
      name: "CryptoBot",
      description: "Прием криптовалюты через @CryptoBot",
      icon: Bitcoin,
      tokenKey: "cryptobot_token",
      enabledKey: "cryptobot_enabled",
    },
    {
      id: "yoomoney",
      name: "ЮMoney",
      description: "Прием платежей через ЮMoney",
      icon: Wallet,
      tokenKey: "yoomoney_token",
      enabledKey: "yoomoney_enabled",
    },
    {
      id: "telegram_stars",
      name: "Telegram Stars",
      description: "Встроенная валюта Telegram",
      icon: Star,
      tokenKey: "telegram_stars_token",
      enabledKey: "telegram_stars_enabled",
    },
    {
      id: "cards",
      name: "Карты",
      description: "Прием платежей по номеру карты",
      icon: CreditCard,
      tokenKey: "cards_number",
      enabledKey: "cards_enabled",
    },
  ];

  const handleSaveToken = async (system: { id: string; tokenKey: string; name: string }) => {
    const input = document.getElementById(`${system.id}-token`) as HTMLInputElement;
    const value = input?.value;

    if (!value) {
      toast({
        title: "Ошибка",
        description: "Введите токен или номер",
        variant: "destructive",
      });
      return;
    }

    await updateSetting.mutateAsync({ key: system.tokenKey, value });
  };

  const handleToggle = async (system: { id: string; enabledKey: string }) => {
    const currentValue = getSetting(system.enabledKey);
    const newValue = currentValue === "true" ? "false" : "true";
    await updateSetting.mutateAsync({ key: system.enabledKey, value: newValue });
  };

  const handleTest = async (systemId: string) => {
    setTestingStatus({ ...testingStatus, [systemId]: true });
    
    const system = paymentSystems.find(s => s.id === systemId);
    const token = system ? getSetting(system.tokenKey) : null;

    if (!token) {
      toast({
        title: "Ошибка",
        description: "Токен не настроен",
        variant: "destructive",
      });
      setTestingStatus({ ...testingStatus, [systemId]: false });
      return;
    }

    try {
      // В реальном приложении здесь был бы запрос к API платежной системы
      // Для демонстрации используем задержку
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Проверка завершена",
        description: "Подключение успешно",
      });
    } catch (error) {
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключиться к платежной системе",
        variant: "destructive",
      });
    } finally {
      setTestingStatus({ ...testingStatus, [systemId]: false });
    }
  };

  const getStatusBadge = (system: { enabledKey: string; tokenKey: string }) => {
    const isEnabled = getSetting(system.enabledKey) === "true";
    const hasToken = !!getSetting(system.tokenKey);

    if (!hasToken) {
      return <Badge variant="outline" className="gap-1"><X className="h-3 w-3" />Не настроен</Badge>;
    }
    if (!isEnabled) {
      return <Badge variant="secondary" className="gap-1">Отключен</Badge>;
    }
    return <Badge variant="default" className="gap-1 bg-success text-success-foreground"><Check className="h-3 w-3" />Подключен</Badge>;
  };

  const depositStats = useMemo(() => {
    if (!paymentStats?.depositsByMethod) return null;
    
    const methods = Object.entries(paymentStats.depositsByMethod);
    const totalDeposits = methods.reduce((acc, [, stats]) => acc + stats.total, 0);
    const totalCount = methods.reduce((acc, [, stats]) => acc + stats.count, 0);
    
    return { methods, totalDeposits, totalCount };
  }, [paymentStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Платежи</h1>
            <p className="text-sm text-muted-foreground">
              Управление платежными системами
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <Card className="border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle>Статистика платежей</CardTitle>
            <CardDescription>Информация о подключенных системах</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/40">
                <div className="text-sm text-muted-foreground">Активных систем</div>
                <div className="text-2xl font-bold text-foreground">
                  {paymentSystems.filter(s => getSetting(s.enabledKey) === "true").length}
                </div>
              </div>
              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/40">
                <div className="text-sm text-muted-foreground">Настроенных</div>
                <div className="text-2xl font-bold text-foreground">
                  {paymentSystems.filter(s => !!getSetting(s.tokenKey)).length}
                </div>
              </div>
              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/40">
                <div className="text-sm text-muted-foreground">Всего систем</div>
                <div className="text-2xl font-bold text-foreground">
                  {paymentSystems.length}
                </div>
              </div>
              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/40">
                <div className="text-sm text-muted-foreground">Готово к работе</div>
                <div className="text-2xl font-bold text-success">
                  {paymentSystems.filter(s => getSetting(s.enabledKey) === "true" && !!getSetting(s.tokenKey)).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Статистика депозитов */}
        {depositStats && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Статистика депозитов
              </CardTitle>
              <CardDescription>Данные из локальной базы</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Всего депозитов</p>
                  <p className="text-2xl font-bold">{depositStats.totalCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Общая сумма</p>
                  <p className="text-2xl font-bold">{depositStats.totalDeposits.toFixed(2)} ₽</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Средний чек</p>
                  <p className="text-2xl font-bold">
                    {(depositStats.totalDeposits / depositStats.totalCount).toFixed(2)} ₽
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {depositStats.methods.map(([method, stats]) => (
                  <div key={method} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium capitalize">{method}</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.count} транзакций • {stats.completed} завершено
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{stats.total.toFixed(2)} ₽</p>
                      <p className="text-sm text-muted-foreground">
                        {((stats.completed / stats.count) * 100).toFixed(0)}% успех
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Балансы платежных систем */}
        {paymentStats?.paymentStats && paymentStats.paymentStats.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {paymentStats.paymentStats.map((stat) => (
              <Card key={stat.system} className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      {stat.system}
                    </span>
                    <Badge variant={stat.status === 'connected' ? 'default' : 'secondary'}>
                      {stat.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {stat.enabled ? 'Система активна' : 'Система отключена'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stat.status === 'connected' && Array.isArray(stat.balance) ? (
                    <div className="space-y-2">
                      {stat.balance.length > 0 ? (
                        stat.balance.map((b: any, idx: number) => (
                          <div key={idx} className="flex justify-between p-2 bg-muted/50 rounded">
                            <span className="uppercase font-medium">{b.currency_code}</span>
                            <span className="font-bold">{parseFloat(b.available).toFixed(8)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Нет доступных балансов</p>
                      )}
                    </div>
                  ) : stat.status === 'error' ? (
                    <p className="text-sm text-destructive">{stat.error || 'Ошибка подключения'}</p>
                  ) : stat.status === 'disabled' ? (
                    <p className="text-sm text-muted-foreground">Система отключена</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{stat.balance}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {paymentSystems.map((system) => {
          const Icon = system.icon;
          const isEnabled = getSetting(system.enabledKey) === "true";
          const currentToken = getSetting(system.tokenKey) || "";
          const isTesting = testingStatus[system.id];

          return (
            <Card key={system.id} className="border-border/40 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-gradient-primary p-3 shadow-glow">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{system.name}</CardTitle>
                      <CardDescription>{system.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(system)}
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(system)}
                      disabled={!currentToken}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${system.id}-token`}>
                    {system.id === "cards" ? "Номер карты" : "API Токен"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`${system.id}-token`}
                      type={system.id === "cards" ? "text" : "password"}
                      placeholder={
                        system.id === "cards"
                          ? "1234 5678 9012 3456"
                          : "Введите токен..."
                      }
                      defaultValue={currentToken}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSaveToken(system)}
                      disabled={updateSetting.isPending}
                    >
                      {updateSetting.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Сохранить"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTest(system.id)}
                      disabled={!currentToken || isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Проверить"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
