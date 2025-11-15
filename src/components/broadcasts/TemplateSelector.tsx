import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { FileText, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TemplateSelectorProps {
  onSelect: (template: {
    message: string;
    media_url?: string;
    media_type?: 'photo' | 'video' | 'document';
    media_caption?: string;
  }) => void;
}

export const TemplateSelector = ({ onSelect }: TemplateSelectorProps) => {
  const { templates } = useMessageTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const activeTemplates = templates?.filter(t => t.is_active) || [];
  const selectedTemplate = activeTemplates.find(t => t.id === selectedTemplateId);

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    onSelect({
      message: selectedTemplate.content,
      media_url: selectedTemplate.media_url,
      media_type: selectedTemplate.media_type,
      media_caption: selectedTemplate.media_caption,
    });
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Использовать шаблон</label>
      <div className="flex gap-2">
        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите шаблон" />
          </SelectTrigger>
          <SelectContent>
            {activeTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{template.name}</span>
                  {template.category && (
                    <span className="text-xs text-muted-foreground">
                      ({template.category})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTemplate && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button type="button" onClick={handleApplyTemplate}>
              Применить
            </Button>
          </>
        )}
      </div>

      {selectedTemplate && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
              <DialogDescription>
                {selectedTemplate.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Содержимое:</h4>
                <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedTemplate.content}
                </div>
              </div>
              {selectedTemplate.variables.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Переменные:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map(varName => (
                      <code key={varName} className="px-2 py-1 bg-muted rounded text-sm">
                        {`{${varName}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
