import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { LayoutDashboard, Package, Users, CreditCard, Settings as SettingsIcon, ChevronRight, ChevronDown, Wrench, Bot, BarChart3, Search, Send, Database, FileText, LogOut, User, ShoppingBag, FolderTree } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface MenuItem {
  title: string;
  url?: string;
  icon: React.ElementType;
  emoji?: string;
  items?: {
    title: string;
    url: string;
    icon: React.ElementType;
  }[];
}
const menuItems: MenuItem[] = [{
  title: "Дашборд",
  url: "/",
  icon: LayoutDashboard,
  emoji: "📊"
}, {
  title: "Каталог",
  icon: Package,
  emoji: "📦",
  items: [{
    title: "Категории",
    url: "/catalog",
    icon: FolderTree
  }, {
    title: "Товары",
    url: "/catalog",
    icon: ShoppingBag
  }]
}, {
  title: "Пользователи",
  icon: Users,
  emoji: "👥",
  items: [{
    title: "Список",
    url: "/users",
    icon: Users
  }, {
    title: "Роли",
    url: "/roles",
    icon: SettingsIcon
  }]
}, {
  title: "Финансы",
  icon: CreditCard,
  emoji: "💰",
  items: [{
    title: "Платежи",
    url: "/payments",
    icon: CreditCard
  }, {
    title: "Настройки",
    url: "/payment-settings",
    icon: Wrench
  }]
}, {
  title: "Маркетинг",
  icon: Send,
  emoji: "📢",
  items: [{
    title: "Рассылки",
    url: "/mailing",
    icon: Send
  }, {
    title: "Статистика",
    url: "/statistics",
    icon: BarChart3
  }, {
    title: "Поиск",
    url: "/search",
    icon: Search
  }]
}, {
  title: "Настройки",
  icon: SettingsIcon,
  emoji: "⚙️",
  items: [{
    title: "Общие",
    url: "/settings",
    icon: SettingsIcon
  }]
}];
const toolsItems: MenuItem = {
  title: "Инструменты",
  icon: Database,
  emoji: "🛠️",
  items: [{
    title: "База данных",
    url: "/database",
    icon: Database
  }, {
    title: "Логи",
    url: "/logs",
    icon: FileText
  }]
};
export function AppSidebar() {
  const {
    open
  } = useSidebar();
  const location = useLocation();
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
      return <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink to={item.url} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50")}>
              <item.icon className="h-4 w-4" />
              {open && <>
                  {item.emoji}
                  <span>{item.title}</span>
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>;
    }

    // Group with children
    const isOpen = !collapsedGroups[item.title];
    const hasActiveChild = isGroupActive(item.items);
    return <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleGroup(item.title)}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-colors w-full", hasActiveChild ? "bg-sidebar-accent/30 text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50")}>
              <item.icon className="h-4 w-4" />
              {open && <>
                  {item.emoji}
                  <span>{item.title}</span>
                  {isOpen ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
                </>}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-6 space-y-1 mt-1">
            {item.items?.map(subItem => {
            const isActive = location.pathname === subItem.url;
            return <NavLink key={subItem.title} to={subItem.url} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                  <subItem.icon className="h-4 w-4" />
                  {open && <>
                      <span>{subItem.title}</span>
                      {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                    </>}
                </NavLink>;
          })}
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>;
  };
  return <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Bot className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {open && <div>
              <p className="text-sm font-semibold text-sidebar-foreground">Admin Panel</p>
              <p className="text-xs text-sidebar-foreground/60">Telegram Bot</p>
            </div>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Управление</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{menuItems.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItem(toolsItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
          <NavLink to="/profile">
            <User className="h-4 w-4" />
            {open && <span>Мой профиль</span>}
          </NavLink>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {open && <span>Выход</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>;
}