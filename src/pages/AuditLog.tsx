import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Filter, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuditLog } from "@/hooks/useAuditLog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AuditLog() {
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [resourceFilter, setResourceFilter] = useState<string | undefined>();
  const { data: logs, isLoading } = useAuditLog({ action: actionFilter, resourceType: resourceFilter });

  const getActionBadge = (action: string) => {
    const variants = {
      INSERT: { variant: "default" as const, label: "Создание" },
      UPDATE: { variant: "secondary" as const, label: "Изменение" },
      DELETE: { variant: "destructive" as const, label: "Удаление" },
    };
    const config = variants[action as keyof typeof variants] || { variant: "outline" as const, label: action };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <PageHeader
        title="Журнал действий"
        description="История всех изменений в системе"
        icon={<Shield className="h-5 w-5 text-primary" />}
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        }
      />

      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Аудит действий</CardTitle>
            <CardDescription>
              Все действия администраторов с фильтрами
            </CardDescription>
            <div className="flex flex-col md:flex-row gap-2 mt-4">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Тип действия" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSERT">Создание</SelectItem>
                  <SelectItem value="UPDATE">Изменение</SelectItem>
                  <SelectItem value="DELETE">Удаление</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Тип ресурса" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profiles">Пользователи</SelectItem>
                  <SelectItem value="broadcasts">Рассылки</SelectItem>
                  <SelectItem value="categories">Категории</SelectItem>
                  <SelectItem value="positions">Позиции</SelectItem>
                  <SelectItem value="user_roles">Роли</SelectItem>
                </SelectContent>
              </Select>

              {(actionFilter || resourceFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionFilter(undefined);
                    setResourceFilter(undefined);
                  }}
                >
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
                      <TableHead>Действие</TableHead>
                      <TableHead>Ресурс</TableHead>
                      <TableHead>ID ресурса</TableHead>
                      <TableHead>IP адрес</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Нет записей в журнале
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: ru })}
                          </TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.resource_type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.resource_id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.ip_address || "—"}
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
