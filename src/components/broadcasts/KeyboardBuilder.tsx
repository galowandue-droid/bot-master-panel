import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { BroadcastButton } from "@/hooks/useBroadcasts";

interface KeyboardBuilderProps {
  buttons: Omit<BroadcastButton, 'id'>[];
  onChange: (buttons: Omit<BroadcastButton, 'id'>[]) => void;
}

export function KeyboardBuilder({ buttons, onChange }: KeyboardBuilderProps) {
  const addButton = (row: number) => {
    const newButtons = [...buttons];
    const rowButtons = newButtons.filter((b) => b.row === row);
    newButtons.push({
      text: "Новая кнопка",
      url: "",
      row,
      position: rowButtons.length,
    });
    onChange(newButtons);
  };

  const addRow = () => {
    const maxRow = Math.max(...buttons.map((b) => b.row), -1);
    addButton(maxRow + 1);
  };

  const removeButton = (index: number) => {
    const newButtons = buttons.filter((_, i) => i !== index);
    onChange(newButtons);
  };

  const updateButton = (index: number, field: keyof BroadcastButton, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    onChange(newButtons);
  };

  // Group buttons by row
  const rows = buttons.reduce((acc, button, index) => {
    if (!acc[button.row]) acc[button.row] = [];
    acc[button.row].push({ ...button, index });
    return acc;
  }, {} as Record<number, Array<BroadcastButton & { index: number }>>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Клавиатура</Label>
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-3 w-3 mr-1" />
          Добавить ряд
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(rows)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([rowNum, rowButtons]) => (
            <Card key={rowNum} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">Ряд {Number(rowNum) + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addButton(Number(rowNum))}
                  className="h-6 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {rowButtons.map((button) => (
                  <div key={button.index} className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Текст кнопки"
                        value={button.text}
                        onChange={(e) => updateButton(button.index, "text", e.target.value)}
                        className="h-8"
                      />
                      <Input
                        placeholder="URL (опционально)"
                        value={button.url || ""}
                        onChange={(e) => updateButton(button.index, "url", e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeButton(button.index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
      </div>

      {buttons.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
          Добавьте кнопки для клавиатуры
        </div>
      )}
    </div>
  );
}
