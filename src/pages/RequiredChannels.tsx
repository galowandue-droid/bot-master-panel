import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink, Radio } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { useRequiredChannels, type RequiredChannel } from "@/hooks/useRequiredChannels";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

export default function RequiredChannels() {
  const { channels, isLoading, createChannel, updateChannel, deleteChannel } = useRequiredChannels();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<RequiredChannel | undefined>();
  const [channelId, setChannelId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelUsername, setChannelUsername] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleOpenDialog = (channel?: RequiredChannel) => {
    if (channel) {
      setSelectedChannel(channel);
      setChannelId(channel.channel_id);
      setChannelName(channel.channel_name);
      setChannelUsername(channel.channel_username || "");
      setIsActive(channel.is_active);
    } else {
      setSelectedChannel(undefined);
      setChannelId("");
      setChannelName("");
      setChannelUsername("");
      setIsActive(true);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (selectedChannel) {
      await updateChannel.mutateAsync({
        id: selectedChannel.id,
        channel_id: channelId,
        channel_name: channelName,
        channel_username: channelUsername || undefined,
        is_active: isActive,
      });
    } else {
      await createChannel.mutateAsync({
        channel_id: channelId,
        channel_name: channelName,
        channel_username: channelUsername || undefined,
        is_active: isActive,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (selectedChannel) {
      await deleteChannel.mutateAsync(selectedChannel.id);
      setDeleteDialogOpen(false);
      setSelectedChannel(undefined);
    }
  };

  return (
    <>
      <PageHeader
        title="Обязательные каналы"
        description="Управление каналами для обязательной подписки"
        icon={<Radio className="h-5 w-5 text-primary" />}
      />

      <PageContainer>
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Список каналов</CardTitle>
              <CardDescription>
                Пользователи должны подписаться на эти каналы перед покупкой
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить канал
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : channels && channels.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>ID канала</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="font-medium">{channel.channel_name}</TableCell>
                    <TableCell className="font-mono text-sm">{channel.channel_id}</TableCell>
                    <TableCell>
                      {channel.channel_username ? (
                        <a
                          href={`https://t.me/${channel.channel_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          @{channel.channel_username}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={channel.is_active ? "default" : "secondary"}>
                        {channel.is_active ? "Активен" : "Неактивен"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(channel)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedChannel(channel);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Нет обязательных каналов</p>
              <p className="text-sm mt-2">Добавьте канал для обязательной подписки</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedChannel ? "Редактировать канал" : "Добавить канал"}
            </DialogTitle>
            <DialogDescription>
              Укажите данные Telegram канала для обязательной подписки
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channelId">ID канала *</Label>
              <Input
                id="channelId"
                placeholder="-1001234567890"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Получите ID канала через @userinfobot
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelName">Название канала *</Label>
              <Input
                id="channelName"
                placeholder="Мой канал"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelUsername">Username канала</Label>
              <Input
                id="channelUsername"
                placeholder="mychannel"
                value={channelUsername}
                onChange={(e) => setChannelUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Без @, используется для создания ссылки
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Активен</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={!channelId || !channelName || createChannel.isPending || updateChannel.isPending}
            >
              {selectedChannel ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Удалить канал?"
        description={`Вы уверены, что хотите удалить канал "${selectedChannel?.channel_name}"?`}
      />
    </div>
  );
}
