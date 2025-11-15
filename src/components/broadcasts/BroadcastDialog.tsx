import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface BroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BroadcastDialog({ open, onOpenChange }: BroadcastDialogProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || message.length > 4096) {
      toast({ 
        title: "Ошибка", 
        description: "Введите корректное сообщение (не более 4096 символов)",
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("broadcasts").insert({
        message: message.trim(),
        created_by: user?.id,
        status: "pending",
      });

      if (error) throw error;

      toast({ title: "Рассылка создана и будет отправлена" });
      onOpenChange(false);
      setMessage("");
    } catch (error) {
      toast({ 
        title: "Ошибка при создании рассылки", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Новая рассылка
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Сообщение</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите текст рассылки для всех пользователей..."
              rows={8}
              maxLength={4096}
              required
            />
            <p className="text-sm text-muted-foreground">
              {message.length} / 4096 символов
            </p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Предупреждение:</strong> Рассылка будет отправлена всем пользователям бота. 
              Убедитесь, что сообщение содержит важную информацию.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Отправка..." : "Отправить рассылку"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}