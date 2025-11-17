import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface SwipeIndicatorProps {
  currentIndex: number;
  totalCount: number;
  className?: string;
}

export function SwipeIndicator({ currentIndex, totalCount, className }: SwipeIndicatorProps) {
  const isMobile = useIsMobile();

  if (!isMobile || totalCount <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-1.5 py-2", className)}>
      {Array.from({ length: totalCount }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            index === currentIndex 
              ? "w-6 bg-primary" 
              : "w-1.5 bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}
