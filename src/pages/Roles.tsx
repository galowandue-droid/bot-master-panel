import { useState } from "react";
import { useProfiles } from "@/hooks/useProfiles";
import { useUserRoles, useAssignRole, useRemoveRole } from "@/hooks/useUserRoles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Shield, ShieldOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление ролями</h1>
          <p className="text-muted-foreground mt-1">
            Назначайте и удаляйте роли администраторов
          </p>
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Роль администратора дает полный доступ к системе. Назначайте ее только доверенным пользователям.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Пользователи и роли</CardTitle>
          <CardDescription>
            Всего пользователей: {profiles?.length || 0}
          </CardDescription>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Telegram ID</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Роли</TableHead>
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
                  <TableCell>@{profile.username || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {hasRole(profile.id, "admin") ? (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Администратор
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Пользователь</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={hasRole(profile.id, "admin") ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleAdmin(profile.id)}
                      disabled={assignRole.isPending || removeRole.isPending}
                    >
                      {hasRole(profile.id, "admin") ? (
                        <>
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Отозвать admin
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Назначить admin
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
