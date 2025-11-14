import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Settings as SettingsIcon, Save } from "lucide-react";

export default function Settings() {
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

      <div className="p-6 space-y-6">
        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Основные настройки
            </h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="faq">FAQ</Label>
              <Textarea
                id="faq"
                placeholder="Введите текст FAQ (поддерживаются переменные)"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Доступные переменные: {"{username}"}, {"{user_id}"}, {"{balance}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support">Контакт поддержки</Label>
              <Input
                id="support"
                placeholder="@support_username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook">Discord Webhook</Label>
              <Input
                id="webhook"
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
              />
              <p className="text-xs text-muted-foreground">
                Для загрузки фотографий товаров
              </p>
            </div>

            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Сохранить изменения
            </Button>
          </div>
        </Card>

        {/* Display Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Настройки отображения
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Скрывать пустые категории</Label>
                <p className="text-sm text-muted-foreground">
                  Категории без товаров не будут показаны пользователям
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Скрывать пустые позиции</Label>
                <p className="text-sm text-muted-foreground">
                  Позиции без товаров не будут показаны пользователям
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* System Controls */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Выключатели системы
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-base">Технические работы</Label>
                <p className="text-sm text-muted-foreground">
                  Бот будет недоступен для пользователей
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-base">Покупки</Label>
                <p className="text-sm text-muted-foreground">
                  Отключить возможность совершения покупок
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-base">Пополнения</Label>
                <p className="text-sm text-muted-foreground">
                  Отключить возможность пополнения баланса
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
