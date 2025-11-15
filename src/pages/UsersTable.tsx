import { useState, useMemo } from "react";
import { useProfiles } from "@/hooks/useProfiles";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Download, MoreVertical, Eye, Ban, Trash2, X } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { UserDetailsDialog } from "@/components/users/UserDetailsDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function UsersTable() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked" | "balance">("all");
  const itemsPerPage = 25;

  const { data: profiles, isLoading } = useProfiles();

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
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-sm">Выбрано: {selectedUsers.size}</span>
              <Button variant="outline" size="sm"><Ban className="h-4 w-4 mr-2" />Заблокировать</Button>
              <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 mr-2" />Удалить</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUsers(new Set())}><X className="h-4 w-4" /></Button>
            </div>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Выделить всех пользователей"
                    />
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
                      <TableCell><Checkbox checked={selectedUsers.has(user.id)} onCheckedChange={() => {
                        const newSet = new Set(selectedUsers);
                        newSet.has(user.id) ? newSet.delete(user.id) : newSet.add(user.id);
                        setSelectedUsers(newSet);
                      }} /></TableCell>
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
          </Card>
        </div>
      </div>

      <UserDetailsDialog user={selectedUser} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  );
}
