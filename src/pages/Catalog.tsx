import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Package, FolderOpen, Pencil, Trash2, Copy, GripVertical, List, GitBranch, LayoutGrid, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCategories } from "@/hooks/useCategories";
import { usePositions } from "@/hooks/usePositions";
import { useItems } from "@/hooks/useItems";
import { CategoryDialog } from "@/components/catalog/CategoryDialog";
import { TreeCategoryView } from "@/components/catalog/TreeCategoryView";
import { PositionDialog } from "@/components/catalog/PositionDialog";
import { ItemDialog } from "@/components/catalog/ItemDialog";
import { PurchaseDialog } from "@/components/catalog/PurchaseDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "@/hooks/useCategories";
import type { Position } from "@/hooks/usePositions";
import { toast } from "@/hooks/use-toast";
import { EditableField } from "@/components/catalog/EditableField";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeaderSearch } from "@/components/layout/PageHeaderSearch";

interface SortableCategoryItemProps {
  category: Category;
  positionCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableCategoryItem({ category, positionCount, isSelected, onSelect, onEdit, onDelete, onDuplicate }: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div ref={setNodeRef} style={style} className="group relative">
          <Button
            variant={isSelected ? "default" : "ghost"}
            className="w-full justify-start gap-2 pr-20"
            onClick={onSelect}
          >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <FolderOpen className="h-4 w-4" />
            <span className="truncate">{category.name}</span>
            <Badge variant="secondary" className="ml-auto">{positionCount}</Badge>
          </Button>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Редактировать</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Удалить</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Редактировать
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Дублировать
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface SortablePositionCardProps {
  position: Position;
  categoryName: string;
  itemCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdate: (id: string, updates: Partial<Position>) => Promise<void>;
  onPurchase: () => void;
}

function SortablePositionCard({ position, categoryName, itemCount, onEdit, onDelete, onDuplicate, onUpdate, onPurchase }: SortablePositionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: position.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card ref={setNodeRef} style={style} className="group hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-1 xs:gap-2">
              <div className="space-y-0.5 xs:space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1 xs:gap-2">
                  <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0">
                    <GripVertical className="h-3 w-3 xs:h-4 xs:w-4 text-muted-foreground" />
                  </div>
                  <EditableField
                    value={position.name}
                    onSave={async (newName) => {
                      await onUpdate(position.id, { name: newName });
                    }}
                    className="font-semibold text-xs xs:text-sm md:text-base"
                  />
                </div>
                <Badge variant="secondary" className="text-[9px] xs:text-[10px] md:text-xs h-3.5 xs:h-4 md:h-5 px-1 xs:px-1.5">{categoryName}</Badge>
              </div>
              <div className="flex gap-0.5 xs:gap-1 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 xs:h-6 xs:w-6 md:h-8 md:w-8" onClick={onEdit}>
                      <Pencil className="h-2.5 w-2.5 xs:h-3 xs:w-3 md:h-4 md:w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Редактировать</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 xs:h-6 xs:w-6 md:h-8 md:w-8" onClick={onDelete}>
                      <Trash2 className="h-2.5 w-2.5 xs:h-3 xs:w-3 md:h-4 md:w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Удалить</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {position.description && <p className="text-[10px] xs:text-xs md:text-sm text-muted-foreground line-clamp-2 mb-1.5 xs:mb-2 md:mb-3">{position.description}</p>}
            <div className="flex items-center justify-between mb-1.5 xs:mb-2 md:mb-3">
              <div className="space-y-0.5">
                <EditableField
                  value={position.price.toString()}
                  onSave={async (newPrice) => {
                    const price = parseFloat(newPrice);
                    if (!isNaN(price) && price >= 0) {
                      await onUpdate(position.id, { price });
                    }
                  }}
                  type="number"
                  className="text-base xs:text-lg md:text-xl font-bold text-primary"
                />
                <p className="text-[9px] xs:text-[10px] md:text-xs text-muted-foreground">В наличии: {itemCount}</p>
              </div>
              <Badge variant={position.is_visible ? "default" : "secondary"} className="text-[9px] xs:text-[10px] md:text-xs h-3.5 xs:h-4 md:h-5 px-1 xs:px-1.5">{position.is_visible ? "Видим" : "Скрыт"}</Badge>
            </div>
            <Button 
              className="w-full text-xs xs:text-sm h-8 xs:h-9 md:h-10" 
              variant="default"
              onClick={onPurchase}
              disabled={itemCount === 0}
            >
              {itemCount > 0 ? "Купить" : "Нет в наличии"}
            </Button>
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Редактировать
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Дублировать
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function Catalog() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [selectedPosition, setSelectedPosition] = useState<Position | undefined>();
  const [selectedPositionForItems, setSelectedPositionForItems] = useState<string | undefined>();
  const [selectedPositionForPurchase, setSelectedPositionForPurchase] = useState<Position | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "position" | "item"; id: string } | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "tree">(() => {
    return (localStorage.getItem("catalogViewMode") as "list" | "tree") || "list";
  });
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem("catalogCompactMode") === "true";
  });
  const [parentIdForNewCategory, setParentIdForNewCategory] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("catalogViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("catalogCompactMode", compactMode.toString());
  }, [compactMode]);

  const { categories, isLoading: categoriesLoading, deleteCategory, updateCategory, createCategory } = useCategories();
  const { positions, isLoading: positionsLoading, deletePosition, updatePosition, createPosition } = usePositions();
  const { items, deleteItem } = useItems();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDuplicateCategory = async (category: Category) => {
    try {
      await createCategory.mutateAsync({
        name: `${category.name} (копия)`,
        description: category.description,
        parent_id: category.parent_id,
        is_visible: category.is_visible,
      });
      toast({ title: "Категория дублирована" });
    } catch (error) {
      toast({ title: "Ошибка при дублировании", variant: "destructive" });
    }
  };

  const handleDuplicatePosition = async (position: Position) => {
    try {
      await createPosition.mutateAsync({
        name: `${position.name} (копия)`,
        price: position.price,
        category_id: position.category_id,
        description: position.description,
        photo_url: position.photo_url,
        product_type: position.product_type,
        is_visible: position.is_visible,
      });
      toast({ title: "Позиция дублирована" });
    } catch (error) {
      toast({ title: "Ошибка при дублировании", variant: "destructive" });
    }
  };

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    
    try {
      await Promise.all(
        newCategories.map((cat, index) =>
          updateCategory.mutateAsync({ id: cat.id, position: index })
        )
      );
      toast({ title: "Порядок категорий обновлен" });
    } catch (error) {
      toast({ title: "Ошибка при обновлении порядка", variant: "destructive" });
    }
  };

  const handlePositionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !filteredPositions) return;

    const oldIndex = filteredPositions.findIndex((pos) => pos.id === active.id);
    const newIndex = filteredPositions.findIndex((pos) => pos.id === over.id);

    const newPositions = arrayMove(filteredPositions, oldIndex, newIndex);
    
    try {
      await Promise.all(
        newPositions.map((pos, index) =>
          updatePosition.mutateAsync({ id: pos.id, position: index })
        )
      );
      toast({ title: "Порядок товаров обновлен" });
    } catch (error) {
      toast({ title: "Ошибка при обновлении порядка", variant: "destructive" });
    }
  };

  return (
    <TooltipProvider>
      <>
      <PageHeader
        title="Каталог"
        description="Управление категориями и товарами"
        icon={<Package className="h-5 w-5 text-primary" />}
        gradient
        actions={
          <div className="flex items-center gap-2">
            {isMobile && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
              </Sheet>
            )}
            <PageHeaderSearch 
              placeholder="Поиск товаров..." 
              value={search} 
              onChange={setSearch} 
            />
          </div>
        }
        />

        <div className="flex h-[calc(100vh-5rem)]">
          {/* Mobile sidebar */}
          {isMobile && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="p-3 border-b space-y-2">
                  <Button 
                    onClick={() => { 
                      setSelectedCategory(undefined); 
                      setParentIdForNewCategory(null);
                      setCategoryDialogOpen(true);
                      setSidebarOpen(false);
                    }} 
                    size="sm" 
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-2" />Новая категория
                  </Button>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground px-1">Режим отображения</p>
                    <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "list" | "tree")} className="grid grid-cols-2 gap-2">
                      <ToggleGroupItem value="list" className="flex-col gap-1 h-auto py-2 text-xs">
                        <List className="h-4 w-4" />
                        <span>Список</span>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="tree" className="flex-col gap-1 h-auto py-2 text-xs">
                        <GitBranch className="h-4 w-4" />
                        <span>Дерево</span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="p-2 space-y-1">
                    <Button 
                      variant={!selectedCategoryId ? "default" : "ghost"} 
                      className="w-full justify-start gap-2" 
                      onClick={() => { setSelectedCategoryId(null); setSidebarOpen(false); }}
                    >
                      <Package className="h-4 w-4" />Все товары
                    </Button>
                    
                    {categoriesLoading ? (
                      <div className="space-y-2">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                      </div>
                    ) : categories && categories.length > 0 ? (
                      viewMode === "tree" ? (
                        <TreeCategoryView
                          categories={categories}
                          selectedCategoryId={selectedCategoryId}
                          positionCounts={
                            categories.reduce((acc, cat) => {
                              acc[cat.id] = positions?.filter(p => p.category_id === cat.id).length || 0;
                              return acc;
                            }, {} as Record<string, number>)
                          }
                          onSelectCategory={(id) => { setSelectedCategoryId(id); setSidebarOpen(false); }}
                          onEditCategory={(cat) => { setSelectedCategory(cat); setCategoryDialogOpen(true); }}
                          onDeleteCategory={(cat) => { setDeleteTarget({ type: "category", id: cat.id }); setDeleteDialogOpen(true); }}
                          onAddChild={(parentId) => { setParentIdForNewCategory(parentId); setSelectedCategory(undefined); setCategoryDialogOpen(true); }}
                          onUpdateCategory={(id, updates) => { updateCategory.mutate({ id, ...updates }); }}
                        />
                      ) : (
                        categories.map(cat => (
                          <Button
                            key={cat.id}
                            variant={selectedCategoryId === cat.id ? "default" : "ghost"}
                            className="w-full justify-start gap-2"
                            onClick={() => { setSelectedCategoryId(cat.id); setSidebarOpen(false); }}
                          >
                            <FolderOpen className="h-4 w-4" />
                            <span className="truncate">{cat.name}</span>
                            <Badge variant="secondary" className="ml-auto">{positions?.filter(p => p.category_id === cat.id).length || 0}</Badge>
                          </Button>
                        ))
                      )
                    ) : null}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}

          {/* Desktop sidebar */}
          <div className="w-64 border-r bg-muted/10 hidden md:block">
            <div className="p-2 xs:p-3 md:p-4 border-b space-y-1 xs:space-y-2">
              <Button 
                onClick={() => { 
                  setSelectedCategory(undefined); 
                  setParentIdForNewCategory(null);
                  setCategoryDialogOpen(true); 
                }} 
                size="sm" 
                className="w-full gap-1 xs:gap-2 text-xs xs:text-sm h-7 xs:h-8 md:h-9"
              >
                <Plus className="h-3 w-3 xs:h-4 xs:w-4" />Новая категория
              </Button>
              
              <div className="space-y-1 xs:space-y-2">
                <p className="text-[10px] xs:text-xs font-medium text-muted-foreground px-1">Режим отображения</p>
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "list" | "tree")} className="grid grid-cols-2 gap-1 xs:gap-2">
                  <ToggleGroupItem value="list" className="flex-col gap-0.5 xs:gap-1 h-auto py-1 xs:py-2 text-[10px] xs:text-xs">
                    <List className="h-3 w-3 xs:h-4 xs:w-4" />
                    <span>Плоский список</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="tree" className="flex-col gap-0.5 xs:gap-1 h-auto py-1 xs:py-2 text-[10px] xs:text-xs">
                    <GitBranch className="h-3 w-3 xs:h-4 xs:w-4" />
                    <span>Дерево категорий</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-13rem)]">
              <div className="p-2 space-y-1">
                <Button 
                  variant={!selectedCategoryId ? "default" : "ghost"} 
                  className="w-full justify-start gap-2" 
                  onClick={() => setSelectedCategoryId(null)}
                >
                  <Package className="h-4 w-4" />
                  Все товары
                  <Badge variant="secondary" className="ml-auto">{positions?.length || 0}</Badge>
                </Button>
                
                {categoriesLoading ? (
                  <div className="space-y-2 p-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : categories && categories.length > 0 ? (
                  viewMode === "tree" ? (
                    <TreeCategoryView
                      categories={categories}
                      selectedCategoryId={selectedCategoryId}
                      positionCounts={
                        categories.reduce((acc, cat) => {
                          acc[cat.id] = positions?.filter(p => p.category_id === cat.id).length || 0;
                          return acc;
                        }, {} as Record<string, number>)
                      }
                      onSelectCategory={setSelectedCategoryId}
                      onEditCategory={(cat) => { 
                        setSelectedCategory(cat); 
                        setParentIdForNewCategory(null);
                        setCategoryDialogOpen(true); 
                      }}
                      onDeleteCategory={(cat) => { 
                        setDeleteTarget({ type: "category", id: cat.id }); 
                        setDeleteDialogOpen(true); 
                      }}
                      onAddChild={(parentId) => {
                        setSelectedCategory(undefined);
                        setParentIdForNewCategory(parentId);
                        setCategoryDialogOpen(true);
                      }}
                      onUpdateCategory={(id, updates) => {
                        updateCategory.mutate({ id, ...updates });
                      }}
                      editMode={true}
                    />
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                      <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {categories.map(cat => (
                          <SortableCategoryItem
                            key={cat.id}
                            category={cat}
                            positionCount={positions?.filter(p => p.category_id === cat.id).length || 0}
                            isSelected={selectedCategoryId === cat.id}
                            onSelect={() => setSelectedCategoryId(cat.id)}
                            onEdit={() => { 
                              setSelectedCategory(cat); 
                              setParentIdForNewCategory(null);
                              setCategoryDialogOpen(true); 
                            }}
                            onDelete={() => { 
                              setDeleteTarget({ type: "category", id: cat.id }); 
                              setDeleteDialogOpen(true); 
                            }}
                            onDuplicate={() => handleDuplicateCategory(cat)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )
                ) : null}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 p-2 xs:p-3 md:p-6 overflow-auto bg-background">
            <div className="space-y-2 xs:space-y-3 md:space-y-4 max-w-6xl mx-auto">
              <div className="flex items-center gap-2 xs:gap-3 md:gap-4 flex-wrap">
                <ToggleGroup type="single" value={compactMode ? "compact" : "cards"} onValueChange={(v) => v && setCompactMode(v === "compact")} className="text-xs xs:text-sm">
                  <ToggleGroupItem value="cards" className="gap-1 xs:gap-2 h-7 xs:h-8 md:h-9 px-2 xs:px-3">
                    <LayoutGrid className="h-3 w-3 xs:h-4 xs:w-4" />
                    Карточки
                  </ToggleGroupItem>
                  <ToggleGroupItem value="compact" className="gap-1 xs:gap-2 h-7 xs:h-8 md:h-9 px-2 xs:px-3">
                    <List className="h-3 w-3 xs:h-4 xs:w-4" />
                    Компактно
                  </ToggleGroupItem>
                </ToggleGroup>
                <Button onClick={() => { setSelectedPosition(undefined); setPositionDialogOpen(true); }} className="gap-1 xs:gap-2 h-7 xs:h-8 md:h-9 text-xs xs:text-sm px-2 xs:px-3 md:px-4"><Plus className="h-3 w-3 xs:h-4 xs:w-4" />Добавить товар</Button>
              </div>

              {positionsLoading ? (
                <div className="grid gap-2 xs:gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div>
              ) : filteredPositions?.length === 0 ? (
                <EmptyState icon={Package} title="Нет товаров" description={selectedCategoryId ? "В этой категории пока нет товаров" : "Добавьте первый товар"} action={{ label: "Добавить товар", onClick: () => setPositionDialogOpen(true) }} />
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePositionDragEnd}>
                  <SortableContext items={filteredPositions?.map(p => p.id) || []} strategy={verticalListSortingStrategy}>
                    <div className={compactMode ? "space-y-1 xs:space-y-2" : "grid gap-2 xs:gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3"}>
                      {filteredPositions?.map(pos => (
                        <SortablePositionCard
                          key={pos.id}
                          position={pos}
                          categoryName={categories?.find(c => c.id === pos.category_id)?.name || "—"}
                          itemCount={items?.filter(i => i.position_id === pos.id && !i.is_sold).length || 0}
                          onEdit={() => { setSelectedPosition(pos); setPositionDialogOpen(true); }}
                          onDelete={() => { setDeleteTarget({ type: "position", id: pos.id }); setDeleteDialogOpen(true); }}
                          onDuplicate={() => handleDuplicatePosition(pos)}
                          onUpdate={async (id, updates) => {
                            await updatePosition.mutateAsync({ id, ...updates });
                          }}
                          onPurchase={() => {
                            setSelectedPositionForPurchase(pos);
                            setPurchaseDialogOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        <CategoryDialog 
          category={selectedCategory} 
          parentId={parentIdForNewCategory}
          open={categoryDialogOpen} 
          onOpenChange={(open) => { 
            setCategoryDialogOpen(open); 
            if (!open) {
              setSelectedCategory(undefined);
              setParentIdForNewCategory(null);
            }
          }} 
        />
        <PositionDialog position={selectedPosition} open={positionDialogOpen} onOpenChange={(open) => { setPositionDialogOpen(open); if (!open) setSelectedPosition(undefined); }} />
        <ItemDialog positionId={selectedPositionForItems} open={itemDialogOpen} onOpenChange={(open) => { setItemDialogOpen(open); if (!open) setSelectedPositionForItems(undefined); }} />
        <PurchaseDialog 
          position={selectedPositionForPurchase || null}
          availableCount={selectedPositionForPurchase ? (items?.filter(i => i.position_id === selectedPositionForPurchase.id && !i.is_sold).length || 0) : 0}
          open={purchaseDialogOpen} 
          onOpenChange={(open) => { 
            setPurchaseDialogOpen(open); 
            if (!open) setSelectedPositionForPurchase(undefined); 
          }}
          onPurchaseComplete={() => {
            // Refresh items after purchase
            window.location.reload();
          }}
        />
        <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleConfirmDelete} title={`Удалить ${deleteTarget?.type === "category" ? "категорию" : deleteTarget?.type === "position" ? "позицию" : "товар"}?`} description="Это действие нельзя отменить." />
      </> 
    </TooltipProvider>
  );
}
