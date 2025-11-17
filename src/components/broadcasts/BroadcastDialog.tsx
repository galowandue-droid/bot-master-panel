import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Send, Calendar, Image, FileVideo, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyboardBuilder } from "./KeyboardBuilder";
import { MessagePreview } from "./MessagePreview";
import { SegmentSelector } from "./SegmentSelector";
import { useBroadcasts, type BroadcastButton } from "@/hooks/useBroadcasts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSegment: () => void;
}

export function BroadcastDialog({ open, onOpenChange, onCreateSegment }: BroadcastDialogProps) {
  const { createBroadcast } = useBroadcasts();
  
  const [message, setMessage] = useState("");
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'document' | undefined>();
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [buttons, setButtons] = useState<Omit<BroadcastButton, 'id'>[]>([]);
  const [segmentId, setSegmentId] = useState<string>();
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const handleReset = () => {
    setMessage("");
    setMediaType(undefined);
    setMediaUrl("");
    setMediaCaption("");
    setButtons([]);
    setSegmentId(undefined);
    setScheduleDate("");
    setScheduleTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !mediaUrl) {
      toast({ title: "Добавьте текст или медиа", variant: "destructive" });
      return;
    }

    let scheduleAt: string | undefined;
    if (scheduleDate && scheduleTime) {
      scheduleAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    try {
      await createBroadcast.mutateAsync({
        message: message.trim(),
        media_url: mediaUrl || undefined,
        media_type: mediaType,
        media_caption: mediaCaption || undefined,
        segment_id: segmentId,
        schedule_at: scheduleAt,
        buttons: buttons.length > 0 ? buttons : undefined,
      });

      onOpenChange(false);
      handleReset();
    } catch (error) {
      // Error handling is in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) handleReset();
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Новая рассылка
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="message" className="w-full">
              <TabsList className="w-full overflow-x-auto no-scrollbar md:grid md:grid-cols-4">
                <TabsTrigger value="message">Текст</TabsTrigger>
                <TabsTrigger value="media">Медиа</TabsTrigger>
                <TabsTrigger value="buttons">Кнопки</TabsTrigger>
                <TabsTrigger value="settings">Настройки</TabsTrigger>
              </TabsList>

              <TabsContent value="message" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Текст сообщения</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Введите текст рассылки..."
                    rows={10}
                    maxLength={4096}
                  />
                  <p className="text-sm text-muted-foreground">
                    {message.length} / 4096 символов
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Тип медиа</Label>
                  <Select value={mediaType} onValueChange={(v: any) => setMediaType(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип медиа" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Фото
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <FileVideo className="h-4 w-4" />
                          Видео
                        </div>
                      </SelectItem>
                      <SelectItem value="document">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Документ
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mediaType && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="mediaUrl">URL медиа</Label>
                      <Input
                        id="mediaUrl"
                        type="url"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Вставьте прямую ссылку на файл
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mediaCaption">Подпись к медиа</Label>
                      <Textarea
                        id="mediaCaption"
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        placeholder="Опциональная подпись..."
                        rows={3}
                        maxLength={1024}
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="buttons" className="mt-4">
                <KeyboardBuilder buttons={buttons} onChange={setButtons} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Целевая аудитория</Label>
                  <SegmentSelector
                    value={segmentId}
                    onChange={setSegmentId}
                    onCreateSegment={onCreateSegment}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm xs:text-base">
                    <Calendar className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    Отложенная отправка
                  </Label>
                  <div className="flex flex-col xs:grid xs:grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="text-xs xs:text-sm"
                    />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="text-xs xs:text-sm"
                    />
                  </div>
                  {scheduleDate && scheduleTime && (
                    <Alert className="text-xs xs:text-sm">
                      <AlertDescription>
                        Рассылка будет отправлена: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('ru-RU')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={createBroadcast.isPending}>
                {createBroadcast.isPending ? "Создание..." : scheduleDate ? "Запланировать" : "Отправить"}
              </Button>
            </DialogFooter>
          </form>

          {/* Right side - Preview */}
          <div className="space-y-2">
            <Label>Предпросмотр</Label>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <MessagePreview
                  message={message}
                  mediaUrl={mediaUrl}
                  mediaType={mediaType}
                  mediaCaption={mediaCaption}
                  buttons={buttons}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}