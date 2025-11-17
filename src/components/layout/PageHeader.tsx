import { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  gradient?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  breadcrumbs,
  gradient = false,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur-xl shadow-sm",
      className
    )}>
      <div className="flex h-16 md:h-20 items-center gap-3 md:gap-6 px-4 md:px-6">
        <SidebarTrigger className="h-8 w-8 md:h-10 md:w-10" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 md:gap-3">
            {icon && (
              <div className="rounded-lg md:rounded-xl bg-primary/10 p-1.5 md:p-2.5 shrink-0 shadow-sm">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className={cn(
                "text-lg md:text-2xl font-bold truncate",
                gradient ? "bg-gradient-primary bg-clip-text text-transparent" : "text-foreground"
              )}>
                {title}
              </h1>
              {description && (
                <p className="hidden md:block text-sm text-muted-foreground truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mt-1 hidden sm:block">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
