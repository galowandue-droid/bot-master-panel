import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const isMobile = useIsMobile();

  const presets = [
    { label: "Сегодня", days: 0 },
    { label: "7 дней", days: 7 },
    { label: "30 дней", days: 30 },
    { label: "90 дней", days: 90 },
  ];

  const handlePresetClick = (days: number) => {
    const from = days === 0 ? new Date() : subDays(new Date(), days);
    const to = new Date();
    onDateRangeChange({ from, to });
  };

  const formatDateRange = () => {
    if (isMobile) {
      return `${format(dateRange.from, "dd.MM", { locale: ru })}—${format(dateRange.to, "dd.MM", { locale: ru })}`;
    }
    return `${format(dateRange.from, "dd MMM", { locale: ru })} — ${format(dateRange.to, "dd MMM yyyy", { locale: ru })}`;
  };

  const getActivePreset = () => {
    const today = new Date();
    const diffTime = today.getTime() - dateRange.from.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 0;
    if (diffDays <= 7) return 7;
    if (diffDays <= 30) return 30;
    if (diffDays <= 90) return 90;
    return null;
  };

  const activePreset = getActivePreset();

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{formatDateRange()}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant={activePreset === preset.days ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetClick(preset.days)}
              className="text-xs h-8 px-2"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarIcon className="h-4 w-4" />
        <span>{formatDateRange()}</span>
      </div>
      <div className="flex gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant={activePreset === preset.days ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset.days)}
            className="text-sm"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
