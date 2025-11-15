import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category, useCategories } from "@/hooks/useCategories";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  parentId?: string | null;
}

export function CategoryDialog({ open, onOpenChange, category, parentId }: CategoryDialogProps) {
  const { categories, createCategory, updateCategory } = useCategories();
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [isVisible, setIsVisible] = useState(category?.is_visible ?? true);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(
    parentId || category?.parent_id || undefined
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name || "");
      setDescription(category?.description || "");
      setIsVisible(category?.is_visible ?? true);
      setSelectedParentId(parentId || category?.parent_id || undefined);
    }
  }, [open, category, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category) {
        await updateCategory.mutateAsync({
          id: category.id,
          name,
          description,
          is_visible: isVisible,
          parent_id: selectedParentId || null,
        });
      } else {
        await createCategory.mutateAsync({
          name,
          description,
          is_visible: isVisible,
          parent_id: selectedParentId || null,
          position: 0,
        });
      }
      onOpenChange(false);
      setName("");
      setDescription("");
      setIsVisible(true);
      setSelectedParentId(undefined);
    } finally {
      setLoading(false);
    }
  };

  // Filter out current category and its descendants to prevent circular references
  const getAvailableParents = () => {
    if (!category) return categories || [];
    
    const descendants = new Set<string>();
    const findDescendants = (parentId: string) => {
      descendants.add(parentId);
      categories?.forEach(cat => {
        if (cat.parent_id === parentId) {
          findDescendants(cat.id);
        }
      });
    };
    
    findDescendants(category.id);
    return categories?.filter(cat => !descendants.has(cat.id)) || [];
  };

  const availableParents = getAvailableParents();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Редактировать категорию" : "Создать категорию"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название категории"
              maxLength={50}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parent">Родительская категория</Label>
            <Select
              value={selectedParentId || "none"}
              onValueChange={(value) => setSelectedParentId(value === "none" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите родительскую категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без родителя (корневая)</SelectItem>
                {availableParents.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание категории (опционально)"
              rows={4}
              maxLength={500}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="visible">Видимость</Label>
            <Switch
              id="visible"
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : category ? "Обновить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
