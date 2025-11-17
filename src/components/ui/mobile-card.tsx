import * as React from "react";
import { cn } from "@/lib/utils";

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MobileCard({ children, className, ...props }: MobileCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm space-y-3",
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
    <div className={cn("flex items-center justify-between gap-2", className)} {...props}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
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
    <div className={cn("flex items-start justify-between gap-2 pb-2 border-b border-border", className)}>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground truncate">{title}</div>
        {subtitle && <div className="text-sm text-muted-foreground truncate">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
    </div>
  );
}
