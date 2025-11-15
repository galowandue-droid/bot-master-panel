import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileImage, FileVideo, FileText } from "lucide-react";
import type { BroadcastButton } from "@/hooks/useBroadcasts";

interface MessagePreviewProps {
  message: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'document';
  mediaCaption?: string;
  buttons?: Omit<BroadcastButton, 'id'>[];
}

export function MessagePreview({ message, mediaUrl, mediaType, mediaCaption, buttons = [] }: MessagePreviewProps) {
  const MediaIcon = mediaType === 'photo' ? FileImage : mediaType === 'video' ? FileVideo : FileText;

  // Group buttons by row
  const rows = buttons.reduce((acc, button) => {
    if (!acc[button.row]) acc[button.row] = [];
    acc[button.row].push(button);
    return acc;
  }, {} as Record<number, typeof buttons>);

  return (
    <Card className="p-0 overflow-hidden max-w-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-xs font-bold">БОТ</span>
        </div>
        <span className="text-sm font-medium">Telegram Bot</span>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800">
        {/* Media */}
        {mediaUrl && (
          <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            {mediaType === 'photo' ? (
              <img src={mediaUrl} alt="Preview" className="w-full h-48 object-cover" />
            ) : (
              <div className="h-48 flex items-center justify-center">
                <MediaIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            {mediaCaption && (
              <div className="p-2 text-xs text-muted-foreground">
                {mediaCaption}
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="text-sm whitespace-pre-wrap mb-3 break-words">
            {message}
          </div>
        )}

        {/* Buttons */}
        {buttons.length > 0 && (
          <div className="space-y-1">
            {Object.entries(rows)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([_, rowButtons]) => (
                <div key={_} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${rowButtons.length}, 1fr)` }}>
                  {rowButtons.map((button, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800"
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
              ))}
          </div>
        )}

        {!message && !mediaUrl && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Сообщение пустое
          </div>
        )}
      </div>
    </Card>
  );
}
