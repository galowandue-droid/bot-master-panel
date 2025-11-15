import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "block" | "unblock" | "delete" | "balance";
  selectedCount: number;
  onConfirm: (amount?: number) => void;
  isPending: boolean;
}

export function BulkActionsDialog({
  open,
  onOpenChange,
  action,
  selectedCount,
  onConfirm,
  isPending,
}: BulkActionsDialogProps) {
  const [balanceAmount, setBalanceAmount] = useState("");

  const getTitle = () => {
    switch (action) {
      case "block":
        return "Заблокировать пользователей";
      case "unblock":
        return "Разблокировать пользователей";
      case "delete":
        return "Удалить пользователей";
      case "balance":
        return "Изменить баланс";
    }
  };

  const getDescription = () => {
    switch (action) {
      case "block":
        return `Вы уверены, что хотите заблокировать ${selectedCount} пользователей? Они не смогут использовать бота.`;
      case "unblock":
        return `Вы уверены, что хотите разблокировать ${selectedCount} пользователей?`;
      case "delete":
        return `Вы уверены, что хотите удалить ${selectedCount} пользователей? Это действие необратимо.`;
      case "balance":
        return `Введите сумму для изменения баланса ${selectedCount} пользователей. Положительное число — пополнение, отрицательное — списание.`;
    }
  };

  const handleConfirm = () => {
    if (action === "balance") {
      const amount = parseFloat(balanceAmount);
      if (isNaN(amount) || amount === 0) return;
      onConfirm(amount);
      setBalanceAmount("");
    } else {
      onConfirm();
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
        </AlertDialogHeader>

        {action === "balance" && (
          <div className="space-y-2 py-4">
            <Label htmlFor="balance-amount">Сумма изменения</Label>
            <Input
              id="balance-amount"
              type="number"
              placeholder="Например, 100 или -50"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || (action === "balance" && !balanceAmount)}
            className={action === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isPending ? "Обработка..." : "Подтвердить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
