import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  ChevronRight,
  Wrench,
  Bot,
  BarChart3,
  Search,
  Send,
  Database,
  FileText,
  LogOut,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Дашборд", url: "/", icon: LayoutDashboard },
  { title: "Каталог", url: "/catalog", icon: Package },
  { title: "Статистика", url: "/statistics", icon: BarChart3 },
  { title: "Поиск", url: "/search", icon: Search },
  { title: "Рассылка", url: "/mailing", icon: Send },
  { title: "Пользователи", url: "/users", icon: Users },
  { title: "Платежи", url: "/payments", icon: CreditCard },
  { title: "Настройки платежей", url: "/payment-settings", icon: Wrench },
  { title: "Настройки", url: "/settings", icon: SettingsIcon },
];

const toolsItems = [
  { title: "База данных", url: "/database", icon: Database },
  { title: "Логи", url: "/logs", icon: FileText },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Bot className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {open && (
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">Admin Panel</p>
              <p className="text-xs text-sidebar-foreground/60">Telegram Bot</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Управление</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Инструменты</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          asChild
        >
          <NavLink to="/profile">
            <User className="h-4 w-4" />
            {open && <span>Мой профиль</span>}
          </NavLink>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {open && <span>Выход</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
