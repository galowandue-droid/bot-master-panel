import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBroadcastVariants, CreateVariantInput } from "@/hooks/useBroadcastVariants";

interface ABTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broadcastId: string;
  existingVariants: string[];
}

export const ABTestDialog = ({ open, onOpenChange, broadcastId, existingVariants }: ABTestDialogProps) => {
  const { createVariant } = useBroadcastVariants(broadcastId);

  const form = useForm<CreateVariantInput>({
    defaultValues: {
      broadcast_id: broadcastId,
      variant_name: "",
      message: "",
    },
  });

  const onSubmit = async (data: CreateVariantInput) => {
    await createVariant.mutateAsync(data);
    form.reset();
    onOpenChange(false);
  };

  // Suggest next variant name
  const suggestVariantName = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < letters.length; i++) {
      if (!existingVariants.includes(letters[i])) {
        return letters[i];
      }
    }
    return String(existingVariants.length + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Добавить вариант A/B теста</DialogTitle>
          <DialogDescription>
            Создайте альтернативный вариант сообщения для тестирования эффективности
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="variant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название варианта</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder="A, B, C..." />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.setValue('variant_name', suggestVariantName())}
                    >
                      Предложить
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Текст сообщения</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Введите альтернативный текст сообщения"
                      rows={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="media_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL медиа (опционально)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/image.jpg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={createVariant.isPending}>
                Создать вариант
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
