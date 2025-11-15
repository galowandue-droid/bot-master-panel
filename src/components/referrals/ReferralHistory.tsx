import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Referral } from "@/hooks/useReferrals";

interface ReferralHistoryProps {
  referrals: Referral[];
}

export function ReferralHistory({ referrals }: ReferralHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const filteredReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      // Status filter
      if (statusFilter !== "all" && referral.status !== statusFilter) {
        return false;
      }

      // Search filter (referrer or referred username/name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const referrerUsername = referral.referrer?.username?.toLowerCase() || "";
        const referrerName = referral.referrer?.first_name?.toLowerCase() || "";
        const referredUsername = referral.referred?.username?.toLowerCase() || "";
        const referredName = referral.referred?.first_name?.toLowerCase() || "";
        
        if (
          !referrerUsername.includes(query) &&
          !referrerName.includes(query) &&
          !referredUsername.includes(query) &&
          !referredName.includes(query)
        ) {
          return false;
        }
      }

      // Date filter
      if (dateFrom || dateTo) {
        const referralDate = new Date(referral.created_at);
        if (dateFrom && referralDate < dateFrom) return false;
        if (dateTo && referralDate > dateTo) return false;
      }

      return true;
    });
  }, [referrals, searchQuery, statusFilter, dateFrom, dateTo]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "⏳ Ожидает", variant: "secondary" as const },
      completed: { label: "✅ Выполнен", variant: "default" as const },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || dateFrom || dateTo;

  return (
    <Card>
      <CardHeader>
        <CardTitle>История реферальных вознаграждений</CardTitle>
        <CardDescription>
          Просмотр всех рефералов с фильтрацией по статусу и дате
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="completed">Выполнен</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP", { locale: ru }) : "Дата от"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP", { locale: ru }) : "Дата до"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Очистить
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Найдено записей: {filteredReferrals.length} из {referrals.length}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Реферер</TableHead>
                <TableHead>Реферал</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Вознаграждение</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead>Дата выдачи</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Рефералы не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filteredReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {referral.referrer?.first_name || "Неизвестно"}
                        </div>
                        {referral.referrer?.username && (
                          <div className="text-sm text-muted-foreground">
                            @{referral.referrer.username}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {referral.referred?.first_name || "Неизвестно"}
                        </div>
                        {referral.referred?.username && (
                          <div className="text-sm text-muted-foreground">
                            @{referral.referred.username}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    <TableCell>
                      {referral.reward_amount ? (
                        <span className="font-semibold text-primary">
                          {Number(referral.reward_amount).toFixed(2)} ₽
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(referral.created_at), "dd.MM.yyyy HH:mm", { locale: ru })}
                    </TableCell>
                    <TableCell>
                      {referral.reward_given_at ? (
                        format(new Date(referral.reward_given_at), "dd.MM.yyyy HH:mm", { locale: ru })
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
