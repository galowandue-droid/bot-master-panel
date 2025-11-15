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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

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
  },
];

export default function PaymentSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [customLinks, setCustomLinks] = useState<Record<string, string>>({});
  
  // Message settings
  const [successMessage, setSuccessMessage] = useState("");
  const [failedMessage, setFailedMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  
  // Commission and limits
  const [minAmount, setMinAmount] = useState("100");
  const [maxAmount, setMaxAmount] = useState("100000");
  const [commissionPercent, setCommissionPercent] = useState("0");
  const [commissionFixed, setCommissionFixed] = useState("0");

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
      
      // Set messages
      setSuccessMessage(settingsMap.payment_success_message || "Оплата успешно завершена! ✅");
      setFailedMessage(settingsMap.payment_failed_message || "Ошибка оплаты. Попробуйте снова. ❌");
      setPendingMessage(settingsMap.payment_pending_message || "Ожидание оплаты... ⏳");
      
      // Set limits and commissions
      setMinAmount(settingsMap.payment_min_amount || "100");
      setMaxAmount(settingsMap.payment_max_amount || "100000");
      setCommissionPercent(settingsMap.payment_commission_percent || "0");
      setCommissionFixed(settingsMap.payment_commission_fixed || "0");

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

  const handleSaveLimitsAndCommissions = () => {
    saveSettings.mutate({
      payment_min_amount: minAmount,
      payment_max_amount: maxAmount,
      payment_commission_percent: commissionPercent,
      payment_commission_fixed: commissionFixed,
    });
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
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-bold">💳 Настройки платежей</h1>
          <p className="text-muted-foreground mt-2">
            Управление платежными системами и параметрами оплаты
          </p>
        </div>
      </div>

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
            {paymentSystems.map((system) => {
              const Icon = system.icon;
              const isEnabled = enabled[system.id];

              return (
                <Card key={system.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6" />
                        <div>
                          <CardTitle className="text-lg">{system.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {system.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleToggleSystem(system.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEnabled && (
                      <>
                        <div className="space-y-2">
                          <Label>{system.tokenLabel}</Label>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              placeholder={system.placeholder}
                              value={tokens[system.id] || ""}
                              onChange={(e) =>
                                setTokens((prev) => ({
                                  ...prev,
                                  [system.id]: e.target.value,
                                }))
                              }
                            />
                            <Button
                              onClick={() => handleSaveToken(system.id)}
                              disabled={saveSettings.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Badge variant={isEnabled ? "default" : "secondary"}>
                          {isEnabled ? "Активна" : "Неактивна"}
                        </Badge>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
              <CardTitle>Комиссии</CardTitle>
              <CardDescription>
                Настройте комиссию за проведение платежей
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Процент комиссии (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Процент от суммы платежа
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Фиксированная комиссия (₽)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={commissionFixed}
                    onChange={(e) => setCommissionFixed(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Добавляется к проценту
                  </p>
                </div>
              </div>

              {(parseFloat(commissionPercent) > 0 || parseFloat(commissionFixed) > 0) && (
                <Alert>
                  <AlertDescription>
                    Пример: платеж 1000₽ = {1000 * (1 + parseFloat(commissionPercent) / 100) + parseFloat(commissionFixed)}₽ 
                    (комиссия {1000 * parseFloat(commissionPercent) / 100 + parseFloat(commissionFixed)}₽)
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSaveLimitsAndCommissions} disabled={saveSettings.isPending}>
                {saveSettings.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить настройки
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
    </div>
  );
}
