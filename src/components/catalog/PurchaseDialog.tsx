import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Minus, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ChannelSubscriptionCheck } from "@/components/purchases/ChannelSubscriptionCheck";

interface Position {
  id: string;
  name: string;
  price: number;
  description?: string;
  photo_url?: string;
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Position | null;
  availableCount: number;
  onPurchaseComplete?: () => void;
}

export function PurchaseDialog({ 
  open, 
  onOpenChange, 
  position, 
  availableCount,
  onPurchaseComplete 
}: PurchaseDialogProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [canPurchase, setCanPurchase] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching balance:', error);
      return;
    }

    setBalance(Number(data.balance) || 0);
  };

  const handlePurchase = async () => {
    if (!position || !user) return;

    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-purchase', {
        body: {
          user_id: user.id,
          position_id: position.id,
          quantity,
        }
      });

      if (error) throw error;

      if (!data.can_purchase) {
        if (data.required_channels) {
          toast({
            title: "Требуется подписка",
            description: `Подпишитесь на ${data.required_channels.length} канал(ов)`,
            variant: "destructive",
          });
        } else if (data.error === 'Insufficient balance') {
          toast({
            title: "Недостаточно средств",
            description: `Требуется: ${data.required_balance}₽, доступно: ${data.current_balance}₽`,
            variant: "destructive",
          });
        } else if (data.error === 'Not enough items in stock') {
          toast({
            title: "Недостаточно товара",
            description: `Доступно только ${data.available_quantity} шт.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Ошибка покупки",
            description: data.error || "Не удалось совершить покупку",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Покупка успешна!",
        description: `Товары отправлены вам. Остаток: ${data.remaining_balance}₽`,
      });

      onOpenChange(false);
      if (onPurchaseComplete) {
        onPurchaseComplete();
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Ошибка покупки",
        description: error.message || "Не удалось совершить покупку",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!position) return null;

  const totalPrice = Number(position.price) * quantity;
  const hasEnoughBalance = balance >= totalPrice;
  const canBuy = canPurchase && hasEnoughBalance && quantity <= availableCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Покупка: {position.name}</DialogTitle>
          <DialogDescription>
            Цена: {position.price}₽ за шт. | Доступно: {availableCount} шт.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {user && (
            <ChannelSubscriptionCheck 
              userId={user.id}
              onSubscriptionVerified={setCanPurchase}
            />
          )}

          <div className="space-y-2">
            <Label>Количество</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                max={availableCount}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(availableCount, parseInt(e.target.value) || 1)))}
                className="text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(availableCount, quantity + 1))}
                disabled={quantity >= availableCount}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Цена за шт:</span>
              <span className="font-medium">{position.price}₽</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Количество:</span>
              <span className="font-medium">{quantity} шт.</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Итого:</span>
              <span>{totalPrice}₽</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Ваш баланс:</span>
              <span className={hasEnoughBalance ? "text-green-600" : "text-red-600"}>
                {balance}₽
              </span>
            </div>
          </div>

          {!hasEnoughBalance && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Недостаточно средств. Пополните баланс на {totalPrice - balance}₽
              </AlertDescription>
            </Alert>
          )}

          {quantity > availableCount && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Доступно только {availableCount} шт.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!canBuy || isPurchasing}
          >
            {isPurchasing ? "Покупка..." : `Купить за ${totalPrice}₽`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
