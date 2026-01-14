import { useState, useRef } from 'react';
import { FileText, Image, Clock, User, CheckCircle, ArrowRight, ChevronLeft, Upload, X, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ReworkHistoryEntry, ReworkConfig, ReworkAttachment } from '@/types/pipeline';

interface ReworkHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadNumber: string;
  history: ReworkHistoryEntry[];
  reworkConfigs: ReworkConfig[];
  onResolve?: (entryId: string) => void;
  onReassign?: (entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => void;
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
  reworkConfigs,
  onResolve,
  onReassign,
}: ReworkHistoryDialogProps) {
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedNewReasonId, setSelectedNewReasonId] = useState<string>('');
  const [reassignDetails, setReassignDetails] = useState('');
  const [reassignAttachments, setReassignAttachments] = useState<ReworkAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get latest (first) entry and historical entries
  const latestEntry = history[0];
  const historicalEntries = history.slice(1);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'pdf') {
        const attachment: ReworkAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: ext === 'jpeg' ? 'jpg' : (ext as 'png' | 'jpg' | 'pdf'),
          url: URL.createObjectURL(file),
        };
        setReassignAttachments((prev) => [...prev, attachment]);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setReassignAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReassignConfirm = () => {
    if (latestEntry && selectedNewReasonId && onReassign) {
      onReassign(latestEntry.id, selectedNewReasonId, reassignDetails, reassignAttachments);
      setIsReassigning(false);
      setSelectedNewReasonId('');
      setReassignDetails('');
      setReassignAttachments([]);
    }
  };

  const handleCancelReassign = () => {
    setIsReassigning(false);
    setSelectedNewReasonId('');
    setReassignDetails('');
    setReassignAttachments([]);
  };

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
            {/* Latest Rework Entry - Prominent with Actions */}
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

              {/* Actions Section - Only for latest, unresolved entry */}
              {!latestEntry.resolved && (onReassign || onResolve) && !isReassigning && (
                <div className="flex items-center gap-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                  {onReassign && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setIsReassigning(true)}
                    >
                      Reassign
                    </Button>
                  )}
                  {onResolve && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                      onClick={() => onResolve(latestEntry.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              )}

              {/* Reassign Form - Inline */}
              {isReassigning && (
                <div className="space-y-4 pt-2 border-t border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={handleCancelReassign}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium">Reassign rework</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select new reason</Label>
                    <Select value={selectedNewReasonId} onValueChange={setSelectedNewReasonId}>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {reworkConfigs
                          .filter((config) => config.id !== latestEntry.reasonId)
                          .map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.descriptionEn}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reassign-details">Rework reason details</Label>
                    <Textarea
                      id="reassign-details"
                      placeholder="Enter detailed reason for rework..."
                      value={reassignDetails}
                      onChange={(e) => setReassignDetails(e.target.value)}
                      className="min-h-[80px] resize-none bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="flex flex-wrap gap-2">
                      {reassignAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 bg-background px-3 py-2 rounded-md text-sm"
                        >
                          {attachment.type === 'pdf' ? (
                            <FileText className="w-4 h-4 text-destructive" />
                          ) : (
                            <Image className="w-4 h-4 text-primary" />
                          )}
                          <span className="max-w-[100px] truncate">{attachment.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 bg-background"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Attach files
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={handleCancelReassign}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReassignConfirm}
                      disabled={!selectedNewReasonId}
                      className="gap-1"
                    >
                      Reassign
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
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
