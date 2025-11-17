import { useState, useMemo } from "react";
import { useProfiles, useBulkToggleBlockUser, useBulkUpdateBalance, useDeleteProfiles } from "@/hooks/useProfiles";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, MoreVertical, Eye, Ban, ShieldCheck, Trash2, X, Wallet } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { UserDetailsDialog } from "@/components/users/UserDetailsDialog";
import { BulkActionsDialog } from "@/components/users/BulkActionsDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function UsersTable() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked" | "balance">("all");
  const [bulkAction, setBulkAction] = useState<"block" | "unblock" | "delete" | "balance" | null>(null);
  const itemsPerPage = 25;

  const { data: profiles, isLoading } = useProfiles();
  const bulkToggleBlock = useBulkToggleBlockUser();
  const bulkUpdateBalance = useBulkUpdateBalance();
  const deleteProfiles = useDeleteProfiles();

  const filteredUsers = useMemo(() => {
    return profiles?.filter(user => {
      const searchTerm = search.toLowerCase();
      const matchesSearch = user.username?.toLowerCase().includes(searchTerm) || user.first_name?.toLowerCase().includes(searchTerm);
      const matchesFilter = filterStatus === "all" || (filterStatus === "active" && !user.is_blocked) || (filterStatus === "blocked" && user.is_blocked) || (filterStatus === "balance" && Number(user.balance) > 0);
      return matchesSearch && matchesFilter;
    });
  }, [profiles, search, filterStatus]);

  const totalPages = Math.ceil((filteredUsers?.length || 0) / itemsPerPage);
  const paginatedUsers = filteredUsers?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const allSelected = paginatedUsers?.length > 0 && paginatedUsers?.every(user => selectedUsers.has(user.id));
  const someSelected = paginatedUsers?.some(user => selectedUsers.has(user.id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      const newSet = new Set(selectedUsers);
      paginatedUsers?.forEach(user => newSet.delete(user.id));
      setSelectedUsers(newSet);
    } else {
      // Select all
      const newSet = new Set(selectedUsers);
      paginatedUsers?.forEach(user => newSet.add(user.id));
      setSelectedUsers(newSet);
    }
  };

  const handleBulkAction = (amount?: number) => {
    const userIds = Array.from(selectedUsers);
    
    switch (bulkAction) {
      case "block":
        bulkToggleBlock.mutate({ userIds, isBlocked: true }, {
          onSuccess: () => setSelectedUsers(new Set())
        });
        break;
      case "unblock":
        bulkToggleBlock.mutate({ userIds, isBlocked: false }, {
          onSuccess: () => setSelectedUsers(new Set())
        });
        break;
      case "delete":
        deleteProfiles.mutate(userIds, {
          onSuccess: () => setSelectedUsers(new Set())
        });
        break;
      case "balance":
        if (amount !== undefined) {
          bulkUpdateBalance.mutate({ userIds, amount }, {
            onSuccess: () => setSelectedUsers(new Set())
          });
        }
        break;
    }
  };

  const selectedProfiles = profiles?.filter(p => selectedUsers.has(p.id)) || [];
  const hasBlockedUsers = selectedProfiles.some(p => p.is_blocked);
  const hasUnblockedUsers = selectedProfiles.some(p => !p.is_blocked);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">Пользователи</h1>
            <Breadcrumbs items={[{ label: "Пользователи" }]} />
          </div>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Экспорт</Button>
        </div>
      </header>

      <div className="p-6 h-[calc(100vh-4rem)] overflow-auto">
        {isLoading ? (
          <div className="space-y-4 max-w-7xl mx-auto">
            <Card>
              <div className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <Skeleton className="h-10 w-full md:w-80" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-4 w-4" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ) : (
        <div className="space-y-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {["all", "active", "blocked", "balance"].map(f => (
                <Button key={f} variant={filterStatus === f ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(f as any)}>
                  {f === "all" ? "Все" : f === "active" ? "Активные" : f === "blocked" ? "Заблокированные" : "С балансом"}
                </Button>
              ))}
            </div>
          </div>

          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg flex-wrap">
              <span className="text-sm font-medium">Выбрано: {selectedUsers.size}</span>
              <div className="flex gap-2 flex-wrap">
                {hasUnblockedUsers && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBulkAction("block")}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Заблокировать
                  </Button>
                )}
                {hasBlockedUsers && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBulkAction("unblock")}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Разблокировать
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setBulkAction("balance")}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Изменить баланс
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setBulkAction("delete")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedUsers(new Set())}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Card>
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <div role="button" aria-label="Выделить всех пользователей" onClick={handleSelectAll}>
                      <Checkbox 
                        checked={allSelected}
                      />
                    </div>
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="text-right">Баланс</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12">Загрузка...</TableCell></TableRow>
                ) : paginatedUsers?.length === 0 ? (
                  <TableRow><TableCell colSpan={7}><EmptyState icon={Search} title="Не найдено" description="Измените фильтры" /></TableCell></TableRow>
                ) : (
                  paginatedUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedUsers.has(user.id)} 
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedUsers);
                            if (checked) {
                              newSet.add(user.id);
                            } else {
                              newSet.delete(user.id);
                            }
                            setSelectedUsers(newSet);
                          }} 
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{user.telegram_id}</TableCell>
                      <TableCell>{user.first_name || "—"}</TableCell>
                      <TableCell>{user.username ? `@${user.username}` : "—"}</TableCell>
                      <TableCell className="text-right">{Number(user.balance).toFixed(2)} ₽</TableCell>
                      <TableCell><Badge variant={user.is_blocked ? "destructive" : "default"}>{user.is_blocked ? "Заблокирован" : "Активен"}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setDetailsOpen(true); }}><Eye className="h-4 w-4 mr-2" />Просмотр</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          </Card>
        </div>
        )}
      </div>

      <UserDetailsDialog user={selectedUser} open={detailsOpen} onOpenChange={setDetailsOpen} />
      
      <BulkActionsDialog
        open={bulkAction !== null}
        onOpenChange={(open) => !open && setBulkAction(null)}
        action={bulkAction || "block"}
        selectedCount={selectedUsers.size}
        onConfirm={handleBulkAction}
        isPending={bulkToggleBlock.isPending || bulkUpdateBalance.isPending || deleteProfiles.isPending}
      />
    </div>
  );
}
