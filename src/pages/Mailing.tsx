import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { useBroadcasts } from "@/hooks/useBroadcasts";
import { BroadcastDialog } from "@/components/broadcasts/BroadcastDialog";
import { SegmentDialog } from "@/components/broadcasts/SegmentDialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const Mailing = () => {
  const { broadcasts, isLoading, deleteBroadcast } = useBroadcasts();
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);

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
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSegmentDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Сегменты
            </Button>
            <Button onClick={() => setBroadcastDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Создать рассылку
            </Button>
          </div>
        }
      />

      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>История рассылок</CardTitle>
            <CardDescription>
              Все отправленные и запланированные рассылки
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : broadcasts && broadcasts.length === 0 ? (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Рассылок пока нет. Создайте первую рассылку!
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сообщение</TableHead>
                    <TableHead>Сегмент</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Отправлено</TableHead>
                    <TableHead>Ошибок</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcasts?.map((broadcast) => (
                    <TableRow key={broadcast.id}>
                      <TableCell className="max-w-md truncate">
                        {broadcast.message}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {broadcast.segment?.name || "Все пользователи"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(broadcast.status || "pending")}
                      </TableCell>
                      <TableCell>{broadcast.sent_count || 0}</TableCell>
                      <TableCell>{broadcast.failed_count || 0}</TableCell>
                      <TableCell>
                        {broadcast.created_at && format(new Date(broadcast.created_at), "dd.MM.yyyy HH:mm", { locale: ru })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBroadcast.mutate(broadcast.id)}
                          disabled={deleteBroadcast.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>

      <BroadcastDialog 
        open={broadcastDialogOpen} 
        onOpenChange={setBroadcastDialogOpen}
        onCreateSegment={() => {
          setBroadcastDialogOpen(false);
          setSegmentDialogOpen(true);
        }}
      />
      
      <SegmentDialog
        open={segmentDialogOpen}
        onOpenChange={setSegmentDialogOpen}
      />
    </>
  );
};

export default Mailing;
