import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Category, useCategories } from "@/hooks/useCategories";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const { createCategory, updateCategory } = useCategories();
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [isVisible, setIsVisible] = useState(category?.is_visible ?? true);
  const [loading, setLoading] = useState(false);

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
        });
      } else {
        await createCategory.mutateAsync({
          name,
          description,
          is_visible: isVisible,
          position: 0,
        });
      }
      onOpenChange(false);
      setName("");
      setDescription("");
      setIsVisible(true);
    } finally {
      setLoading(false);
    }
  };

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