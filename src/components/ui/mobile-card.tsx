import * as React from "react";
import { cn } from "@/lib/utils";

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MobileCard({ children, className, ...props }: MobileCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-2 xs:p-3 md:p-4 shadow-sm space-y-2 xs:space-y-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface MobileCardRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export function MobileCardRow({ label, value, icon, className, ...props }: MobileCardRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-1 xs:gap-2", className)} {...props}>
      <div className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm text-muted-foreground">
        {icon && <span className="[&>svg]:h-3 [&>svg]:w-3 xs:[&>svg]:h-4 xs:[&>svg]:w-4">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-xs xs:text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

interface MobileCardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function MobileCardHeader({ title, subtitle, actions, className }: MobileCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-1 xs:gap-2 pb-1 xs:pb-2 border-b border-border", className)}>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm xs:text-base text-foreground truncate">{title}</div>
        {subtitle && <div className="text-xs xs:text-sm text-muted-foreground truncate">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-0.5 xs:gap-1 shrink-0 [&>button]:h-7 [&>button]:w-7 xs:[&>button]:h-8 xs:[&>button]:w-8">{actions}</div>}
    </div>
  );
}
