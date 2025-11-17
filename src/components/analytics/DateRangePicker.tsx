import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

interface DateRangePickerProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
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
    if (!isMobile) setOpen(false);
  };

  const handleCalendarSelect = (range: any) => {
    if (range?.from) {
      onDateRangeChange({
        from: range.from,
        to: range.to || range.from,
      });
      if (range?.to && !isMobile) {
        setOpen(false);
      }
    }
  };

  const formatDateRange = () => {
    return `${format(dateRange.from, "dd MMM yyyy", { locale: ru })} — ${format(dateRange.to, "dd MMM yyyy", { locale: ru })}`;
  };

  const CalendarContent = () => (
    <div className="space-y-4">
      {/* Пресеты */}
      <div className="grid grid-cols-4 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.days)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Выбранный период */}
      {dateRange.from && dateRange.to && (
        <div className="text-sm text-center text-muted-foreground">
          {format(dateRange.from, "dd MMM", { locale: ru })} — {format(dateRange.to, "dd MMM yyyy", { locale: ru })}
        </div>
      )}

      {/* Календарь */}
      <Calendar
        mode="range"
        selected={{ from: dateRange.from, to: dateRange.to }}
        onSelect={handleCalendarSelect}
        locale={ru}
        numberOfMonths={1}
        className="mx-auto"
      />
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start text-left gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="truncate text-xs">{formatDateRange()}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[70vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>Выберите период</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-1">
            <CalendarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-auto min-w-[280px] justify-start text-left gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span className="truncate text-sm">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start" sideOffset={8}>
        <CalendarContent />
      </PopoverContent>
    </Popover>
  );
}
