import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, User, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export default function Search() {
  const [userQuery, setUserQuery] = useState("");
  const [purchaseQuery, setPurchaseQuery] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [purchaseResults, setPurchaseResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchingPurchases, setSearchingPurchases] = useState(false);

  const handleUserSearch = async () => {
    if (!userQuery.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите запрос для поиска",
        variant: "destructive",
      });
      return;
    }

    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`id.eq.${userQuery},username.ilike.%${userQuery}%,telegram_id.eq.${userQuery}`)
        .limit(50);

      if (error) throw error;

      setUserResults(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "Результаты не найдены",
          description: "Попробуйте изменить запрос",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка поиска",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearchingUsers(false);
    }
  };

  const handlePurchaseSearch = async () => {
    if (!purchaseQuery.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ID покупки",
        variant: "destructive",
      });
      return;
    }

    setSearchingPurchases(true);
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          positions(name),
          profiles(first_name, username, telegram_id)
        `)
        .eq("id", purchaseQuery);

      if (error) throw error;

      setPurchaseResults(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "Результаты не найдены",
          description: "Проверьте правильность ID покупки",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка поиска",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearchingPurchases(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Поиск"
        description="Поиск пользователей и покупок"
        icon={<SearchIcon className="h-5 w-5 text-primary" />}
        gradient
      />

      <PageContainer>
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
                <div className="flex gap-2 xs:gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
                    <Input
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUserSearch()}
                      placeholder="ID, username или Telegram ID..."
                      className="pl-7 xs:pl-10 text-xs xs:text-sm"
                      disabled={searchingUsers}
                    />
                  </div>
                  <Button 
                    onClick={handleUserSearch} 
                    disabled={searchingUsers}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {searchingUsers ? (
                      <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 xs:mr-2 animate-spin" />
                    ) : (
                      <SearchIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 xs:mr-2" />
                    )}
                    <span className="hidden xs:inline">Найти</span>
                  </Button>
                </div>

                {userResults.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Telegram ID</TableHead>
                          <TableHead>Имя</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Баланс</TableHead>
                          <TableHead>Статус</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userResults.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono">{user.telegram_id || "—"}</TableCell>
                            <TableCell>{user.first_name || "—"}</TableCell>
                            <TableCell>@{user.username || "—"}</TableCell>
                            <TableCell>{user.balance || 0} ₽</TableCell>
                            <TableCell>
                              {user.is_blocked ? (
                                <Badge variant="destructive">Заблокирован</Badge>
                              ) : (
                                <Badge variant="default">Активен</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex gap-2 xs:gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
                    <Input
                      value={purchaseQuery}
                      onChange={(e) => setPurchaseQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePurchaseSearch()}
                      placeholder="ID покупки..."
                      className="pl-7 xs:pl-10 text-xs xs:text-sm"
                      disabled={searchingPurchases}
                    />
                  </div>
                  <Button 
                    onClick={handlePurchaseSearch} 
                    disabled={searchingPurchases}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {searchingPurchases ? (
                      <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 xs:mr-2 animate-spin" />
                    ) : (
                      <SearchIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 xs:mr-2" />
                    )}
                    <span className="hidden xs:inline">Найти</span>
                  </Button>
                </div>

                {purchaseResults.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID покупки</TableHead>
                          <TableHead>Пользователь</TableHead>
                          <TableHead>Товар</TableHead>
                          <TableHead>Количество</TableHead>
                          <TableHead>Сумма</TableHead>
                          <TableHead>Дата</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseResults.map((purchase: any) => (
                          <TableRow key={purchase.id}>
                            <TableCell className="font-mono text-xs">{purchase.id}</TableCell>
                            <TableCell>
                              {purchase.profiles?.first_name || "—"}
                              <br />
                              <span className="text-xs text-muted-foreground">
                                @{purchase.profiles?.username || "—"}
                              </span>
                            </TableCell>
                            <TableCell>{purchase.positions?.name || "—"}</TableCell>
                            <TableCell>{purchase.quantity}</TableCell>
                            <TableCell>{purchase.total_price} ₽</TableCell>
                            <TableCell>
                              {new Date(purchase.created_at).toLocaleString("ru-RU")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="rounded-full bg-muted p-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-foreground">Введите ID покупки</p>
                      <p className="text-xs text-muted-foreground">
                        Вы можете найти покупку по её уникальному идентификатору
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
