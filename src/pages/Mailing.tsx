import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Send, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Mailing() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);

      const { data, error } = await supabase.functions.invoke('send-broadcast', {
        body: { message: message.trim() },
      });

      if (error) throw error;

      toast({
        title: "Рассылка отправлена",
        description: `Сообщение отправлено ${data.sent_count} пользователям`,
      });

      setMessage("");
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Рассылка</h1>
            <p className="text-sm text-muted-foreground">Массовая отправка сообщений пользователям</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left: Create Broadcast */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Создать рассылку</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите текст сообщения для рассылки..."
                className="min-h-[200px] resize-none"
                disabled={sending}
              />

              <Button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {sending ? "Отправка..." : "Отправить рассылку"}
              </Button>
            </CardContent>
          </Card>

          {/* Right: Stats and Info */}
          <div className="space-y-6">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Всего пользователей</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">8,945</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm text-foreground">Активных</span>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    7,234
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-foreground">Заблокировали</span>
                  </div>
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                    1,711
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Last Broadcast */}
            <Card>
              <CardHeader>
                <CardTitle>Последняя рассылка</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Отправлено</span>
                  <span className="font-medium text-foreground">7,234</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Не доставлено</span>
                  <span className="font-medium text-destructive">1,711</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Успешность</span>
                  <span className="font-medium text-success">80.9%</span>
                </div>
                <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Сегодня, 14:30
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Советы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  💡 Используйте переменные {"{username}"} и {"{balance}"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ⏰ Лучшее время для рассылки: 10:00-22:00
                </p>
                <p className="text-xs text-muted-foreground">
                  📝 Сообщения до 200 символов имеют лучший отклик
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}