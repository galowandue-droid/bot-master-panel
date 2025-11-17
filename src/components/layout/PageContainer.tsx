import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "default" | "wide" | "full";
  gradient?: boolean;
}

export function PageContainer({
  children,
  className,
  maxWidth = "default",
  gradient = false,
}: PageContainerProps) {
  const maxWidthClasses = {
    default: "max-w-7xl",
    wide: "max-w-[1600px]",
    full: "max-w-none",
  };

  return (
      <div className={cn(
        "min-h-screen overflow-x-hidden",
        gradient ? "bg-gradient-to-br from-background via-background to-muted/20" : "bg-background"
      )}>
      <div className={cn(
        "p-3 md:p-6 space-y-3 md:space-y-6 mx-auto",
        maxWidthClasses[maxWidth],
        className
      )}>
        {children}
      </div>
    </div>
  );
}
