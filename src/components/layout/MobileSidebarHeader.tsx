import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { cn } from "@/lib/utils";

interface MobileSidebarHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showSearch: boolean;
  onToggleSearch: () => void;
}

export function MobileSidebarHeader({
  searchQuery,
  onSearchChange,
  showSearch,
  onToggleSearch,
}: MobileSidebarHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-sidebar border-b border-sidebar-border">
      {/* Drag Handle */}
      <div className="flex items-center justify-center py-2">
        <div className="w-12 h-1 rounded-full bg-gradient-to-r from-muted-foreground/30 via-muted-foreground/50 to-muted-foreground/30" />
      </div>

      {/* Header Content */}
      <div className="px-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Меню</h2>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <button
              onClick={onToggleSearch}
              className="p-2 hover:bg-sidebar-accent rounded-md transition-colors"
              aria-label="Поиск"
            >
              {showSearch ? (
                <X className="w-4 h-4 text-sidebar-foreground" />
              ) : (
                <Search className="w-4 h-4 text-sidebar-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Search Input */}
        {showSearch && (
          <div className="animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Поиск по меню..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-10 h-10 bg-sidebar-accent border-sidebar-border focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
