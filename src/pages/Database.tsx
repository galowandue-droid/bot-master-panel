import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Database as DatabaseIcon, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Database() {
  const [downloading, setDownloading] = useState(false);

  const tables = [
    { name: "profiles", records: 8945 },
    { name: "categories", records: 12 },
    { name: "positions", records: 45 },
    { name: "items", records: 342 },
    { name: "purchases", records: 6334 },
  ];

  const handleDownloadTable = async (tableName: string) => {
    try {
      setDownloading(true);
      const { data, error } = await supabase.functions.invoke('export-database', {
        body: { table: tableName },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Не удалось экспортировать таблицу: ${error.message}`);
      }

      if (!data) {
        throw new Error('Нет данных для экспорта');
      }

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
      console.error('Error downloading table:', error);
      toast({
        title: "Ошибка экспорта",
        description: error.message || 'Не удалось экспортировать таблицу',
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const backups = [
    { name: "bot-backup-2024-01-15.db", date: "Сегодня в 00:00" },
    { name: "bot-backup-2024-01-14.db", date: "Вчера в 00:00" },
    { name: "bot-backup-2024-01-13.db", date: "2 дня назад в 00:00" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">База данных</h1>
            <p className="text-sm text-muted-foreground">Управление данными и резервные копии</p>
          </div>
        </div>
      </header>

      <div className="p-6 h-[calc(100vh-4rem)] overflow-auto">
        <div className="space-y-6 max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <DatabaseIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Информация о БД</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Размер БД</p>
                  <p className="text-2xl font-bold text-foreground">24.3 МБ</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                  <p className="text-2xl font-bold text-foreground">15,678</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Последнее обновление</p>
                  <p className="text-2xl font-bold text-foreground">Сегодня</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Таблицы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <DatabaseIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{table.name}</p>
                        <p className="text-sm text-muted-foreground">{table.records} записей</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTable(table.name)}
                      disabled={downloading}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Экспорт
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Резервные копии</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div
                    key={backup.name}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-secondary/50 p-2">
                        <Calendar className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{backup.name}</p>
                        <p className="text-sm text-muted-foreground">{backup.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Авто</Badge>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Скачать
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
