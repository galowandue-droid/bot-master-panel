import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, UserCircle, Wallet, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { UserDetailsDialog } from "@/components/users/UserDetailsDialog";
import { useProfiles } from "@/hooks/useProfiles";
import { Skeleton } from "@/components/ui/skeleton";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: profiles, isLoading } = useProfiles(searchQuery);

  const itemsPerPage = 10;

  const filteredUsers = (profiles || []).filter((user) => {
    const matchesFilter =
      filterType === "all" ||
      (filterType === "active" && user.purchases_count > 0) ||
      (filterType === "new" && user.purchases_count === 0);

    return matchesFilter;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setDialogOpen(true);
  };

  const selectedUser = profiles?.find((p) => p.id === selectedUserId) || null;

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
                placeholder="Поиск по ID, логину..."
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

        {/* User Cards Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : paginatedUsers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Пользователи не найдены</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {paginatedUsers.map((user) => (
              <Card
                key={user.id}
                className="p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="rounded-full bg-primary/10 p-2 shrink-0">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {user.first_name || user.username || `User ${user.telegram_id}`}
                        </h3>
                        {user.is_blocked && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-destructive/10 text-destructive">
                            Заблокирован
                          </span>
                        )}
                      </div>
                      {user.username && (
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      )}
                      <p className="text-xs text-muted-foreground">ID: {user.telegram_id}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 text-success mb-2">
                        <Wallet className="h-4 w-4" />
                        <span className="font-semibold">₽{user.balance.toFixed(0)}</span>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Покупок: {user.purchases_count}</p>
                        <p>Потрачено: ₽{user.total_spent.toFixed(0)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUserClick(user.id)}
                      className="shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
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
        )}
      </div>

      <UserDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}
