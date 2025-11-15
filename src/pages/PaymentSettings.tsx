import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Bitcoin, Wallet, Star, CreditCard, CheckCircle2, XCircle, Circle, AlertCircle } from "lucide-react";
import { validatePaymentToken } from "@/lib/payment-validation";

interface PaymentSystem {
  id: string;
  name: string;
  description: string;
  icon: typeof Bitcoin;
  tokenKey: string;
  enabledKey: string;
  placeholder: string;
  testable: boolean;
}

const paymentSystems: PaymentSystem[] = [
  {
    id: "cryptobot",
    name: "CryptoBot",
    description: "Прием платежей в криптовалюте через CryptoBot",
    icon: Bitcoin,
    tokenKey: "cryptobot_token",
    enabledKey: "cryptobot_enabled",
    placeholder: "Введите API токен CryptoBot",
    testable: true,
  },
  {
    id: "yoomoney",
    name: "ЮMoney",
    description: "Прием платежей через ЮMoney",
    icon: Wallet,
    tokenKey: "yoomoney_token",
    enabledKey: "yoomoney_enabled",
    placeholder: "Введите токен ЮMoney",
    testable: false,
  },
  {
    id: "telegram_stars",
    name: "Telegram Stars",
    description: "Прием платежей через Telegram Stars",
    icon: Star,
    tokenKey: "telegram_stars_enabled",
    enabledKey: "telegram_stars_enabled",
    placeholder: "Не требует токена",
    testable: false,
  },
  {
    id: "cards",
    name: "Банковские карты",
    description: "Прием платежей по номеру карты",
    icon: CreditCard,
    tokenKey: "card_number",
    enabledKey: "cards_enabled",
    placeholder: "Введите номер карты",
    testable: false,
  },
];

export default function PaymentSettings() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [testingSystem, setTestingSystem] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_settings")
        .select("key, value");

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data?.forEach((setting) => {
        settingsMap[setting.key] = setting.value || "";
      });

      const newTokens: Record<string, string> = {};
      const newEnabled: Record<string, boolean> = {};

      paymentSystems.forEach((system) => {
        newTokens[system.id] = settingsMap[system.tokenKey] || "";
        newEnabled[system.id] = settingsMap[system.enabledKey] === "true";
      });

      setTokens(newTokens);
      setEnabled(newEnabled);

      return settingsMap;
    },
  });

  const { data: paymentStats } = useQuery({
    queryKey: ["payment-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('payment-stats');
      if (error) throw error;
      return data;
    },
  });

  const handleSaveToken = async (systemId: string) => {
    const system = paymentSystems.find((s) => s.id === systemId);
    if (!system) return;

    const token = tokens[systemId];

    try {
      validatePaymentToken(systemId, token);
    } catch (error) {
      toast({
        title: "Ошибка валидации",
        description: error instanceof Error ? error.message : "Неверный формат токена",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("bot_settings").upsert({
      key: system.tokenKey,
      value: token,
    });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить токен",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Успешно",
      description: `Токен для ${system.name} сохранен`,
    });
  };

  const handleToggle = async (systemId: string, newValue: boolean) => {
    const system = paymentSystems.find((s) => s.id === systemId);
    if (!system) return;

    const { error } = await supabase.from("bot_settings").upsert({
      key: system.enabledKey,
      value: newValue.toString(),
    });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус",
        variant: "destructive",
      });
      return;
    }

    setEnabled({ ...enabled, [systemId]: newValue });
    toast({
      title: "Успешно",
      description: `${system.name} ${newValue ? "включен" : "отключен"}`,
    });
  };

  const handleTest = async (systemId: string) => {
    setTestingSystem(systemId);

    const { data, error } = await supabase.functions.invoke("test-payment-system", {
      body: { system: systemId },
    });

    setTestingSystem(null);

    if (error || !data?.success) {
      toast({
        title: "Ошибка подключения",
        description: data?.error || "Не удалось подключиться к платежной системе",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Успешно",
      description: "Подключение к платежной системе работает",
    });
  };

  const getStatusBadge = (systemId: string) => {
    const systemStats = paymentStats?.paymentStats?.find(
      (stat: any) => stat.system.toLowerCase() === systemId
    );

    if (!enabled[systemId]) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Circle className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
          Отключено
        </Badge>
      );
    }

    if (!systemStats) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Circle className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
          Не настроено
        </Badge>
      );
    }

    if (systemStats.status === "error") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Ошибка
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Подключено
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Настройки платежей</h1>
        <p className="text-muted-foreground">
          Настройте платежные системы и API токены для приема платежей
        </p>
      </div>

      <div className="grid gap-6">
        {paymentSystems.map((system) => {
          const Icon = system.icon;
          const isEnabled = enabled[system.id];
          const systemStats = paymentStats?.paymentStats?.find(
            (stat: any) => stat.system.toLowerCase() === system.id
          );
          const hasError = systemStats?.status === "error";
          const isConnected = systemStats?.status === "connected";

          return (
            <Card key={system.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg transition-colors ${
                        isConnected
                          ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                          : hasError
                          ? "bg-destructive/10 text-destructive"
                          : !isEnabled
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{system.name}</CardTitle>
                        {getStatusBadge(system.id)}
                      </div>
                      <CardDescription className="mt-1">{system.description}</CardDescription>
                      {systemStats?.balance && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Баланс: {JSON.stringify(systemStats.balance)}
                        </p>
                      )}
                      {hasError && systemStats?.error && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-destructive/10 rounded-md">
                          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-destructive">{systemStats.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(system.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {system.id !== "telegram_stars" && (
                  <div className="space-y-2">
                    <Input
                      type={system.id === "cards" ? "text" : "password"}
                      placeholder={system.placeholder}
                      value={tokens[system.id] || ""}
                      onChange={(e) =>
                        setTokens({ ...tokens, [system.id]: e.target.value })
                      }
                      disabled={!isEnabled}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveToken(system.id)}
                        disabled={!isEnabled || !tokens[system.id]}
                        className="flex-1"
                      >
                        Сохранить
                      </Button>
                      {system.testable && (
                        <Button
                          onClick={() => handleTest(system.id)}
                          disabled={!isEnabled || testingSystem === system.id}
                          variant="outline"
                        >
                          {testingSystem === system.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Тест"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
