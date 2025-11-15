import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Position, usePositions } from "@/hooks/usePositions";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const positionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  price: z.number().positive("Price must be positive").min(0.01, "Minimum price is 0.01").max(999999, "Maximum price is 999,999"),
  category_id: z.string().uuid("Valid category must be selected"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  product_type: z.enum(["account", "promo", "link"]),
  is_visible: z.boolean(),
});

interface PositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: Position;
  categoryId?: string;
}

export function PositionDialog({ open, onOpenChange, position, categoryId }: PositionDialogProps) {
  const { categories } = useCategories();
  const { createPosition, updatePosition } = usePositions();
  const [name, setName] = useState(position?.name || "");
  const [price, setPrice] = useState(position?.price?.toString() || "");
  const [selectedCategory, setSelectedCategory] = useState(categoryId || position?.category_id || "");
  const [description, setDescription] = useState(position?.description || "");
  const [productType, setProductType] = useState<"account" | "promo" | "link">(
    position?.product_type || "account"
  );
  const [isVisible, setIsVisible] = useState(position?.is_visible ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = positionSchema.safeParse({
      name,
      price: parseFloat(price),
      category_id: selectedCategory,
      description: description || undefined,
      product_type: productType,
      is_visible: isVisible,
    });

    if (!validation.success) {
      toast({ 
        title: "Ошибка валидации", 
        description: validation.error.issues[0]?.message,
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);

    try {
      const data = validation.data;

      if (position) {
        await updatePosition.mutateAsync({ id: position.id, ...data });
      } else {
        await createPosition.mutateAsync({ ...data, position: 0 });
      }
      
      onOpenChange(false);
      setName("");
      setPrice("");
      setDescription("");
      setIsVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {position ? "Редактировать позицию" : "Создать позицию"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название позиции"
                maxLength={50}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Цена (₽)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Тип товара</Label>
              <Select value={productType} onValueChange={(v: any) => setProductType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Аккаунт</SelectItem>
                  <SelectItem value="promo">Промокод</SelectItem>
                  <SelectItem value="link">Ссылка</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание товара и инструкция"
              rows={6}
              maxLength={1200}
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
              {loading ? "Сохранение..." : position ? "Обновить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}