import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReferrals } from "@/hooks/useReferrals";
import { Users, Gift, TrendingUp, Copy, Check, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReferralSettings } from "@/components/referrals/ReferralSettings";
import { ReferralHistory } from "@/components/referrals/ReferralHistory";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Referrals = () => {
  const { referrals, stats, settings, isLoading, updateSettings } = useReferrals();
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState("");

  const handleCopyLink = (id: string) => {
    if (!id.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ID пользователя",
        variant: "destructive",
      });
      return;
    }

    const link = `https://t.me/your_bot?start=ref_${id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Ссылка скопирована" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (newSettings: Record<string, string>) => {
    updateSettings.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">🤝 Реферальная система</h1>
            <p className="text-sm text-muted-foreground">
              Управление реферальной программой и вознаграждениями
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
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
              <div className="text-2xl font-bold">{stats?.totalRewards.toFixed(2) || "0.00"} ₽</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList>
            <TabsTrigger value="history">История</TabsTrigger>
            <TabsTrigger value="generator">Генератор ссылок</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <ReferralHistory referrals={referrals || []} />
          </TabsContent>

          <TabsContent value="generator" className="space-y-4">
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
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  <Button onClick={() => handleCopyLink(userId)}>
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
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <ReferralSettings
              settings={settings || {}}
              onSave={handleSaveSettings}
              isSaving={updateSettings.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Referrals;
