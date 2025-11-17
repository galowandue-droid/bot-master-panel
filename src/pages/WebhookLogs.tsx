import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Webhook, Activity, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { useWebhookLogs } from "@/hooks/useWebhookLogs";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WebhookLogs() {
  const [webhookFilter, setWebhookFilter] = useState<string | undefined>();
  const { data: logs, isLoading } = useWebhookLogs({ webhookName: webhookFilter });

  const getStatusBadge = (status: number | null) => {
    if (!status) return <Badge variant="secondary">Pending</Badge>;
    if (status >= 200 && status < 300) return <Badge variant="default">Success</Badge>;
    if (status >= 400 && status < 500) return <Badge variant="destructive">Client Error</Badge>;
    if (status >= 500) return <Badge variant="destructive">Server Error</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const webhookStats = logs?.reduce((acc, log) => {
    const name = log.webhook_name;
    if (!acc[name]) {
      acc[name] = { total: 0, success: 0, failed: 0, avgTime: 0 };
    }
    acc[name].total++;
    if (log.response_status && log.response_status >= 200 && log.response_status < 300) {
      acc[name].success++;
    } else if (log.response_status) {
      acc[name].failed++;
    }
    if (log.processing_time_ms) {
      acc[name].avgTime = (acc[name].avgTime * (acc[name].total - 1) + log.processing_time_ms) / acc[name].total;
    }
    return acc;
  }, {} as Record<string, { total: number; success: number; failed: number; avgTime: number }>);

  return (
    <>
      <PageHeader
        title="Webhook Логи"
        description="Мониторинг webhook запросов"
        icon={<Webhook className="h-5 w-5 text-primary" />}
      />

      <PageContainer>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {webhookStats && Object.entries(webhookStats).map(([name, stats]) => (
            <Card key={name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Всего:</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Успешно:</span>
                    <span className="font-medium text-green-600">{stats.success}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ошибок:</span>
                    <span className="font-medium text-red-600">{stats.failed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Среднее время:</span>
                    <span className="font-medium">{Math.round(stats.avgTime)}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>История запросов</CardTitle>
            <CardDescription>
              Все webhook запросы с деталями
            </CardDescription>
            <div className="flex gap-2 mt-4">
              <Select value={webhookFilter} onValueChange={setWebhookFilter}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Фильтр по webhook" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook-wata">Wata</SelectItem>
                  <SelectItem value="webhook-heleket">Heleket</SelectItem>
                  <SelectItem value="webhook-telegram-stars">Telegram Stars</SelectItem>
                  <SelectItem value="webhook-cryptobot">CryptoBot</SelectItem>
                </SelectContent>
              </Select>

              {webhookFilter && (
                <Button variant="outline" onClick={() => setWebhookFilter(undefined)}>
                  Сбросить
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Webhook</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Время</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Ошибка</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Нет webhook логов
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), "dd MMM HH:mm:ss", { locale: ru })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.webhook_name}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(log.response_status)}</TableCell>
                          <TableCell>
                            {log.processing_time_ms ? `${log.processing_time_ms}ms` : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.ip_address || "—"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.error_message ? (
                              <span className="flex items-center gap-1 text-destructive">
                                <AlertCircle className="h-3 w-3" />
                                {log.error_message}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
