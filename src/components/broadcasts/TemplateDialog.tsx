import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMessageTemplates, CreateTemplateInput } from "@/hooks/useMessageTemplates";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TemplateDialog = ({ open, onOpenChange }: TemplateDialogProps) => {
  const { createTemplate } = useMessageTemplates();
  const [variableInput, setVariableInput] = useState("");
  const [variables, setVariables] = useState<string[]>([]);

  const form = useForm<CreateTemplateInput>({
    defaultValues: {
      name: "",
      description: "",
      category: "general",
      content: "",
      is_active: true,
    },
  });

  const onSubmit = async (data: CreateTemplateInput) => {
    await createTemplate.mutateAsync({
      ...data,
      variables,
    });
    form.reset();
    setVariables([]);
    onOpenChange(false);
  };

  const addVariable = () => {
    if (variableInput && !variables.includes(variableInput)) {
      setVariables([...variables, variableInput]);
      setVariableInput("");
    }
  };

  const removeVariable = (varName: string) => {
    setVariables(variables.filter(v => v !== varName));
  };

  return (
    <ResponsiveDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title="Создать шаблон сообщения"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Приветственное сообщение" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Краткое описание шаблона" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">Общие</SelectItem>
                      <SelectItem value="welcome">Приветствие</SelectItem>
                      <SelectItem value="promo">Промо</SelectItem>
                      <SelectItem value="notification">Уведомления</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Содержимое</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Привет, {name}! Ваш баланс: {balance} руб."
                      rows={6}
                    />
                  </FormControl>
                  <FormDescription>
                    Используйте переменные в фигурных скобках, например: {`{name}, {balance}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Переменные</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={variableInput}
                  onChange={(e) => setVariableInput(e.target.value)}
                  placeholder="Название переменной (например: name)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addVariable();
                    }
                  }}
                />
                <Button type="button" onClick={addVariable}>
                  Добавить
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {variables.map((varName) => (
                  <Badge key={varName} variant="secondary">
                    {`{${varName}}`}
                    <button
                      type="button"
                      onClick={() => removeVariable(varName)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Активен</FormLabel>
                    <FormDescription>
                      Только активные шаблоны отображаются при создании рассылок
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={createTemplate.isPending}>
                Создать
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialog>
  );
};
