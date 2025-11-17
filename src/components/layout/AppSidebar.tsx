import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { LayoutDashboard, Package, Users, CreditCard, Settings as SettingsIcon, ChevronRight, ChevronDown, Wrench, Bot, BarChart3, Search, Send, Database, FileText, LogOut, User, ShoppingBag, FolderTree, Gift, Radio, TrendingUp, Shield, Webhook, Star } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { MobileSidebarHeader } from "./MobileSidebarHeader";
import { SidebarQuickAccess } from "./SidebarQuickAccess";
import { useSidebarFavorites } from "@/hooks/useSidebarFavorites";
import { useSidebarSearch } from "@/hooks/useSidebarSearch";
interface MenuItem {
  title: string;
  url?: string;
  icon: React.ElementType;
  items?: {
    title: string;
    url: string;
    icon: React.ElementType;
  }[];
}
const menuItems: MenuItem[] = [{
  title: "Дашборд",
  url: "/",
  icon: LayoutDashboard
}, {
  title: "Каталог",
  url: "/catalog",
  icon: Package
}, {
  title: "Пользователи",
  icon: Users,
  items: [{
    title: "Список",
    url: "/users",
    icon: Users
  }, {
    title: "Роли",
    url: "/roles",
    icon: Shield
  }]
}, {
  title: "Финансы",
  icon: CreditCard,
  items: [{
    title: "Платежи",
    url: "/payments",
    icon: CreditCard
  }, {
    title: "Настройки платежей",
    url: "/payment-settings",
    icon: Wrench
  }]
}, {
  title: "Коммуникация",
  icon: Send,
  items: [{
    title: "Рассылки",
    url: "/mailing",
    icon: Send
  }, {
    title: "Обяз. каналы",
    url: "/required-channels",
    icon: Radio
  }, {
    title: "Рефералы",
    url: "/referrals",
    icon: Gift
  }]
}, {
  title: "Аналитика",
  icon: TrendingUp,
  items: [{
    title: "Дашборд",
    url: "/",
    icon: LayoutDashboard
  }, {
    title: "Аналитика",
    url: "/analytics",
    icon: BarChart3
  }, {
    title: "Поиск",
    url: "/search",
    icon: Search
  }]
}, {
  title: "Настройки",
  url: "/settings",
  icon: SettingsIcon
}];
const toolsItems: MenuItem = {
  title: "Инструменты",
  icon: Database,
  items: [{
    title: "База данных",
    url: "/database",
    icon: Database
  }, {
    title: "Логи",
    url: "/logs",
    icon: FileText
  }, {
    title: "Журнал действий",
    url: "/audit-log",
    icon: Shield
  }, {
    title: "Webhook логи",
    url: "/webhook-logs",
    icon: Webhook
  }]
};
export function AppSidebar() {
  const {
    open,
    openMobile,
    isMobile,
    setOpenMobile
  } = useSidebar();
  const shouldShowText = isMobile ? openMobile : open;
  const location = useLocation();
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();

  // Load collapsed groups from localStorage
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem("sidebar-collapsed-groups");
    return stored ? JSON.parse(stored) : {};
  });

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed-groups", JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);
  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Mobile enhancements
  const [showSearch, setShowSearch] = useState(false);
  const allMenuItems = [...menuItems, toolsItems];
  const { favorites, toggleFavorite, isFavorite } = useSidebarFavorites();
  const { searchQuery, setSearchQuery, searchResults, hasResults } = useSidebarSearch(allMenuItems);

  // Handle search submit (Enter key)
  const handleSearchSubmit = () => {
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      navigate(firstResult.url);
      setSearchQuery("");
      setShowSearch(false);
      if (isMobile) {
        setOpenMobile(false);
      }
    }
  };

  // Check if any child item is active
  const isGroupActive = (items?: {
    url: string;
  }[]) => {
    if (!items) return false;
    return items.some(item => location.pathname === item.url);
  };

  // Auto-expand groups with active items
  useEffect(() => {
    const newCollapsed = {
      ...collapsedGroups
    };
    let hasChanges = false;
    [...menuItems, toolsItems].forEach(group => {
      if (group.items && isGroupActive(group.items)) {
        if (newCollapsed[group.title] !== false) {
          newCollapsed[group.title] = false;
          hasChanges = true;
        }
      }
    });
    if (hasChanges) {
      setCollapsedGroups(newCollapsed);
    }
  }, [location.pathname]);
  const renderMenuItem = (item: MenuItem) => {
    // Single item without children
    if (item.url && !item.items) {
      const isActive = location.pathname === item.url;
      const itemIsFavorite = isFavorite(item.url);
      
      return <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink to={item.url} className={cn("flex items-center gap-3 rounded-lg px-3 transition-colors", isMobile ? "py-3" : "py-2", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50")}>
              <item.icon className="h-4 w-4" />
              {shouldShowText && <>
                  <span className="flex-1">{item.title}</span>
                  {isMobile && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite({ title: item.title, url: item.url, icon: "FileText" });
                      }}
                      className="p-1 hover:bg-sidebar-accent rounded transition-colors"
                    >
                      <Star className={cn("h-3 w-3", itemIsFavorite && "fill-primary text-primary")} />
                    </button>
                  )}
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>;
    }

    // Group with children
    const isOpen = !collapsedGroups[item.title];
    const hasActiveChild = isGroupActive(item.items);
    const itemCount = item.items?.length || 0;
    return <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleGroup(item.title)}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className={cn("flex items-center gap-3 rounded-lg px-3 transition-colors w-full", isMobile ? "py-3" : "py-2", hasActiveChild ? "bg-sidebar-accent/30 text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50")}>
              <item.icon className="h-4 w-4" />
              {shouldShowText ? <>
                  <span>{item.title}</span>
                  {isOpen ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
                </> : <span className="sr-only">{item.title} ({itemCount})</span>}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-6 space-y-1 mt-1">
            {item.items?.map(subItem => {
            const isActive = location.pathname === subItem.url;
            const subItemIsFavorite = isFavorite(subItem.url);
            
            return <NavLink key={subItem.title} to={subItem.url} className={cn("flex items-center gap-3 rounded-lg px-3 text-sm transition-colors pl-2", isMobile ? "py-3" : "py-2", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                  <subItem.icon className="h-4 w-4" />
                  {shouldShowText && (
                    <>
                      <span className="flex-1">{subItem.title}</span>
                      {isMobile && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite({ title: subItem.title, url: subItem.url, icon: "FileText" });
                          }}
                          className="p-1 hover:bg-sidebar-accent rounded transition-colors"
                        >
                          <Star className={cn("h-3 w-3", subItemIsFavorite && "fill-primary text-primary")} />
                        </button>
                      )}
                    </>
                  )}
                </NavLink>;
          })}
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>;
  };
  return <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      {isMobile ? (
        <MobileSidebarHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={showSearch}
          onToggleSearch={() => setShowSearch(!showSearch)}
          onSearchSubmit={handleSearchSubmit}
        />
      ) : (
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                <Bot className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              {shouldShowText && <div>
                  <p className="text-sm font-semibold text-sidebar-foreground">Admin Panel</p>
                  <p className="text-xs text-sidebar-foreground/60">Telegram Bot</p>
                </div>}
            </div>
            {shouldShowText && <NotificationCenter />}
          </div>
        </SidebarHeader>
      )}

      {isMobile && (
        <SidebarQuickAccess
          favorites={favorites}
          recent={[]}
          searchResults={searchResults}
          hasSearch={showSearch && searchQuery.length > 0}
        />
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Меню</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-2 px-3">
          <div className="h-px bg-border/40" />
        </div>

        <SidebarGroup>
          
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItem(toolsItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-2">
        <Button variant="ghost" className={cn("w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isMobile && "py-3")} asChild>
          <NavLink to="/profile">
            <User className="h-4 w-4" />
            {shouldShowText && <span>Мой профиль</span>}
          </NavLink>
        </Button>
        <Button variant="ghost" className={cn("w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isMobile && "py-3")} onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {shouldShowText && <span>Выход</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>;
}