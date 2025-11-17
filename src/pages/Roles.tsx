import { useState } from "react";
import { useProfiles } from "@/hooks/useProfiles";
import { useUserRoles, useAssignRole, useRemoveRole } from "@/hooks/useUserRoles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Shield, ShieldCheck, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Roles() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: profiles, isLoading } = useProfiles(searchQuery);
  const { data: allRoles } = useUserRoles();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  const getUserRoles = (userId: string) => {
    return allRoles?.filter(role => role.user_id === userId) || [];
  };

  const hasRole = (userId: string, role: "admin" | "user") => {
    return getUserRoles(userId).some(r => r.role === role);
  };

  const handleToggleAdmin = async (userId: string) => {
    if (hasRole(userId, "admin")) {
      await removeRole.mutateAsync({ userId, role: "admin" });
    } else {
      await assignRole.mutateAsync({ userId, role: "admin" });
    }
  };

  const admins = profiles?.filter(p => hasRole(p.id, "admin")) || [];
  const regularUsers = profiles?.filter(p => !hasRole(p.id, "admin")) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Управление ролями"
        description="Назначайте и удаляйте роли администраторов"
        icon={<Shield className="h-5 w-5 text-primary" />}
      />

      <PageContainer>
        <div className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Роль администратора дает полный доступ к системе. Назначайте ее только доверенным пользователям.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Поиск пользователей</CardTitle>
                  <CardDescription>
                    Всего: {profiles?.length || 0} | Администраторов: {admins.length}
                  </CardDescription>
                </div>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск по имени, username или telegram ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">
                Все ({profiles?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="admins">
                Админы ({admins.length})
              </TabsTrigger>
              <TabsTrigger value="users">
                Пользователи ({regularUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Telegram ID</TableHead>
                          <TableHead>Имя</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Роль</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles?.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell className="font-mono text-sm">
                              {profile.telegram_id || "—"}
                            </TableCell>
                            <TableCell>{profile.first_name || "—"}</TableCell>
                            <TableCell>
                              {profile.username ? `@${profile.username}` : "—"}
                            </TableCell>
                            <TableCell>
                              {hasRole(profile.id, "admin") ? (
                                <Badge variant="default" className="gap-1 whitespace-nowrap">
                                  <ShieldCheck className="h-3 w-3" />
                                  Администратор
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="whitespace-nowrap">Пользователь</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant={hasRole(profile.id, "admin") ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleToggleAdmin(profile.id)}
                                disabled={assignRole.isPending || removeRole.isPending}
                                className="gap-2 whitespace-nowrap"
                              >
                                {hasRole(profile.id, "admin") ? (
                                  <>
                                    <UserMinus className="h-4 w-4" />
                                    Снять
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4" />
                                    Назначить
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admins">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Telegram ID</TableHead>
                          <TableHead>Имя</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell className="font-mono text-sm">
                              {profile.telegram_id || "—"}
                            </TableCell>
                            <TableCell>{profile.first_name || "—"}</TableCell>
                            <TableCell>
                              {profile.username ? `@${profile.username}` : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleToggleAdmin(profile.id)}
                                disabled={removeRole.isPending}
                                className="gap-2 whitespace-nowrap"
                              >
                                <UserMinus className="h-4 w-4" />
                                Снять права
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Telegram ID</TableHead>
                          <TableHead>Имя</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regularUsers.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell className="font-mono text-sm">
                              {profile.telegram_id || "—"}
                            </TableCell>
                            <TableCell>{profile.first_name || "—"}</TableCell>
                            <TableCell>
                              {profile.username ? `@${profile.username}` : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleToggleAdmin(profile.id)}
                                disabled={assignRole.isPending}
                                className="gap-2 whitespace-nowrap"
                              >
                                <UserPlus className="h-4 w-4" />
                                Назначить админом
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </>
  );
}
