import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Lock, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingEmail(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      // Log the email change
      await supabase.from("logs").insert({
        level: "info",
        message: `Email изменен администратором`,
        metadata: { new_email: newEmail, action: "change_email" },
      });

      toast({
        title: "Email обновлен",
        description: "Проверьте новый email для подтверждения изменений",
      });
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Log the password change
      await supabase.from("logs").insert({
        level: "info",
        message: `Пароль изменен администратором`,
        metadata: { action: "change_password" },
      });

      toast({
        title: "Пароль обновлен",
        description: "Ваш пароль успешно изменен",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Профиль</h1>
            <p className="text-muted-foreground mt-1">
              Управление вашим аккаунтом администратора
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="shrink-0"
        >
          Назад
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Информация об аккаунте
          </CardTitle>
          <CardDescription>Текущие данные вашего профиля</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">ID пользователя</Label>
            <p className="text-sm font-mono text-muted-foreground">{user.id}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Роль</Label>
            <p className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Администратор
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Изменить Email
          </CardTitle>
          <CardDescription>
            Обновите адрес электронной почты для входа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">Новый Email</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="новый@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isUpdatingEmail}
              />
            </div>
            <Button type="submit" disabled={isUpdatingEmail}>
              {isUpdatingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Обновить Email
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Изменить пароль
          </CardTitle>
          <CardDescription>
            Обновите пароль для входа в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Минимум 6 символов"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isUpdatingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Повторите новый пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isUpdatingPassword}
              />
            </div>
            <Button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Обновить пароль
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          variant="destructive"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/auth";
          }}
          className="w-full max-w-xs"
        >
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}
