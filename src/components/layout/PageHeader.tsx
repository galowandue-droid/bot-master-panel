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
      <div className="flex h-20 items-center gap-6 px-6">
        <SidebarTrigger />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="rounded-xl bg-primary/10 p-2.5 shrink-0 shadow-sm">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className={cn(
                "text-2xl font-bold truncate",
                gradient ? "bg-gradient-primary bg-clip-text text-transparent" : "text-foreground"
              )}>
                {title}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mt-1">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
