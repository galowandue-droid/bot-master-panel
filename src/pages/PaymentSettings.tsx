import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Bitcoin, Wallet, Star, CreditCard, CheckCircle2, XCircle, Circle, AlertCircle, Clock } from "lucide-react";
import { validatePaymentToken } from "@/lib/payment-validation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface PaymentSystem {
  id: string;
  name: string;
  description: string;
  icon: typeof Bitcoin;
  tokenKey: string;
  enabledKey: string;
  placeholder: string;
  testable: boolean;
  balanceLabel: string;
  tokenLabel: string;
}

const paymentSystems: PaymentSystem[] = [
  {
    id: "cryptobot",
    name: "CryptoBot",
    description: "Прием платежей через CryptoBot (криптовалюта)",
    icon: Bitcoin,
    tokenKey: "cryptobot_token",
    enabledKey: "cryptobot_enabled",
    placeholder: "Введите токен CryptoBot...",
    testable: true,
    balanceLabel: "Баланс",
    tokenLabel: "API токен",
  },
  {
    id: "wata",
    name: "Wata",
    description: "Прием платежей через Wata (карты, СБП, международные)",
    icon: CreditCard,
    tokenKey: "wata_token",
    enabledKey: "wata_enabled",
    placeholder: "Введите токен Wata...",
    testable: true,
    balanceLabel: "Баланс",
    tokenLabel: "API токен",
  },
  {
    id: "heleket",
    name: "Heleket",
    description: "Прием платежей через Heleket",
    icon: Wallet,
    tokenKey: "heleket_token",
    enabledKey: "heleket_enabled",
    placeholder: "Введите токен Heleket...",
    testable: true,
    balanceLabel: "Баланс",
    tokenLabel: "API токен",
  },
  {
    id: "telegram_stars",
    name: "Telegram Stars",
    description: "Встроенная валюта Telegram",
    icon: Star,
    tokenKey: "telegram_stars_token",
    enabledKey: "telegram_stars_enabled",
    placeholder: "Не требует токена",
    testable: false,
    balanceLabel: "Баланс",
    tokenLabel: "Токен",
  },
];

export default function PaymentSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [testingSystem, setTestingSystem] = useState<string | null>(null);
  const [lastTestTime, setLastTestTime] = useState<Record<string, Date>>({});

  const { data: settings, isLoading, refetch: refetchSettings } = useQuery({
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

  const { data: paymentStats, refetch: refetchStats } = useQuery({
    queryKey: ["payment-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('payment-stats');
      if (error) throw error;
      return data;
    },
  });

  const saveTokenMutation = useMutation({
    mutationFn: async ({ systemId, token }: { systemId: string; token: string }) => {
      const system = paymentSystems.find((s) => s.id === systemId);
      if (!system) throw new Error("System not found");

      validatePaymentToken(systemId, token);

      const { error } = await supabase.from("bot_settings").upsert({
        key: system.tokenKey,
        value: token,
      });

      if (error) throw error;
      return { system };
    },
    onSuccess: ({ system }) => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast({
        title: "Успешно",
        description: `Токен для ${system.name} сохранен. Теперь проверьте подключение.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка валидации",
        description: error instanceof Error ? error.message : "Неверный формат токена",
        variant: "destructive",
      });
    },
  });

  const handleSaveToken = async (systemId: string) => {
    const token = tokens[systemId];
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Введите токен",
        variant: "destructive",
      });
      return;
    }

    await saveTokenMutation.mutateAsync({ systemId, token });
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ systemId, newValue }: { systemId: string; newValue: boolean }) => {
      const system = paymentSystems.find((s) => s.id === systemId);
      if (!system) throw new Error("System not found");

      const { error } = await supabase.from("bot_settings").upsert({
        key: system.enabledKey,
        value: newValue.toString(),
      });

      if (error) throw error;
      return { system, newValue };
    },
    onSuccess: ({ system, newValue }, { systemId }) => {
      setEnabled({ ...enabled, [systemId]: newValue });
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast({
        title: "Успешно",
        description: `${system.name} ${newValue ? "включен" : "отключен"}`,
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус",
        variant: "destructive",
      });
    },
  });

  const handleToggle = async (systemId: string, newValue: boolean) => {
    await toggleMutation.mutateAsync({ systemId, newValue });
  };

  const testMutation = useMutation({
    mutationFn: async (systemId: string) => {
      const { data, error } = await supabase.functions.invoke("test-payment-system", {
        body: { system: systemId },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Не удалось подключиться к платежной системе");
      }

      return { systemId, data };
    },
    onSuccess: ({ systemId }) => {
      setLastTestTime({ ...lastTestTime, [systemId]: new Date() });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      toast({
        title: "Подключено",
        description: "Подключение к платежной системе работает",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка подключения",
        description: error instanceof Error ? error.message : "Не удалось подключиться",
        variant: "destructive",
      });
    },
  });

  const handleTest = async (systemId: string) => {
    setTestingSystem(systemId);
    try {
      await testMutation.mutateAsync(systemId);
    } finally {
      setTestingSystem(null);
    }
  };

  const getStatusInfo = (systemId: string) => {
    const systemStats = paymentStats?.paymentStats?.find(
      (stat: any) => stat.system.toLowerCase() === systemId
    );
    const hasToken = tokens[systemId]?.length > 0;
    const lastTest = lastTestTime[systemId];

    if (!hasToken) {
      return {
        badge: (
          <Badge variant="secondary" className="gap-1">
            <Circle className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
            Не настроено
          </Badge>
        ),
        canEnable: false,
        message: null,
      };
    }

    if (!enabled[systemId]) {
      return {
        badge: (
          <Badge variant="secondary" className="gap-1">
            <Circle className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
            Отключено
          </Badge>
        ),
        canEnable: lastTest !== undefined,
        message: lastTest ? null : "Проверьте подключение перед включением",
      };
    }

    if (systemStats?.status === "error") {
      return {
        badge: (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Ошибка
          </Badge>
        ),
        canEnable: true,
        message: null,
      };
    }

    if (lastTest) {
      const timeStr = format(lastTest, "сегодня в HH:mm", { locale: ru });
      return {
        badge: (
          <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Подключено
          </Badge>
        ),
        canEnable: true,
        message: (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Clock className="h-3 w-3" />
            <span>Последняя проверка: {timeStr}</span>
          </div>
        ),
      };
    }

    return {
      badge: (
        <Badge variant="secondary" className="gap-1">
          <Circle className="h-3 w-3 fill-primary text-primary" />
          Не проверено
        </Badge>
      ),
      canEnable: false,
      message: "Проверьте подключение перед включением",
    };
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Платежные системы</h1>
        <p className="text-muted-foreground">
          Управление способами оплаты
        </p>
      </div>

      <div className="grid gap-6">
        {paymentSystems.map((system) => {
          const Icon = system.icon;
          const statusInfo = getStatusInfo(system.id);
          const isEnabled = enabled[system.id];
          const systemStats = paymentStats?.paymentStats?.find(
            (stat: any) => stat.system.toLowerCase() === system.id
          );
          const hasError = systemStats?.status === "error";
          const isConnected = lastTestTime[system.id] && isEnabled;

          return (
            <Card key={system.id} className="border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-card">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{system.name}</CardTitle>
                      <CardDescription className="text-sm mt-0.5">
                        {system.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(system.id, checked)}
                    disabled={!statusInfo.canEnable}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {system.id !== "telegram_stars" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {system.tokenLabel}
                      </label>
                      <Input
                        type="password"
                        placeholder={system.placeholder}
                        value={tokens[system.id] || ""}
                        onChange={(e) =>
                          setTokens({ ...tokens, [system.id]: e.target.value })
                        }
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {system.balanceLabel}
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={
                            systemStats?.balance
                              ? typeof systemStats.balance === "object"
                                ? JSON.stringify(systemStats.balance)
                                : systemStats.balance
                              : "₽0.00"
                          }
                          disabled
                          className="bg-background pr-20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            refetchStats();
                            toast({ title: "Обновлено", description: "Баланс обновлен" });
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                        >
                          Обновить
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {system.id === "telegram_stars" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {system.balanceLabel}
                    </label>
                    <Input
                      type="text"
                      value="Не требует настройки"
                      disabled
                      className="bg-background"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {system.id !== "telegram_stars" && (
                    <Button
                      onClick={() => handleSaveToken(system.id)}
                      disabled={!tokens[system.id] || saveTokenMutation.isPending}
                      className="flex-1"
                    >
                      {saveTokenMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Сохранение...
                        </>
                      ) : (
                        "Сохранить"
                      )}
                    </Button>
                  )}
                  {system.testable && (
                    <Button
                      onClick={() => handleTest(system.id)}
                      disabled={!tokens[system.id] || testingSystem === system.id}
                      variant="outline"
                      className="flex-1"
                    >
                      {testingSystem === system.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Проверка...
                        </>
                      ) : (
                        "Проверить подключение"
                      )}
                    </Button>
                  )}
                </div>

                {/* Status messages */}
                {isConnected && lastTestTime[system.id] && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Подключено
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground ml-auto">
                      Последняя проверка: {format(lastTestTime[system.id], "сегодня в HH:mm", { locale: ru })}
                    </span>
                  </div>
                )}

                {!isEnabled && statusInfo.message && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{statusInfo.message}</span>
                  </div>
                )}

                {hasError && systemStats?.error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-destructive">{systemStats.error}</span>
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
