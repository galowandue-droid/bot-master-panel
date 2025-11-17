import { useState, useMemo, useEffect } from "react";
import { useProfiles, useBulkToggleBlockUser, useBulkUpdateBalance, useDeleteProfiles } from "@/hooks/useProfiles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, MoreVertical, Eye, Ban, ShieldCheck, Trash2, X, Wallet, Columns3, Users, User } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { UserDetailsDialog } from "@/components/users/UserDetailsDialog";
import { BulkActionsDialog } from "@/components/users/BulkActionsDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeaderSearch } from "@/components/layout/PageHeaderSearch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { MobileCard, MobileCardRow, MobileCardHeader } from "@/components/ui/mobile-card";


const COLUMN_STORAGE_KEY = "usersTableColumns";

const DEFAULT_COLUMNS = {
  id: true,
  username: true,
  firstName: true,
  telegramId: true,
  balance: true,
  totalSpent: true,
  purchases: true,
  createdAt: true,
  blocked: true,
};

export default function UsersTable() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked" | "balance">("all");
  const [bulkAction, setBulkAction] = useState<"block" | "unblock" | "delete" | "balance" | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem(COLUMN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_COLUMNS;
  });
  const itemsPerPage = 25;


  const { data: profiles, isLoading } = useProfiles();
  const bulkToggleBlock = useBulkToggleBlockUser();
  const bulkUpdateBalance = useBulkUpdateBalance();
  const deleteProfiles = useDeleteProfiles();

  useEffect(() => {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

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
    <>
      <PageHeader
        title="Пользователи"
        description="Управление пользователями системы"
        icon={<Users className="h-5 w-5 text-primary" />}
        gradient
        actions={
          <div className="flex items-center gap-2">
            <PageHeaderSearch 
              placeholder="Поиск пользователей..." 
              value={search} 
              onChange={setSearch} 
            />
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        }
      />
      
      <PageContainer gradient>
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
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {["all", "active", "blocked", "balance"].map(f => (
                <Button 
                  key={f} 
                  variant={filterStatus === f ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setFilterStatus(f as any)}
                  className="text-xs xs:text-sm px-2 xs:px-3"
                >
                  <span className="hidden xs:inline">{f === "all" ? "Все" : f === "active" ? "Активные" : f === "blocked" ? "Заблокированные" : "С балансом"}</span>
                  <span className="inline xs:hidden">{f === "all" ? "Все" : f === "active" ? "Активн." : f === "blocked" ? "Заблок." : "Баланс"}</span>
                </Button>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns3 className="h-4 w-4 mr-2" />
                    Колонки
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Отображение колонок</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={visibleColumns.id} onCheckedChange={() => toggleColumn("id")}>
                    ID
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.username} onCheckedChange={() => toggleColumn("username")}>
                    Username
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.firstName} onCheckedChange={() => toggleColumn("firstName")}>
                    Имя
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.telegramId} onCheckedChange={() => toggleColumn("telegramId")}>
                    Telegram ID
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.balance} onCheckedChange={() => toggleColumn("balance")}>
                    Баланс
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.totalSpent} onCheckedChange={() => toggleColumn("totalSpent")}>
                    Потрачено
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.purchases} onCheckedChange={() => toggleColumn("purchases")}>
                    Покупок
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.createdAt} onCheckedChange={() => toggleColumn("createdAt")}>
                    Дата регистрации
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.blocked} onCheckedChange={() => toggleColumn("blocked")}>
                    Статус
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

          <ResponsiveTable
            cardView={true}
            data={paginatedUsers}
            renderCard={(user, index) => (
              <MobileCard key={user.id}>
                <MobileCardHeader
                  title={user.username ? `@${user.username}` : user.first_name || "Пользователь"}
                  subtitle={`ID: ${user.telegram_id}`}
                  actions={
                    <>
                      <Checkbox 
                        checked={selectedUsers.has(user.id)} 
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedUsers);
                          if (checked) newSet.add(user.id);
                          else newSet.delete(user.id);
                          setSelectedUsers(newSet);
                        }} 
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => { setSelectedUser(user); setDetailsOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
                <MobileCardRow 
                  label="Статус" 
                  value={
                    <Badge variant={user.is_blocked ? "destructive" : "default"}>
                      {user.is_blocked ? "Заблокирован" : "Активен"}
                    </Badge>
                  }
                />
                <MobileCardRow 
                  label="Баланс" 
                  icon={<Wallet className="h-4 w-4" />}
                  value={`${Number(user.balance).toFixed(2)} ₽`}
                />
                <MobileCardRow 
                  label="Имя" 
                  icon={<User className="h-4 w-4" />}
                  value={user.first_name || "—"}
                />
                <MobileCardRow 
                  label="Дата регистрации" 
                  value={new Date(user.created_at).toLocaleDateString('ru-RU')}
                />
              </MobileCard>
            )}
          >
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
                  {visibleColumns.id && <TableHead>ID</TableHead>}
                  {visibleColumns.username && <TableHead>Username</TableHead>}
                  {visibleColumns.firstName && <TableHead>Имя</TableHead>}
                  {visibleColumns.telegramId && <TableHead>Telegram ID</TableHead>}
                  {visibleColumns.balance && <TableHead className="text-right">Баланс</TableHead>}
                  {visibleColumns.totalSpent && <TableHead className="text-right">Потрачено</TableHead>}
                  {visibleColumns.purchases && <TableHead className="text-right">Покупок</TableHead>}
                  {visibleColumns.createdAt && <TableHead>Дата регистрации</TableHead>}
                  {visibleColumns.blocked && <TableHead>Статус</TableHead>}
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
                      {visibleColumns.id && <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}</TableCell>}
                      {visibleColumns.username && <TableCell>{user.username ? `@${user.username}` : <span className="text-muted-foreground">—</span>}</TableCell>}
                      {visibleColumns.firstName && <TableCell>{user.first_name || <span className="text-muted-foreground">—</span>}</TableCell>}
                      {visibleColumns.telegramId && <TableCell className="font-mono text-xs">{user.telegram_id}</TableCell>}
                      {visibleColumns.balance && <TableCell className="text-right whitespace-nowrap">{Number(user.balance).toFixed(2)} ₽</TableCell>}
                      {visibleColumns.totalSpent && <TableCell className="text-right text-muted-foreground">—</TableCell>}
                      {visibleColumns.purchases && <TableCell className="text-right text-muted-foreground">—</TableCell>}
                      {visibleColumns.createdAt && <TableCell className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString('ru-RU')}</TableCell>}
                      {visibleColumns.blocked && <TableCell><Badge variant={user.is_blocked ? "destructive" : "default"} className="whitespace-nowrap">{user.is_blocked ? "Заблокирован" : "Активен"}</Badge></TableCell>}
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
          </ResponsiveTable>
        </div>
        )}
      </PageContainer>

      <UserDetailsDialog user={selectedUser} open={detailsOpen} onOpenChange={setDetailsOpen} />
      
      <BulkActionsDialog
        open={bulkAction !== null}
        onOpenChange={(open) => !open && setBulkAction(null)}
        action={bulkAction || "block"}
        selectedCount={selectedUsers.size}
        onConfirm={handleBulkAction}
        isPending={bulkToggleBlock.isPending || bulkUpdateBalance.isPending || deleteProfiles.isPending}
      />
    </>
  );
}
