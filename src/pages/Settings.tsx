import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, MessageCircle, HeadphonesIcon, Webhook, Eye, Power, Settings2, Bell, Wallet, ShoppingCart } from "lucide-react";
import { useBotSettings } from "@/hooks/useBotSettings";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function Settings() {
  const { getSetting, updateSetting } = useBotSettings();

  const handleSave = async (key: string, value: string) => {
    await updateSetting.mutateAsync({ key, value });
  };

  const handleToggle = async (key: string) => {
    const currentValue = getSetting(key);
    const newValue = currentValue === "true" ? "false" : "true";
    await updateSetting.mutateAsync({ key, value: newValue });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, key: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const value = formData.get(key) as string;
    handleSave(key, value);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">Настройки</h1>
            <Breadcrumbs items={[{ label: "Настройки" }]} />
          </div>
        </div>
      </header>

      <div className="p-6 h-[calc(100vh-4rem)] overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="gap-2"><Settings2 className="h-4 w-4" />Общие</TabsTrigger>
              <TabsTrigger value="bot" className="gap-2"><MessageCircle className="h-4 w-4" />Бот</TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Уведомления</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader><div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2"><MessageCircle className="h-5 w-5 text-primary" /></div><div><CardTitle>FAQ</CardTitle><CardDescription>Часто задаваемые вопросы</CardDescription></div></div></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleSubmit(e, "faq")} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="faq">Текст FAQ</Label>
                      <Textarea id="faq" name="faq" placeholder="Введите текст FAQ" rows={4} className="resize-none" defaultValue={getSetting("faq") || ""} />
                    </div>
                    <Button type="submit" className="gap-2" disabled={updateSetting.isPending}><Save className="h-4 w-4" />Сохранить</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2"><HeadphonesIcon className="h-5 w-5 text-primary" /></div><div><CardTitle>Контакт поддержки</CardTitle><CardDescription>Username для связи</CardDescription></div></div></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleSubmit(e, "support_contact")} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="support_contact">Username поддержки</Label>
                      <Input id="support_contact" name="support_contact" placeholder="@support" defaultValue={getSetting("support_contact") || ""} />
                    </div>
                    <Button type="submit" className="gap-2" disabled={updateSetting.isPending}><Save className="h-4 w-4" />Сохранить</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Отображение каталога</CardTitle>
                      <CardDescription>Настройки видимости элементов</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="hide_empty_categories">Скрывать пустые категории</Label>
                      <p className="text-sm text-muted-foreground">Не показывать категории без товаров</p>
                    </div>
                    <Switch 
                      id="hide_empty_categories" 
                      checked={getSetting("hide_empty_categories") === "true"} 
                      onCheckedChange={() => handleToggle("hide_empty_categories")} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="hide_empty_positions">Скрывать пустые позиции</Label>
                      <p className="text-sm text-muted-foreground">Не показывать позиции без товаров</p>
                    </div>
                    <Switch 
                      id="hide_empty_positions" 
                      checked={getSetting("hide_empty_positions") === "true"} 
                      onCheckedChange={() => handleToggle("hide_empty_positions")} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bot" className="space-y-6">
              <Card>
                <CardHeader><div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2"><Webhook className="h-5 w-5 text-primary" /></div><div><CardTitle>Webhook</CardTitle><CardDescription>URL для получения обновлений</CardDescription></div></div></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleSubmit(e, "webhook_url")} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook_url">URL Webhook</Label>
                      <Input id="webhook_url" name="webhook_url" type="url" placeholder="https://..." defaultValue={getSetting("webhook_url") || ""} />
                    </div>
                    <Button type="submit" className="gap-2" disabled={updateSetting.isPending}><Save className="h-4 w-4" />Сохранить</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2"><Power className="h-5 w-5 text-primary" /></div><div><CardTitle>Статус бота</CardTitle><CardDescription>Включить/выключить бота</CardDescription></div></div></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5"><Label htmlFor="bot_enabled">Бот активен</Label><p className="text-sm text-muted-foreground">Когда выключен, бот не отвечает</p></div>
                    <Switch id="bot_enabled" checked={getSetting("bot_enabled") === "true"} onCheckedChange={() => handleToggle("bot_enabled")} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Settings2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Режим обслуживания</CardTitle>
                      <CardDescription>Временно отключить все функции</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenance_mode">Техническое обслуживание</Label>
                      <p className="text-sm text-muted-foreground">Бот будет недоступен</p>
                    </div>
                    <Switch 
                      id="maintenance_mode" 
                      checked={getSetting("maintenance_mode") === "true"} 
                      onCheckedChange={() => handleToggle("maintenance_mode")} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Пополнения</CardTitle>
                      <CardDescription>Возможность пополнять баланс</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="deposits_enabled">Пополнения включены</Label>
                      <p className="text-sm text-muted-foreground">Разрешить пополнение баланса</p>
                    </div>
                    <Switch 
                      id="deposits_enabled" 
                      checked={getSetting("deposits_enabled") === "true"} 
                      onCheckedChange={() => handleToggle("deposits_enabled")} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Покупки</CardTitle>
                      <CardDescription>Возможность совершать покупки</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="purchases_enabled">Покупки включены</Label>
                      <p className="text-sm text-muted-foreground">Разрешить покупку товаров</p>
                    </div>
                    <Switch 
                      id="purchases_enabled" 
                      checked={getSetting("purchases_enabled") === "true"} 
                      onCheckedChange={() => handleToggle("purchases_enabled")} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader><div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2"><Eye className="h-5 w-5 text-primary" /></div><div><CardTitle>Предпросмотр</CardTitle><CardDescription>Показывать preview ссылок</CardDescription></div></div></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5"><Label htmlFor="preview_enabled">Предпросмотр ссылок</Label><p className="text-sm text-muted-foreground">Показывать превью для URL</p></div>
                    <Switch id="preview_enabled" checked={getSetting("preview_enabled") === "true"} onCheckedChange={() => handleToggle("preview_enabled")} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
