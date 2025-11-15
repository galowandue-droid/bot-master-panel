import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Pencil } from "lucide-react";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  type?: "text" | "number";
}

export const EditableField = ({ value, onSave, className, type = "text" }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue !== value && editValue.trim()) {
      setIsSaving(true);
      try {
        await onSave(editValue);
      } catch (error) {
        setEditValue(value);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn("h-auto p-1 text-base", className)}
          autoFocus
          disabled={isSaving}
        />
        {isSaving && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={cn(
        "group/editable relative cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors",
        className
      )}
      title="Двойной клик для редактирования"
    >
      {value}
      <Pencil className="absolute -right-5 top-1/2 -translate-y-1/2 h-3 w-3 opacity-0 group-hover/editable:opacity-50 transition-opacity" />
    </div>
  );
};
