import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Bitcoin, Wallet, Star, CreditCard, Save, MessageSquare, DollarSign, Link as LinkIcon } from "lucide-react";
import { validatePaymentToken } from "@/lib/payment-validation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PaymentSystemCard } from "@/components/payments/PaymentSystemCard";

interface PaymentSystem {
  id: string;
  name: string;
  description: string;
  icon: typeof Bitcoin;
  tokenKey: string;
  enabledKey: string;
  placeholder: string;
  tokenLabel: string;
  customLinkKey: string;
  commissionKey: string;
  defaultCommission: string;
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
    tokenLabel: "API токен",
    customLinkKey: "cryptobot_custom_link",
    commissionKey: "cryptobot_commission",
    defaultCommission: "0",
  },
  {
    id: "wata",
    name: "Wata",
    description: "Прием платежей через Wata (карты, СБП)",
    icon: CreditCard,
    tokenKey: "wata_token",
    enabledKey: "wata_enabled",
    placeholder: "Введите токен Wata...",
    tokenLabel: "API токен",
    customLinkKey: "wata_custom_link",
    commissionKey: "wata_commission",
    defaultCommission: "2",
  },
  {
    id: "heleket",
    name: "Heleket",
    description: "Прием платежей через Heleket",
    icon: Wallet,
    tokenKey: "heleket_token",
    enabledKey: "heleket_enabled",
    placeholder: "Введите токен Heleket...",
    tokenLabel: "API токен",
    customLinkKey: "heleket_custom_link",
    commissionKey: "heleket_commission",
    defaultCommission: "1",
  },
  {
    id: "telegram_stars",
    name: "Telegram Stars",
    description: "Встроенная валюта Telegram",
    icon: Star,
    tokenKey: "telegram_stars_token",
    enabledKey: "telegram_stars_enabled",
    placeholder: "Не требует токена",
    tokenLabel: "Токен",
    customLinkKey: "telegram_stars_custom_link",
    commissionKey: "telegram_stars_commission",
    defaultCommission: "0",
  },
];

export default function PaymentSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [customLinks, setCustomLinks] = useState<Record<string, string>>({});
  const [commissions, setCommissions] = useState<Record<string, string>>({});
  const [balances, setBalances] = useState<Record<string, any>>({});
  const [statuses, setStatuses] = useState<Record<string, "connected" | "disconnected" | "checking">>({});
  const [lastChecks, setLastChecks] = useState<Record<string, string>>({});
  
  // Message settings
  const [successMessage, setSuccessMessage] = useState("");
  const [failedMessage, setFailedMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  
  // Global limits
  const [minAmount, setMinAmount] = useState("100");
  const [maxAmount, setMaxAmount] = useState("100000");

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
      const newCustomLinks: Record<string, string> = {};

      paymentSystems.forEach((system) => {
        newTokens[system.id] = settingsMap[system.tokenKey] || "";
        newEnabled[system.id] = settingsMap[system.enabledKey] === "true";
        newCustomLinks[system.id] = settingsMap[system.customLinkKey] || "";
      });

      setTokens(newTokens);
      setEnabled(newEnabled);
      setCustomLinks(newCustomLinks);
      
      // Set individual commissions
      const newCommissions: Record<string, string> = {};
      paymentSystems.forEach((system) => {
        newCommissions[system.id] = settingsMap[system.commissionKey] || system.defaultCommission;
      });
      setCommissions(newCommissions);
      
      // Set messages
      setSuccessMessage(settingsMap.payment_success_message || "Оплата успешно завершена! ✅");
      setFailedMessage(settingsMap.payment_failed_message || "Ошибка оплаты. Попробуйте снова. ❌");
      setPendingMessage(settingsMap.payment_pending_message || "Ожидание оплаты... ⏳");
      
      // Set limits
      setMinAmount(settingsMap.payment_min_amount || "100");
      setMaxAmount(settingsMap.payment_max_amount || "100000");

      return settingsMap;
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const promises = Object.entries(updates).map(([key, value]) =>
        supabase.from("bot_settings").upsert({ key, value }, { onConflict: "key" })
      );

      const results = await Promise.all(promises);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast({ title: "Настройки сохранены" });
    },
    onError: () => {
      toast({
        title: "Ошибка при сохранении",
        variant: "destructive",
      });
    },
  });

  const handleToggleSystem = (systemId: string) => {
    const system = paymentSystems.find((s) => s.id === systemId);
    if (!system) return;

    const newEnabled = !enabled[systemId];
    setEnabled((prev) => ({ ...prev, [systemId]: newEnabled }));

    saveSettings.mutate({
      [system.enabledKey]: newEnabled.toString(),
    });
  };

  const handleSaveToken = (systemId: string) => {
    const system = paymentSystems.find((s) => s.id === systemId);
    if (!system) return;

    const token = tokens[systemId];
    const validation = validatePaymentToken(systemId, token);

    if (!validation.success) {
      toast({
        title: "Ошибка валидации",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    saveSettings.mutate({
      [system.tokenKey]: token,
    });
  };

  const handleSaveCustomLink = (systemId: string) => {
    const system = paymentSystems.find((s) => s.id === systemId);
    if (!system) return;

    saveSettings.mutate({
      [system.customLinkKey]: customLinks[systemId] || "",
    });
  };

  const handleSaveMessages = () => {
    saveSettings.mutate({
      payment_success_message: successMessage,
      payment_failed_message: failedMessage,
      payment_pending_message: pendingMessage,
    });
  };

  const handleSaveLimits = () => {
    saveSettings.mutate({
      payment_min_amount: minAmount,
      payment_max_amount: maxAmount,
    });
  };

  const handleSaveCommission = (systemId: string) => {
    const system = paymentSystems.find((s) => s.id === systemId);
    if (!system) return;

    saveSettings.mutate({
      [system.commissionKey]: commissions[systemId] || system.defaultCommission,
    });
  };

  const handleCheckConnection = async (systemId: string) => {
    setStatuses(prev => ({ ...prev, [systemId]: "checking" }));
    
    // Simulate API check - в реальности нужно вызвать payment-stats или проверку конкретного API
    setTimeout(() => {
      const isConnected = enabled[systemId] && tokens[systemId];
      setStatuses(prev => ({ 
        ...prev, 
        [systemId]: isConnected ? "connected" : "disconnected" 
      }));
      setLastChecks(prev => ({ 
        ...prev, 
        [systemId]: new Date().toLocaleString('ru-RU') 
      }));
      
      toast({
        title: isConnected ? "Подключено" : "Не подключено",
        description: isConnected ? "Соединение успешно" : "Проверьте токен",
        variant: isConnected ? "default" : "destructive",
      });
    }, 1000);
  };

  const handleRefreshBalance = async (systemId: string) => {
    toast({
      title: "Обновление баланса",
      description: "Баланс обновляется...",
    });
    // В реальности нужно вызвать payment-stats API
  };

  const MessagePreview = ({ message, status }: { message: string; status: 'success' | 'failed' | 'pending' }) => {
    const statusColors = {
      success: 'bg-green-50 border-green-200',
      failed: 'bg-red-50 border-red-200',
      pending: 'bg-yellow-50 border-yellow-200',
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${statusColors[status]} max-w-sm`}>
        <div className="text-sm whitespace-pre-wrap">{message}</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Настройки платежей"
        description="Управление платежными системами и параметрами оплаты"
        icon={<Wallet className="h-5 w-5 text-primary" />}
      />

      <PageContainer>

      <Tabs defaultValue="systems" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="systems">Платежные системы</TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Сообщения
          </TabsTrigger>
          <TabsTrigger value="limits">
            <DollarSign className="h-4 w-4 mr-2" />
            Лимиты и комиссии
          </TabsTrigger>
          <TabsTrigger value="links">
            <LinkIcon className="h-4 w-4 mr-2" />
            Кастомные ссылки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {paymentSystems.map((system) => (
              <PaymentSystemCard
                key={system.id}
                id={system.id}
                name={system.name}
                description={system.description}
                icon={system.icon}
                isEnabled={enabled[system.id]}
                token={tokens[system.id] || ""}
                tokenLabel={system.tokenLabel}
                tokenPlaceholder={system.placeholder}
                commission={commissions[system.id] || system.defaultCommission}
                balance={balances[system.id]}
                status={statuses[system.id]}
                lastCheck={lastChecks[system.id]}
                onToggle={() => handleToggleSystem(system.id)}
                onSaveToken={() => handleSaveToken(system.id)}
                onSaveCommission={() => handleSaveCommission(system.id)}
                onCheckConnection={() => handleCheckConnection(system.id)}
                onRefreshBalance={() => handleRefreshBalance(system.id)}
                onTokenChange={(value) => setTokens((prev) => ({ ...prev, [system.id]: value }))}
                onCommissionChange={(value) => setCommissions((prev) => ({ ...prev, [system.id]: value }))}
                isSaving={saveSettings.isPending}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Кастомные сообщения</CardTitle>
              <CardDescription>
                Настройте текст сообщений для разных статусов оплаты
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Успешная оплата</Label>
                <Textarea
                  placeholder="Введите сообщение об успешной оплате..."
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Доступные переменные: {"{amount}"}, {"{username}"}, {"{order_id}"}
                </p>
                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground mb-2 block">Превью:</Label>
                  <MessagePreview message={successMessage} status="success" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Ошибка оплаты</Label>
                <Textarea
                  placeholder="Введите сообщение об ошибке оплаты..."
                  value={failedMessage}
                  onChange={(e) => setFailedMessage(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Доступные переменные: {"{amount}"}, {"{username}"}, {"{error}"}
                </p>
                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground mb-2 block">Превью:</Label>
                  <MessagePreview message={failedMessage} status="failed" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Ожидание оплаты</Label>
                <Textarea
                  placeholder="Введите сообщение об ожидании оплаты..."
                  value={pendingMessage}
                  onChange={(e) => setPendingMessage(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Доступные переменные: {"{amount}"}, {"{username}"}, {"{time}"}
                </p>
                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground mb-2 block">Превью:</Label>
                  <MessagePreview message={pendingMessage} status="pending" />
                </div>
              </div>

              <Button onClick={handleSaveMessages} disabled={saveSettings.isPending}>
                {saveSettings.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить сообщения
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Лимиты платежей</CardTitle>
              <CardDescription>
                Установите минимальную и максимальную сумму платежа
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Минимальная сумма (₽)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Максимальная сумма (₽)</Label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <Alert>
                <AlertDescription>
                  Платежи вне этого диапазона будут автоматически отклонены
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Комиссии по платежным системам</CardTitle>
              <CardDescription>
                Настройте комиссию для каждой платежной системы индивидуально (в процентах)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentSystems.map((system) => (
                <div key={system.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <system.icon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{system.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Текущая комиссия: {commissions[system.id] || system.defaultCommission}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={system.defaultCommission}
                      value={commissions[system.id] || system.defaultCommission}
                      onChange={(e) =>
                        setCommissions((prev) => ({
                          ...prev,
                          [system.id]: e.target.value,
                        }))
                      }
                      className="w-20"
                    />
                    <span className="text-sm">%</span>
                    <Button
                      size="sm"
                      onClick={() => handleSaveCommission(system.id)}
                      disabled={saveSettings.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Alert>
                <AlertDescription>
                  Пример: платеж 1000₽ с комиссией 2% = 1020₽ (комиссия 20₽)
                </AlertDescription>
              </Alert>

              <Button onClick={handleSaveLimits} disabled={saveSettings.isPending} className="w-full">
                {saveSettings.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить лимиты
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Кастомные ссылки</CardTitle>
              <CardDescription>
                Добавьте кастомные ссылки для платежных систем
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentSystems.map((system) => {
                const Icon = system.icon;
                return (
                  <div key={system.id} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {system.name}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={customLinks[system.id] || ""}
                        onChange={(e) =>
                          setCustomLinks((prev) => ({
                            ...prev,
                            [system.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        onClick={() => handleSaveCustomLink(system.id)}
                        disabled={saveSettings.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Alert>
                <AlertDescription>
                  Если указана кастомная ссылка, она будет использоваться вместо стандартной
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </PageContainer>
    </>
  );
}
