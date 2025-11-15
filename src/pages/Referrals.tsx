import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useReferrals } from "@/hooks/useReferrals";
import { Users, Gift, TrendingUp, Copy, Check, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Referrals = () => {
  const { referrals, stats, settings, isLoading, updateSettings, updateStatus, deleteReferral } = useReferrals();
  const [copied, setCopied] = useState(false);
  const [referralSettings, setReferralSettings] = useState({
    referral_enabled: "true",
    referral_reward_type: "fixed",
    referral_reward_amount: "100",
    referral_min_purchase: "0",
  });

  // Update local state when settings load
  useState(() => {
    if (settings) {
      setReferralSettings(prev => ({ ...prev, ...settings }));
    }
  });

  const handleCopyLink = (userId: string) => {
    const link = `https://t.me/your_bot?start=ref_${userId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Ссылка скопирована" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    updateSettings.mutate(referralSettings);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "⏳ Ожидает", variant: "secondary" as const },
      completed: { label: "✅ Выполнен", variant: "default" as const },
      rewarded: { label: "🎁 Вознагражден", variant: "default" as const },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">🤝 Реферальная система</h1>
        <p className="text-muted-foreground mt-2">
          Управление реферальной программой и вознаграждениями
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего рефералов</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидают</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполнено</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выплачено</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRewards || 0} ₽</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="referrals" className="w-full">
        <TabsList>
          <TabsTrigger value="referrals">Рефералы</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="space-y-4">
          {/* Referral Link Generator */}
          <Card>
            <CardHeader>
              <CardTitle>Генератор реферальных ссылок</CardTitle>
              <CardDescription>
                Создайте реферальную ссылку для пользователя
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="ID пользователя"
                  value=""
                  onChange={() => {}}
                />
                <Button onClick={() => handleCopyLink("example")}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Alert>
                <AlertDescription>
                  Реферальная ссылка будет иметь вид: https://t.me/your_bot?start=ref_USER_ID
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Referrals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Список рефералов</CardTitle>
              <CardDescription>
                Все реферальные связи и их статусы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Реферер</TableHead>
                    <TableHead>Приглашенный</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Вознаграждение</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals && referrals.length > 0 ? (
                    referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          {referral.referrer?.first_name || referral.referrer?.username || "Неизвестно"}
                        </TableCell>
                        <TableCell>
                          {referral.referred?.first_name || referral.referred?.username || "Неизвестно"}
                        </TableCell>
                        <TableCell>{getStatusBadge(referral.status)}</TableCell>
                        <TableCell>{referral.reward_amount || 0} ₽</TableCell>
                        <TableCell>
                          {new Date(referral.created_at).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {referral.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus.mutate({ 
                                  id: referral.id, 
                                  status: 'completed' 
                                })}
                              >
                                Завершить
                              </Button>
                            )}
                            {referral.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus.mutate({ 
                                  id: referral.id, 
                                  status: 'rewarded' 
                                })}
                              >
                                Выплатить
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteReferral.mutate(referral.id)}
                            >
                              Удалить
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Пока нет рефералов
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Настройки реферальной системы</CardTitle>
              <CardDescription>
                Управление параметрами реферальной программы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Включить реферальную систему</Label>
                  <p className="text-sm text-muted-foreground">
                    Активировать программу рефералов
                  </p>
                </div>
                <Switch
                  checked={referralSettings.referral_enabled === "true"}
                  onCheckedChange={(checked) =>
                    setReferralSettings(prev => ({ 
                      ...prev, 
                      referral_enabled: checked ? "true" : "false" 
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Тип вознаграждения</Label>
                <Select
                  value={referralSettings.referral_reward_type}
                  onValueChange={(value) =>
                    setReferralSettings(prev => ({ 
                      ...prev, 
                      referral_reward_type: value 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Фиксированная сумма</SelectItem>
                    <SelectItem value="percent">Процент от покупки</SelectItem>
                    <SelectItem value="both">Оба варианта</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Размер вознаграждения</Label>
                <Input
                  type="number"
                  value={referralSettings.referral_reward_amount}
                  onChange={(e) =>
                    setReferralSettings(prev => ({ 
                      ...prev, 
                      referral_reward_amount: e.target.value 
                    }))
                  }
                  placeholder="100"
                />
                <p className="text-sm text-muted-foreground">
                  {referralSettings.referral_reward_type === "percent" 
                    ? "Процент от суммы покупки" 
                    : "Сумма в рублях"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Минимальная покупка</Label>
                <Input
                  type="number"
                  value={referralSettings.referral_min_purchase}
                  onChange={(e) =>
                    setReferralSettings(prev => ({ 
                      ...prev, 
                      referral_min_purchase: e.target.value 
                    }))
                  }
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  Минимальная сумма покупки для начисления вознаграждения
                </p>
              </div>

              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? "Сохранение..." : "Сохранить настройки"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Referrals;
