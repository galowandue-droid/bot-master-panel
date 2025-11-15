import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Wallet,
  Users,
  Send,
  Database,
  FileText,
  Settings,
  Search,
} from "lucide-react";

const navigationItems = [
  { title: "Панель управления", url: "/", icon: LayoutDashboard },
  { title: "Каталог", url: "/catalog", icon: Package },
  { title: "Статистика", url: "/statistics", icon: BarChart3 },
  { title: "Финансы", url: "/payments", icon: Wallet },
  { title: "Пользователи", url: "/users", icon: Users },
  { title: "Рассылка", url: "/mailing", icon: Send },
  { title: "База данных", url: "/database", icon: Database },
  { title: "Логи", url: "/logs", icon: FileText },
  { title: "Настройки", url: "/settings", icon: Settings },
  { title: "Поиск", url: "/search", icon: Search },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Поиск по разделам..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено.</CommandEmpty>
        <CommandGroup heading="Навигация">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.url}
                onSelect={() => handleSelect(item.url)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
