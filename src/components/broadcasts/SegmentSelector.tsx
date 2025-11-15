import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSegments } from "@/hooks/useSegments";

interface SegmentSelectorProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  onCreateSegment: () => void;
}

export function SegmentSelector({ value, onChange, onCreateSegment }: SegmentSelectorProps) {
  const { segments, isLoading } = useSegments();

  return (
    <div className="flex gap-2">
      <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? undefined : v)}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Выберите сегмент" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все пользователи</SelectItem>
          {segments?.map((segment) => (
            <SelectItem key={segment.id} value={segment.id}>
              {segment.name} ({segment.memberCount || 0})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={onCreateSegment}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
