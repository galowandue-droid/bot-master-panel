import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, User, FileText } from "lucide-react";

export default function Search() {
  const [userQuery, setUserQuery] = useState("");
  const [purchaseQuery, setPurchaseQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Поиск</h1>
            <p className="text-sm text-muted-foreground">Поиск пользователей и покупок</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <User className="h-4 w-4" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-2">
              <FileText className="h-4 w-4" />
              Покупки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Введите ID, username или Telegram ID пользователя..."
                      className="pl-10"
                    />
                  </div>
                  <Button>
                    <SearchIcon className="h-4 w-4 mr-2" />
                    Найти
                  </Button>
                </div>

                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="rounded-full bg-muted p-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">Введите запрос для поиска</p>
                    <p className="text-xs text-muted-foreground">
                      Вы можете искать по ID, username или Telegram ID
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={purchaseQuery}
                      onChange={(e) => setPurchaseQuery(e.target.value)}
                      placeholder="Введите ID покупки..."
                      className="pl-10"
                    />
                  </div>
                  <Button>
                    <SearchIcon className="h-4 w-4 mr-2" />
                    Найти
                  </Button>
                </div>

                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="rounded-full bg-muted p-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">Введите ID покупки</p>
                    <p className="text-xs text-muted-foreground">
                      Поиск покупки по её уникальному идентификатору
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}