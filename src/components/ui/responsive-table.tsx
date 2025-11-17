import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cardView?: boolean;
  renderCard?: (row: any, index: number) => React.ReactNode;
  data?: any[];
}

export function ResponsiveTable({ 
  children, 
  className, 
  cardView = true,
  renderCard,
  data = [],
  ...props 
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();
  const showCards = isMobile && cardView && renderCard && data.length > 0;

  if (showCards) {
    return (
      <div className={cn("flex flex-col gap-3", className)} {...props}>
        {data.map((row, index) => (
          <div 
            key={index}
            className="rounded-lg border border-border bg-card p-4 shadow-sm animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {renderCard(row, index)}
          </div>
        ))}
      </div>
    );
  }

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
