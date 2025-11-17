import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSegments } from "@/hooks/useSegments";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface SegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SegmentDialog({ open, onOpenChange }: SegmentDialogProps) {
  const { createSegment, calculateSegmentSize } = useSegments();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conditions, setConditions] = useState({
    hasBalance: false,
    minBalance: 0,
    hasPurchases: false,
    minPurchases: 0,
    isBlocked: false,
  });
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  const handleCalculateSize = async () => {
    setCalculating(true);
    try {
      const size = await calculateSegmentSize.mutateAsync(conditions);
      setEstimatedSize(size);
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSegment.mutateAsync({
      name,
      description,
      conditions,
    });
    onOpenChange(false);
    setName("");
    setDescription("");
    setConditions({
      hasBalance: false,
      minBalance: 0,
      hasPurchases: false,
      minPurchases: 0,
      isBlocked: false,
    });
    setEstimatedSize(null);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Создать сегмент пользователей">
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название сегмента</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Активные пользователи"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание сегмента"
              rows={2}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Условия фильтрации</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Есть баланс</Label>
                  <p className="text-sm text-muted-foreground">
                    Пользователи с балансом больше 0
                  </p>
                </div>
                <Switch
                  checked={conditions.hasBalance}
                  onCheckedChange={(checked) =>
                    setConditions({ ...conditions, hasBalance: checked })
                  }
                />
              </div>

              {conditions.hasBalance && (
                <div className="space-y-2 ml-4">
                  <Label>Минимальный баланс (₽)</Label>
                  <Input
                    type="number"
                    value={conditions.minBalance}
                    onChange={(e) =>
                      setConditions({ ...conditions, minBalance: Number(e.target.value) })
                    }
                    min={0}
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Совершали покупки</Label>
                  <p className="text-sm text-muted-foreground">
                    Пользователи с покупками
                  </p>
                </div>
                <Switch
                  checked={conditions.hasPurchases}
                  onCheckedChange={(checked) =>
                    setConditions({ ...conditions, hasPurchases: checked })
                  }
                />
              </div>

              {conditions.hasPurchases && (
                <div className="space-y-2 ml-4">
                  <Label>Минимальное количество покупок</Label>
                  <Input
                    type="number"
                    value={conditions.minPurchases}
                    onChange={(e) =>
                      setConditions({ ...conditions, minPurchases: Number(e.target.value) })
                    }
                    min={0}
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Только заблокированные</Label>
                  <p className="text-sm text-muted-foreground">
                    Только заблокированные пользователи
                  </p>
                </div>
                <Switch
                  checked={conditions.isBlocked}
                  onCheckedChange={(checked) =>
                    setConditions({ ...conditions, isBlocked: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Предполагаемый размер</p>
              <p className="text-xs text-muted-foreground">
                Количество пользователей в сегменте
              </p>
            </div>
            <div className="flex items-center gap-2">
              {estimatedSize !== null && (
                <Badge variant="secondary" className="text-lg">
                  {estimatedSize}
                </Badge>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleCalculateSize}
                disabled={calculating}
              >
                {calculating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Рассчитать"
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={createSegment.isPending}>
              {createSegment.isPending ? "Создание..." : "Создать сегмент"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
  );
}
