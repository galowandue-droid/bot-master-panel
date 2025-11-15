import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Save, MessageCircle, HeadphonesIcon, Webhook, Eye, Power } from "lucide-react";
import { useBotSettings } from "@/hooks/useBotSettings";
import { toast } from "@/hooks/use-toast";

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
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Настройки</h1>
            <p className="text-sm text-muted-foreground">
              Конфигурация бота и системы
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 h-[calc(100vh-4rem)] overflow-auto">
        <div className="space-y-6 max-w-4xl mx-auto">
        {/* FAQ Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>FAQ</CardTitle>
                <CardDescription>
                  Часто задаваемые вопросы для пользователей
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, "faq")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faq">Текст FAQ</Label>
                <Textarea
                  id="faq"
                  name="faq"
                  placeholder="Введите текст FAQ (поддерживаются переменные)"
                  rows={4}
                  className="resize-none"
                  defaultValue={getSetting("faq") || ""}
                />
                <p className="text-xs text-muted-foreground">
                  Доступные переменные: {"{username}"}, {"{user_id}"}, {"{balance}"}
                </p>
              </div>
              <Button type="submit" className="gap-2" disabled={updateSetting.isPending}>
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Support Contact */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <HeadphonesIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Контакт поддержки</CardTitle>
                <CardDescription>
                  Username для связи с технической поддержкой
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, "support")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="support">Telegram username</Label>
                <Input
                  id="support"
                  name="support"
                  placeholder="@support_username"
                  defaultValue={getSetting("support") || ""}
                />
              </div>
              <Button type="submit" className="gap-2" disabled={updateSetting.isPending}>
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Discord Webhook */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Webhook className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Discord Webhook</CardTitle>
                <CardDescription>
                  Для загрузки фотографий товаров
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, "webhook")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook">Webhook URL</Label>
                <Input
                  id="webhook"
                  name="webhook"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  defaultValue={getSetting("webhook") || ""}
                />
              </div>
              <Button type="submit" className="gap-2" disabled={updateSetting.isPending}>
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Настройки отображения</CardTitle>
                <CardDescription>
                  Управление видимостью пустых элементов
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label>Скрывать пустые категории</Label>
                <p className="text-sm text-muted-foreground">
                  Категории без товаров не будут показаны пользователям
                </p>
              </div>
              <Switch
                checked={getSetting("hide_empty_categories") === "true"}
                onCheckedChange={() => handleToggle("hide_empty_categories")}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label>Скрывать пустые позиции</Label>
                <p className="text-sm text-muted-foreground">
                  Позиции без товаров не будут показаны пользователям
                </p>
              </div>
              <Switch
                checked={getSetting("hide_empty_positions") === "true"}
                onCheckedChange={() => handleToggle("hide_empty_positions")}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Power className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Выключатели системы</CardTitle>
                <CardDescription>
                  Управление доступностью основных функций бота
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-base">Технические работы</Label>
                <p className="text-sm text-muted-foreground">
                  Бот будет недоступен для пользователей
                </p>
              </div>
              <Switch
                checked={getSetting("maintenance_mode") === "true"}
                onCheckedChange={() => handleToggle("maintenance_mode")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-base">Покупки</Label>
                <p className="text-sm text-muted-foreground">
                  Отключить возможность совершения покупок
                </p>
              </div>
              <Switch
                checked={getSetting("purchases_enabled") === "true"}
                onCheckedChange={() => handleToggle("purchases_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-base">Пополнения</Label>
                <p className="text-sm text-muted-foreground">
                  Отключить возможность пополнения баланса
                </p>
              </div>
              <Switch
                checked={getSetting("deposits_enabled") === "true"}
                onCheckedChange={() => handleToggle("deposits_enabled")}
              />
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
