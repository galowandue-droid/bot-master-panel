import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Package, FolderOpen, Pencil, Trash2, Search } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { usePositions } from "@/hooks/usePositions";
import { useItems } from "@/hooks/useItems";
import { CategoryDialog } from "@/components/catalog/CategoryDialog";
import { PositionDialog } from "@/components/catalog/PositionDialog";
import { ItemDialog } from "@/components/catalog/ItemDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Category } from "@/hooks/useCategories";
import type { Position } from "@/hooks/usePositions";

export default function Catalog() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [selectedPosition, setSelectedPosition] = useState<Position | undefined>();
  const [selectedPositionForItems, setSelectedPositionForItems] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "position" | "item"; id: string } | null>(null);
  const [search, setSearch] = useState("");

  const { categories, isLoading: categoriesLoading, deleteCategory } = useCategories();
  const { positions, isLoading: positionsLoading, deletePosition } = usePositions();
  const { items, deleteItem } = useItems();

  const filteredPositions = positions?.filter(pos => {
    const matchesCategory = !selectedCategoryId || pos.category_id === selectedCategoryId;
    const matchesSearch = !search || pos.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "category") await deleteCategory.mutateAsync(deleteTarget.id);
    else if (deleteTarget.type === "position") await deletePosition.mutateAsync(deleteTarget.id);
    else await deleteItem.mutateAsync(deleteTarget.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger />
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-bold">Каталог</h1>
              <Breadcrumbs items={[{ label: "Каталог" }]} />
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-4rem)]">
          <div className="w-64 border-r bg-muted/10">
            <div className="p-4 border-b">
              <Button onClick={() => { setSelectedCategory(undefined); setCategoryDialogOpen(true); }} size="sm" className="w-full gap-2">
                <Plus className="h-4 w-4" />Новая категория
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-9rem)]">
              <div className="p-2 space-y-1">
                <Button variant={!selectedCategoryId ? "default" : "ghost"} className="w-full justify-start gap-2" onClick={() => setSelectedCategoryId(null)}>
                  <Package className="h-4 w-4" />Все товары<Badge variant="secondary" className="ml-auto">{positions?.length || 0}</Badge>
                </Button>
                {categoriesLoading ? <div className="space-y-2 p-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div> : 
                categories?.map(cat => (
                  <div key={cat.id} className="group relative">
                    <Button variant={selectedCategoryId === cat.id ? "default" : "ghost"} className="w-full justify-start gap-2 pr-20" onClick={() => setSelectedCategoryId(cat.id)}>
                      <FolderOpen className="h-4 w-4" /><span className="truncate">{cat.name}</span><Badge variant="secondary" className="ml-auto">{positions?.filter(p => p.category_id === cat.id).length || 0}</Badge>
                    </Button>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1">
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); setCategoryDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Редактировать</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "category", id: cat.id }); setDeleteDialogOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Удалить</TooltipContent></Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div className="space-y-4 max-w-6xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Поиск товаров..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={() => { setSelectedPosition(undefined); setPositionDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Добавить товар</Button>
              </div>

              {positionsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div>
              ) : filteredPositions?.length === 0 ? (
                <EmptyState icon={Package} title="Нет товаров" description={selectedCategoryId ? "В этой категории пока нет товаров" : "Добавьте первый товар"} action={{ label: "Добавить товар", onClick: () => setPositionDialogOpen(true) }} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPositions?.map(pos => (
                    <Card key={pos.id} className="group hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg line-clamp-1">{pos.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">{categories?.find(c => c.id === pos.category_id)?.name || "—"}</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedPosition(pos); setPositionDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Редактировать</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDeleteTarget({ type: "position", id: pos.id }); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Удалить</TooltipContent></Tooltip>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {pos.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{pos.description}</p>}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-primary">{Number(pos.price).toFixed(2)} ₽</p>
                            <p className="text-xs text-muted-foreground">В наличии: {items?.filter(i => i.position_id === pos.id && !i.is_sold).length || 0}</p>
                          </div>
                          <Badge variant={pos.is_visible ? "default" : "secondary"}>{pos.is_visible ? "Видим" : "Скрыт"}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <CategoryDialog category={selectedCategory} open={categoryDialogOpen} onOpenChange={(open) => { setCategoryDialogOpen(open); if (!open) setSelectedCategory(undefined); }} />
        <PositionDialog position={selectedPosition} open={positionDialogOpen} onOpenChange={(open) => { setPositionDialogOpen(open); if (!open) setSelectedPosition(undefined); }} />
        <ItemDialog positionId={selectedPositionForItems} open={itemDialogOpen} onOpenChange={(open) => { setItemDialogOpen(open); if (!open) setSelectedPositionForItems(undefined); }} />
        <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleConfirmDelete} title={`Удалить ${deleteTarget?.type === "category" ? "категорию" : deleteTarget?.type === "position" ? "позицию" : "товар"}?`} description="Это действие нельзя отменить." />
      </div>
    </TooltipProvider>
  );
}
