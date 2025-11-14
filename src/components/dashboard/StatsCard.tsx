import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  description?: string | ReactNode;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  description,
}: StatsCardProps) {
  return (
    <Card className="p-6 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 overflow-hidden border-border/40 shadow-md">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-5 rounded-full -mr-16 -mt-16" />
      <div className="flex items-start justify-between relative">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div>
            <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">{value}</p>
            {description && (
              <div className="text-xs text-muted-foreground mt-1">
                {typeof description === 'string' ? <p>{description}</p> : description}
              </div>
            )}
          </div>
          {change && (
            <p
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-gradient-primary p-3 shadow-glow">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
}
