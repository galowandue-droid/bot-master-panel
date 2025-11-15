import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ConversionMetrics } from "@/components/dashboard/ConversionMetrics";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { HourlyActivity } from "@/components/dashboard/HourlyActivity";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadDB = async () => {
    setDownloading(true);
    try {
      const tables = ['profiles', 'categories', 'positions', 'items', 'purchases', 'deposits', 'statistics'];
      
      for (const table of tables) {
        const { data, error } = await supabase.functions.invoke('export-database', {
          body: { table }
        });

        if (error) throw error;

        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${table}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Успешно",
        description: "База данных экспортирована",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Панель управления"
        description="Аналитика и статистика проекта"
        gradient
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary/20 hover:bg-primary/10"
            onClick={handleDownloadDB}
            disabled={downloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading ? "Загрузка..." : "Экспорт БД"}
          </Button>
        }
      />

      <PageContainer gradient>
        {/* Conversion Metrics */}
        <ConversionMetrics />

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <HourlyActivity />
          <TopProducts />
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Последняя активность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
