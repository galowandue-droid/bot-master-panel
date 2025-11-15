import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RefreshCw, Download, Trash2, Search, AlertCircle, AlertTriangle, Info, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLogs } from "@/hooks/useLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Logs() {
  const { logs, isLoading, refetch, clearLogs } = useLogs();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [levelFilter, setLevelFilter] = useState<"ALL" | "INFO" | "WARNING" | "ERROR">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = useMemo(() => {
    return logs?.filter(log => {
      const matchesLevel = levelFilter === "ALL" || log.level === levelFilter;
      const matchesSearch = !searchQuery || log.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [logs, levelFilter, searchQuery]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const { data, error } = await supabase.functions.invoke('export-logs');
      if (error) throw error;
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Логи экспортированы" });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const getLevelColor = (level: string) => level === "ERROR" ? "destructive" : level === "WARNING" ? "outline" : "secondary";
  const getLevelIcon = (level: string) => level === "ERROR" ? <AlertCircle className="h-4 w-4" /> : level === "WARNING" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />;
  const logCounts = useMemo(() => {
    const counts = { ALL: logs?.length || 0, INFO: 0, WARNING: 0, ERROR: 0 };
    logs?.forEach(log => { counts[log.level as keyof typeof counts]++; });
    return counts;
  }, [logs]);

  return (
    <>
      <PageHeader
        title="Логи"
        icon={<FileText className="h-5 w-5 text-primary" />}
        breadcrumbs={[{ label: "Логи" }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <PageContainer>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Очистить</TooltipContent></Tooltip>
            </div>
          </div>
        </header>

        <div className="p-6 h-[calc(100vh-4rem)] overflow-hidden">
          <div className="space-y-4 max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Поиск по логам..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                {(["ALL", "INFO", "WARNING", "ERROR"] as const).map(level => (
                  <Button key={level} variant={levelFilter === level ? "default" : "outline"} size="sm" onClick={() => setLevelFilter(level)} className="gap-2">
                    {level !== "ALL" && getLevelIcon(level)}{level}<Badge variant="secondary">{logCounts[level]}</Badge>
                  </Button>
                ))}
              </div>
            </div>

            <Card className="flex-1 overflow-hidden">
              <CardContent className="p-0 h-full">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                  ) : filteredLogs?.length === 0 ? (
                    <EmptyState icon={Search} title="Логи не найдены" description={searchQuery || levelFilter !== "ALL" ? "Попробуйте изменить фильтры" : "В системе пока нет логов"} />
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredLogs?.map(log => (
                        <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">{getLevelIcon(log.level)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getLevelColor(log.level)}>{log.level}</Badge>
                                <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss")}</span>
                              </div>
                              <p className="text-sm mb-2">{log.message}</p>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Metadata</summary>
                                  <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={() => { clearLogs.mutate(); setDeleteDialogOpen(false); }} title="Очистить все логи?" description="Это действие нельзя отменить." />
      </div>
    </TooltipProvider>
  );
}
