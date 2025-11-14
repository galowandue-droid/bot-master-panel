import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, UserCircle, Mail, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { UserDetailsDialog } from "@/components/users/UserDetailsDialog";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    username: string;
    balance: number;
    purchases: number;
    firstName?: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const itemsPerPage = 10;

  // Mock data
  const mockUsers = Array.from({ length: 25 }, (_, i) => ({
    id: 123456789 + i,
    username: `user${i + 1}`,
    firstName: `User ${i + 1}`,
    balance: Math.floor(Math.random() * 5000),
    purchases: Math.floor(Math.random() * 20),
    registrationDate: new Date(2024, 0, Math.floor(Math.random() * 30) + 1).toLocaleDateString(),
  }));

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.id.toString().includes(searchQuery) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      (filterType === "active" && user.purchases > 0) ||
      (filterType === "new" && user.purchases === 0);

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleUserClick = (user: typeof mockUsers[0]) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

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
        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по ID, логину или номеру чека..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select value={filterType} onValueChange={(value) => {
              setFilterType(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Все пользователи" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все пользователи</SelectItem>
                <SelectItem value="active">С покупками</SelectItem>
                <SelectItem value="new">Новые</SelectItem>
              </SelectContent>
            </Select>
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
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.firstName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.registrationDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-foreground">{user.id}</p>
                    <p className="text-muted-foreground">@{user.username}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">
                      ₽{user.balance}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.purchases} покупок
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(user);
                      }}
                    >
                      Профиль
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Показано {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} из {filteredUsers.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                      )
                      .map((page, idx, arr) => (
                        <div key={page} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <UserDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}
