import { useState } from "react";

export const useInlineEdit = <T>(
  initialValue: T,
  onSave: (value: T) => Promise<void>,
  validate?: (value: T) => boolean
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (validate && !validate(value)) {
      setError("Некорректное значение");
      return;
    }

    if (value !== initialValue) {
      setIsSaving(true);
      try {
        await onSave(value);
        setError(null);
      } catch (err) {
        setError("Ошибка сохранения");
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setError(null);
    setIsEditing(false);
  };

  return {
    isEditing,
    value,
    isSaving,
    error,
    setValue,
    setIsEditing,
    handleSave,
    handleCancel,
  };
};
