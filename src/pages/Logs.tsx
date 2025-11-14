import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Download, Trash2 } from "lucide-react";
import { useLogs } from "@/hooks/useLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Logs() {
  const { logs, isLoading, refetch, clearLogs } = useLogs();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const { data, error } = await supabase.functions.invoke('export-logs', {
        method: 'POST',
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Логи экспортированы",
        description: "Файл успешно загружен",
      });
    } catch (error: any) {
      console.error('Error downloading logs:', error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "destructive";
      case "WARNING":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Логи</h1>
            <p className="text-sm text-muted-foreground">Журнал событий системы</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Обновить
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="h-4 w-4" />
              {downloading ? "Загрузка..." : "Скачать"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Очистить
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Logs */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : !logs || logs.length === 0 ? (
                <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                  <p className="text-sm">Логи отсутствуют</p>
                </div>
              ) : (
                <div className="divide-y">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-muted/50 transition-colors font-mono text-sm">
                      <span className="text-muted-foreground">
                        [{format(new Date(log.created_at), "HH:mm:ss")}]
                      </span>{" "}
                      <Badge variant={getLevelColor(log.level)} className="mx-2">
                        {log.level}
                      </Badge>
                      <span className="text-foreground">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="pt-6 space-y-2">
            <p className="text-xs text-muted-foreground">
              📝 Логи автоматически записываются при каждом важном событии
            </p>
            <p className="text-xs text-muted-foreground">
              💾 Размер файла логов: {logs ? Math.ceil(JSON.stringify(logs).length / 1024) : 0} КБ
            </p>
            <p className="text-xs text-muted-foreground">
              🗑️ Очистка логов необратима, рекомендуется скачать перед удалением
            </p>
            <p className="text-xs text-muted-foreground">
              ⬇️ Скачайте логи для детального анализа в текстовом редакторе
            </p>
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          clearLogs.mutate();
          setDeleteDialogOpen(false);
        }}
        title="Очистить все логи?"
        description="Это действие удалит все записи из журнала. Перед очисткой рекомендуется скачать логи."
      />
    </div>
  );
}