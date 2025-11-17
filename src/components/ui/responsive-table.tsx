import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ResponsiveTable({ children, className, ...props }: ResponsiveTableProps) {
  return (
    <div className={cn("relative w-full", className)} {...props}>
      <ScrollArea className="w-full rounded-md border">
        <div className="min-w-[800px] lg:min-w-full">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
