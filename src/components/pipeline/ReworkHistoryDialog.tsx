import { FileText, Image, Clock, User, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ReworkHistoryEntry } from '@/types/pipeline';

interface ReworkHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadNumber: string;
  history: ReworkHistoryEntry[];
  onResolve?: (entryId: string) => void;
}

export function ReworkHistoryDialog({ 
  open, 
  onOpenChange, 
  leadNumber, 
  history,
  onResolve 
}: ReworkHistoryDialogProps) {
  if (history.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rework history</DialogTitle>
            <DialogDescription>Lead {leadNumber}</DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            No rework history for this lead
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rework history</DialogTitle>
          <DialogDescription>Lead {leadNumber} - {history.length} rework entries</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium bg-orange-500 text-white px-2 py-1 rounded">
                    #{history.length - index}: {entry.reasonLabel}
                  </span>
                  {entry.resolved ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Resolved</span>
                    </div>
                  ) : (
                    onResolve && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                        onClick={() => onResolve(entry.id)}
                      >
                        Resolve
                      </Button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{entry.savedBy}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{entry.savedAt}</span>
                  </div>
                </div>

                {entry.resolved && entry.resolvedAt && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1.5 rounded">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolved by {entry.resolvedBy} on {entry.resolvedAt}</span>
                  </div>
                )}

                {entry.details && (
                  <div className="bg-muted/50 rounded-md p-3 text-sm">
                    {entry.details}
                  </div>
                )}

                {entry.attachments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Attachments:</span>
                    <div className="flex flex-wrap gap-2">
                      {entry.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md text-xs hover:bg-muted/80 transition-colors"
                        >
                          {attachment.type === 'pdf' ? (
                            <FileText className="w-4 h-4 text-destructive" />
                          ) : (
                            <Image className="w-4 h-4 text-primary" />
                          )}
                          <span className="max-w-[120px] truncate">{attachment.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
