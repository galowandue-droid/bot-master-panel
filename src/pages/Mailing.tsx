import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, Calendar, Image as ImageIcon, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { useBroadcasts } from "@/hooks/useBroadcasts";
import { SegmentSelector } from "@/components/broadcasts/SegmentSelector";
import { KeyboardBuilder } from "@/components/broadcasts/KeyboardBuilder";
import { MessagePreview } from "@/components/broadcasts/MessagePreview";
import { SegmentDialog } from "@/components/broadcasts/SegmentDialog";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Mailing = () => {
  const { broadcasts, isLoading, createBroadcast, deleteBroadcast } = useBroadcasts();
  
  const [message, setMessage] = useState("");
  const [segmentId, setSegmentId] = useState<string | undefined>();
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'document' | undefined>();
  const [mediaCaption, setMediaCaption] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [buttons, setButtons] = useState<Array<{ text: string; url?: string; row: number; position: number }>>([]);
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);

  const handleSendBroadcast = async () => {
    if (!message.trim() && !mediaUrl) {
      toast({ title: "Заполните сообщение или добавьте медиа", variant: "destructive" });
      return;
    }

    try {
      await createBroadcast.mutateAsync({
        message: message.trim(),
        media_url: mediaUrl || undefined,
        media_type: mediaType,
        media_caption: mediaCaption || undefined,
        segment_id: segmentId,
        schedule_at: scheduleAt || undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
      });

      // Reset form
      setMessage("");
      setMediaUrl("");
      setMediaType(undefined);
      setMediaCaption("");
      setScheduleAt("");
      setButtons([]);
      setSegmentId(undefined);
    } catch (error) {
      console.error("Error creating broadcast:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Ожидает", variant: "secondary" as const },
      sending: { label: "Отправляется", variant: "default" as const },
      completed: { label: "Завершено", variant: "default" as const },
      failed: { label: "Ошибка", variant: "destructive" as const },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <PageHeader
        title="Рассылки"
        description="Управление рассылками и сегментами пользователей"
        icon={<Mail className="h-5 w-5 text-primary" />}
      />

      <PageContainer>
        <Tabs defaultValue="create" className="w-full">
        <TabsList>
          <TabsTrigger value="create">Создать рассылку</TabsTrigger>
          <TabsTrigger value="history">История рассылок</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Editor */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Сообщение</CardTitle>
                  <CardDescription>
                    Создайте текст рассылки и настройте параметры
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Текст сообщения</Label>
                    <Textarea
                      placeholder="Введите текст сообщения..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      maxLength={4000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/4000
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Получатели</Label>
                    <SegmentSelector
                      value={segmentId}
                      onChange={setSegmentId}
                      onCreateSegment={() => setSegmentDialogOpen(true)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Медиа-контент
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Тип медиа</Label>
                    <Select value={mediaType || "none"} onValueChange={(v) => setMediaType(v === "none" ? undefined : v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Без медиа" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без медиа</SelectItem>
                        <SelectItem value="photo">Фото</SelectItem>
                        <SelectItem value="video">Видео</SelectItem>
                        <SelectItem value="document">Документ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {mediaType && (
                    <>
                      <div className="space-y-2">
                        <Label>URL медиа</Label>
                        <Input
                          placeholder="https://..."
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Подпись к медиа</Label>
                        <Input
                          placeholder="Описание медиа..."
                          value={mediaCaption}
                          onChange={(e) => setMediaCaption(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Клавиатура</CardTitle>
                </CardHeader>
                <CardContent>
                  <KeyboardBuilder buttons={buttons} onChange={setButtons} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Отложенная отправка
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Дата и время отправки</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Оставьте пустым для немедленной отправки
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleSendBroadcast} 
                className="w-full gap-2"
                disabled={createBroadcast.isPending}
              >
                {scheduleAt ? (
                  <>
                    <Calendar className="h-4 w-4" />
                    Запланировать
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Отправить
                  </>
                )}
              </Button>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Превью сообщения</CardTitle>
                  <CardDescription>
                    Так будет выглядеть ваше сообщение в Telegram
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <MessagePreview
                    message={message}
                    mediaUrl={mediaUrl}
                    mediaType={mediaType}
                    mediaCaption={mediaCaption}
                    buttons={buttons}
                  />
                </CardContent>
              </Card>

              {segmentId && (
                <Alert>
                  <AlertDescription>
                    Рассылка будет отправлена выбранному сегменту пользователей
                  </AlertDescription>
                </Alert>
              )}

              {scheduleAt && (
                <Alert>
                  <AlertDescription>
                    Рассылка запланирована на {new Date(scheduleAt).toLocaleString('ru-RU')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>История рассылок</CardTitle>
              <CardDescription>
                Все отправленные и запланированные рассылки
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сообщение</TableHead>
                    <TableHead>Сегмент</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Отправлено</TableHead>
                    <TableHead>Ошибки</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Загрузка...
                      </TableCell>
                    </TableRow>
                  ) : broadcasts && broadcasts.length > 0 ? (
                    broadcasts.map((broadcast) => (
                      <TableRow key={broadcast.id}>
                        <TableCell className="max-w-xs truncate">
                          {broadcast.message}
                        </TableCell>
                        <TableCell>
                          {broadcast.segment?.name || "Все"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(broadcast.status)}
                        </TableCell>
                        <TableCell>{broadcast.sent_count}</TableCell>
                        <TableCell>{broadcast.failed_count}</TableCell>
                        <TableCell>
                          {new Date(broadcast.created_at).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBroadcast.mutate(broadcast.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Рассылок пока нет
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SegmentDialog open={segmentDialogOpen} onOpenChange={setSegmentDialogOpen} />
    </div>
  );
};

export default Mailing;
