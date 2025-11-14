import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, Package, FolderOpen, Box, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/useCategories";
import { usePositions } from "@/hooks/usePositions";
import { CategoryDialog } from "@/components/catalog/CategoryDialog";
import { PositionDialog } from "@/components/catalog/PositionDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/hooks/useCategories";
import type { Position } from "@/hooks/usePositions";

export default function Catalog() {
  const [activeTab, setActiveTab] = useState("categories");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [selectedPosition, setSelectedPosition] = useState<Position | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "position"; id: string } | null>(null);

  const { categories, isLoading: categoriesLoading, deleteCategory } = useCategories();
  const { positions, isLoading: positionsLoading, deletePosition } = usePositions();

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    setDeleteTarget({ type: "category", id });
    setDeleteDialogOpen(true);
  };

  const handleEditPosition = (position: Position) => {
    setSelectedPosition(position);
    setPositionDialogOpen(true);
  };

  const handleDeletePosition = (id: string) => {
    setDeleteTarget({ type: "position", id });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "category") {
      await deleteCategory.mutateAsync(deleteTarget.id);
    } else {
      await deletePosition.mutateAsync(deleteTarget.id);
    }

    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                  Всего: {categories?.length || 0} категорий
                </p>
              </div>
              <Button 
                className="gap-2"
                onClick={() => {
                  setSelectedCategory(undefined);
                  setCategoryDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Создать категорию
              </Button>
            </div>

            {categoriesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories?.map((category) => (
                  <Card key={category.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <FolderOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{category.is_visible ? "Видна" : "Скрыта"}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Позиции</h2>
                <p className="text-sm text-muted-foreground">
                  Всего: {positions?.length || 0} позиций
                </p>
              </div>
              <Button 
                className="gap-2"
                onClick={() => {
                  setSelectedPosition(undefined);
                  setPositionDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Создать позицию
              </Button>
            </div>

            {positionsLoading ? (
              <Card className="p-6">
                <Skeleton className="h-64 w-full" />
              </Card>
            ) : (
              <Card>
                <div className="p-4 border-b border-border">
                  <div className="grid grid-cols-6 gap-4 font-medium text-sm text-muted-foreground">
                    <div>Название</div>
                    <div>Категория</div>
                    <div>Тип</div>
                    <div>Цена</div>
                    <div>Видимость</div>
                    <div className="text-right">Действия</div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {positions?.map((position) => {
                    const category = categories?.find((c) => c.id === position.category_id);
                    return (
                      <div key={position.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          <div className="font-medium text-foreground">
                            {position.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {category?.name || "—"}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {position.product_type}
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            ₽{position.price}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {position.is_visible ? "Видна" : "Скрыта"}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditPosition(position)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeletePosition(position.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Товары</h2>
                <p className="text-sm text-muted-foreground">
                  Управление конкретными товарами и ключами
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить товары
              </Button>
            </div>

            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Выберите категорию и позицию для управления товарами
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory}
      />
      
      <PositionDialog
        open={positionDialogOpen}
        onOpenChange={setPositionDialogOpen}
        position={selectedPosition}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title={`Удалить ${deleteTarget?.type === "category" ? "категорию" : "позицию"}?`}
        description={`Это действие удалит ${deleteTarget?.type === "category" ? "категорию и все связанные позиции" : "позицию и все связанные товары"}. Данные будут удалены безвозвратно.`}
      />
    </div>
  );
}
