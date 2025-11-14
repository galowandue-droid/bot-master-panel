import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, UserCircle, Mail, Wallet } from "lucide-react";

export default function Users() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Пользователи</h1>
            <p className="text-sm text-muted-foreground">
              Поиск и управление пользователями
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Search */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по ID, логину или номеру чека..."
                className="pl-10"
              />
            </div>
            <Button>Найти</Button>
          </div>
        </Card>

        {/* Users List */}
        <Card>
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-5 gap-4 font-medium text-sm text-muted-foreground">
              <div>Пользователь</div>
              <div>ID / Username</div>
              <div>Баланс</div>
              <div>Покупки</div>
              <div className="text-right">Действия</div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">User {i}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-foreground">{123456789 + i}</p>
                    <p className="text-muted-foreground">@user{i}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">
                      ₽{(Math.random() * 5000).toFixed(0)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(Math.random() * 20)} покупок
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm">
                      Профиль
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
