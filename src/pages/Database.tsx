import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Database as DatabaseIcon, FileArchive } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useTableStats } from "@/hooks/useTableStats";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

export default function Database() {
  const [downloading, setDownloading] = useState(false);
  const { data: tableStats, isLoading } = useTableStats();

  const handleDownloadTable = async (tableName: string) => {
    try {
      setDownloading(true);
      const { data, error } = await supabase.functions.invoke('export-database', {
        body: { table: tableName },
      });

      if (error) throw new Error(`Не удалось экспортировать таблицу: ${error.message}`);
      if (!data) throw new Error('Нет данных для экспорта');

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Таблица экспортирована",
        description: `Таблица ${tableName} успешно загружена`,
      });
    } catch (error: any) {
      toast({
        title: "Ошибка экспорта",
        description: error.message || 'Не удалось экспортировать таблицу',
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="База данных"
        icon={<DatabaseIcon className="h-5 w-5 text-primary" />}
        breadcrumbs={[{ label: "База данных" }]}
        gradient
      />

      <PageContainer className="h-[calc(100vh-4rem)] overflow-auto">
        <div className="space-y-6 max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Информация о БД</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                  {isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <p className="text-2xl font-bold">{tableStats?.totalRecords.toLocaleString()}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Таблиц</p>
                  {isLoading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold">{tableStats?.tables.length}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Экспорт таблиц</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {tableStats?.tables.map((table) => (
                    <div key={table.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{table.name}</p>
                        <p className="text-sm text-muted-foreground">{table.records.toLocaleString()} записей</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadTable(table.name)} disabled={downloading}>
                        <Download className="h-4 w-4 mr-2" />
                        Скачать
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Автоматические резервные копии</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={FileArchive}
                title="Резервные копии недоступны"
                description="Используйте экспорт таблиц выше для создания резервных копий"
              />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
