import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Activity, Eye, EyeOff, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ConversionMetrics } from "@/components/dashboard/ConversionMetrics";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { HourlyActivity } from "@/components/dashboard/HourlyActivity";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface WidgetVisibility {
  metrics: boolean;
  hourlyActivity: boolean;
  topProducts: boolean;
  recentActivity: boolean;
}

const DEFAULT_VISIBILITY: WidgetVisibility = {
  metrics: true,
  hourlyActivity: true,
  topProducts: true,
  recentActivity: true,
};

export default function Dashboard() {
  const [downloading, setDownloading] = useState(false);
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    return saved ? JSON.parse(saved) : DEFAULT_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgetVisibility));
  }, [widgetVisibility]);

  const toggleWidget = (widget: keyof WidgetVisibility) => {
    setWidgetVisibility(prev => ({
      ...prev,
      [widget]: !prev[widget]
    }));
  };

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

  const visibleWidgetsCount = Object.values(widgetVisibility).filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Панель управления"
        description="Аналитика и статистика проекта"
        gradient
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10">
                  <Settings className="mr-2 h-4 w-4" />
                  Виджеты ({visibleWidgetsCount}/4)
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Видимость виджетов</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={widgetVisibility.metrics}
                  onCheckedChange={() => toggleWidget('metrics')}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Метрики конверсии
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={widgetVisibility.hourlyActivity}
                  onCheckedChange={() => toggleWidget('hourlyActivity')}
                >
                  Активность по часам
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={widgetVisibility.topProducts}
                  onCheckedChange={() => toggleWidget('topProducts')}
                >
                  Топ товаров
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={widgetVisibility.recentActivity}
                  onCheckedChange={() => toggleWidget('recentActivity')}
                >
                  Последняя активность
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
          </div>
        }
      />

      <PageContainer gradient>
        {/* Conversion Metrics */}
        {widgetVisibility.metrics && <ConversionMetrics />}

        {/* Charts Row */}
        {(widgetVisibility.hourlyActivity || widgetVisibility.topProducts) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {widgetVisibility.hourlyActivity && <HourlyActivity />}
            {widgetVisibility.topProducts && <TopProducts />}
          </div>
        )}

        {/* Recent Activity */}
        {widgetVisibility.recentActivity && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Последняя активность
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivity />
            </CardContent>
          </Card>
        )}

        {visibleWidgetsCount === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <EyeOff className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-medium">Все виджеты скрыты</p>
              <p className="text-sm text-muted-foreground">
                Откройте меню "Виджеты" чтобы показать нужные блоки
              </p>
            </div>
          </Card>
        )}
      </PageContainer>
    </>
  );
}
