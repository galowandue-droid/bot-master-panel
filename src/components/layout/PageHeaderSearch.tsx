import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageHeaderSearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PageHeaderSearch({ 
  placeholder = "Поиск...", 
  value, 
  onChange,
  className 
}: PageHeaderSearchProps) {
  const isMobile = useIsMobile();
  const mobilePlaceholder = placeholder.length > 15 && isMobile ? "Поиск..." : placeholder;
  
  return (
    <div className="relative w-full max-w-full xs:max-w-sm">
      <Search className="absolute left-2 xs:left-3 top-1/2 h-3.5 w-3.5 xs:h-4 xs:w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={mobilePlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-7 xs:pl-9 ${className}`}
      />
    </div>
  );
}
