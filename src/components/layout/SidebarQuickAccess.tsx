import { Star, Clock, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface QuickAccessItem {
  title: string;
  url: string;
  icon: string;
  timestamp?: number;
}

interface SidebarQuickAccessProps {
  favorites: QuickAccessItem[];
  recent: QuickAccessItem[];
  onToggleFavorite?: (url: string) => void;
  searchResults?: Array<{ title: string; url: string; icon: string; path?: string }>;
  hasSearch?: boolean;
}

export function SidebarQuickAccess({
  favorites,
  recent,
  searchResults,
  hasSearch,
}: SidebarQuickAccessProps) {
  // Show search results if searching
  if (hasSearch && searchResults && searchResults.length > 0) {
    return (
      <div className="px-4 py-3 space-y-2 border-b border-sidebar-border bg-sidebar-accent/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <ChevronRight className="w-3 h-3" />
          Результаты поиска
        </div>
        <div className="space-y-1">
          {searchResults.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent transition-colors group"
              activeClassName="bg-sidebar-accent text-primary font-medium"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {item.title}
                </div>
                {item.path && (
                  <div className="text-xs text-muted-foreground truncate">
                    {item.path}
                  </div>
                )}
              </div>
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state for search with no results
  if (hasSearch && searchResults && searchResults.length === 0) {
    return (
      <div className="px-4 py-6 text-center border-b border-sidebar-border">
        <p className="text-sm text-muted-foreground">Ничего не найдено</p>
      </div>
    );
  }

  // Show favorites and recent if not searching
  const hasContent = favorites.length > 0 || recent.length > 0;
  if (!hasContent) return null;

  return (
    <div className="px-4 py-3 space-y-4 border-b border-sidebar-border bg-sidebar-accent/50">
      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Star className="w-3 h-3 fill-current" />
            Избранное
          </div>
          <div className="space-y-1">
            {favorites.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent transition-colors group"
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <div className="flex-1 truncate text-sm text-sidebar-foreground">
                  {item.title}
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            Недавние
          </div>
          <div className="space-y-1">
            {recent.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent transition-colors group"
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <div className="flex-1 truncate text-sm text-sidebar-foreground">
                  {item.title}
                </div>
                {item.timestamp && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(item.timestamp, {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
