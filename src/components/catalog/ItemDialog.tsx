import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useItems } from "@/hooks/useItems";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positionId: string;
}

export function ItemDialog({ open, onOpenChange, positionId }: ItemDialogProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { createItemsBulk } = useItems();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      // Split by new lines and create multiple items
      const items = content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => ({
          content: line.trim(),
          position_id: positionId,
        }));

      await createItemsBulk.mutateAsync(items);
      setContent("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>Массовое добавление товаров</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Содержимое (каждая строка = 1 товар)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="login:password&#10;login2:password2&#10;login3:password3"
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Введите данные товаров, каждый товар с новой строки
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || loading}>
            {loading ? "Добавление..." : "Добавить товары"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}