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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base xs:text-lg">Список каналов</CardTitle>
                <CardDescription className="text-xs xs:text-sm">
                  Пользователи должны подписаться на эти каналы перед покупкой
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()} size="sm" className="text-xs xs:text-sm">
                <Plus className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
                Добавить
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
                    <TableHead>Название канала</TableHead>
                    <TableHead>ID канала</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((channel) => (
                  <TableRow key={channel.id} className="text-xs xs:text-sm">
                    <TableCell className="font-medium text-xs xs:text-sm">{channel.channel_name}</TableCell>
                    <TableCell className="font-mono text-[10px] xs:text-xs">{channel.channel_id}</TableCell>
                    <TableCell className="text-xs xs:text-sm">
                      {channel.channel_username ? (
                        <a
                          href={`https://t.me/${channel.channel_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline break-all"
                        >
                          @{channel.channel_username}
                          <ExternalLink className="h-2.5 w-2.5 xs:h-3 xs:w-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={channel.is_active ? "default" : "secondary"} className="text-[10px] xs:text-xs">
                        {channel.is_active ? "Активен" : "Неактивен"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 xs:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(channel)}
                          className="h-7 w-7 xs:h-8 xs:w-8"
                        >
                          <Pencil className="h-3 w-3 xs:h-4 xs:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedChannel(channel);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-7 w-7 xs:h-8 xs:w-8"
                        >
                          <Trash2 className="h-3 w-3 xs:h-4 xs:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Нет обязательных каналов</p>
                <p className="text-sm">Добавьте первый канал для обязательной подписки</p>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedChannel ? "Редактировать канал" : "Добавить канал"}
            </DialogTitle>
            <DialogDescription>
              Укажите информацию о канале для обязательной подписки
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-id">ID канала *</Label>
              <Input
                id="channel-id"
                placeholder="-1001234567890"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                ID канала можно получить через бота @userinfobot
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-name">Название канала *</Label>
              <Input
                id="channel-name"
                placeholder="Мой канал"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-username">Username канала</Label>
              <Input
                id="channel-username"
                placeholder="mychannel"
                value={channelUsername}
                onChange={(e) => setChannelUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Без символа @, будет использоваться для создания ссылки
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-active">Активный канал</Label>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={!channelId || !channelName}>
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
        description="Это действие нельзя отменить."
      />
    </>
  );
}
