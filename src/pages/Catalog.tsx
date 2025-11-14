import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, Package, FolderOpen, Box } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Catalog() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Каталог</h1>
            <p className="text-sm text-muted-foreground">
              Управление категориями, позициями и товарами
            </p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Категории
            </TabsTrigger>
            <TabsTrigger value="positions" className="gap-2">
              <Package className="h-4 w-4" />
              Позиции
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <Box className="h-4 w-4" />
              Товары
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Категории</h2>
                <p className="text-sm text-muted-foreground">
                  Всего: 8 категорий
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Создать категорию
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <FolderOpen className="h-6 w-6 text-primary" />
                    </div>
                    <Button variant="ghost" size="sm">
                      Изменить
                    </Button>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Категория {i}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>5 позиций</span>
                    <span>23 товара</span>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Позиции</h2>
                <p className="text-sm text-muted-foreground">
                  Всего: 45 позиций
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Создать позицию
              </Button>
            </div>

            <Card>
              <div className="p-4 border-b border-border">
                <div className="grid grid-cols-5 gap-4 font-medium text-sm text-muted-foreground">
                  <div>Название</div>
                  <div>Категория</div>
                  <div>Цена</div>
                  <div>Товаров</div>
                  <div className="text-right">Действия</div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-medium text-foreground">
                        Позиция {i}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Категория {i}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        ₽{(Math.random() * 1000 + 100).toFixed(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.floor(Math.random() * 50 + 10)} шт
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm">
                          Изменить
                        </Button>
                        <Button variant="outline" size="sm">
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Товары</h2>
                <p className="text-sm text-muted-foreground">
                  Всего: 156 товаров
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить товары
              </Button>
            </div>

            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Выберите категорию и позицию для просмотра товаров
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
