import { FileText, Image, Clock, User, CheckCircle, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ReworkHistoryEntry } from '@/types/pipeline';

interface ReworkHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadNumber: string;
  history: ReworkHistoryEntry[];
}

// Shared component for displaying entry details (read-only)
function ReworkEntryDetails({ entry }: { entry: ReworkHistoryEntry }) {
  return (
    <div className="space-y-3">
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
  );
}

export function ReworkHistoryDialog({ 
  open, 
  onOpenChange, 
  leadNumber, 
  history,
}: ReworkHistoryDialogProps) {
  // Get latest (first) entry and historical entries
  const latestEntry = history[0];
  const historicalEntries = history.slice(1);

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
          <DialogDescription>Lead {leadNumber} - {history.length} rework {history.length === 1 ? 'entry' : 'entries'}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-4">
            {/* Latest Rework Entry */}
            <div className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold bg-orange-500 text-white px-2.5 py-1 rounded">
                    Current: {latestEntry.reasonLabel}
                  </span>
                </div>
                {latestEntry.resolved ? (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Resolved</span>
                  </div>
                ) : null}
              </div>

              <ReworkEntryDetails entry={latestEntry} />
            </div>

            {/* Historical Entries - Expandable Accordion */}
            {historicalEntries.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="history" className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <span>Previous rework history ({historicalEntries.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {historicalEntries.map((entry, index) => (
                        <div
                          key={entry.id}
                          className="border border-border rounded-lg p-3 space-y-3 bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded">
                              #{history.length - index - 1}: {entry.reasonLabel}
                            </span>
                            {entry.resolved && (
                              <div className="flex items-center gap-1.5 text-green-600">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="text-xs">Resolved</span>
                              </div>
                            )}
                          </div>
                          <ReworkEntryDetails entry={entry} />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
