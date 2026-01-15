import { useState, useRef } from 'react';
import { CheckCircle, ArrowRightLeft, Upload, X, FileText, Image } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ReworkConfig, ReworkAttachment, ReworkHistoryEntry } from '@/types/pipeline';

interface InlineReworkActionsProps {
  latestEntry: ReworkHistoryEntry;
  reworkConfigs: ReworkConfig[];
  onResolve: (entryId: string) => void;
  onReassign: (entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => void;
}

export function InlineReworkActions({
  latestEntry,
  reworkConfigs,
  onResolve,
  onReassign,
}: InlineReworkActionsProps) {
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedNewReasonId, setSelectedNewReasonId] = useState<string>('');
  const [reassignDetails, setReassignDetails] = useState('');
  const [reassignAttachments, setReassignAttachments] = useState<ReworkAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If already resolved, don't show actions
  if (latestEntry.resolved) {
    return null;
  }

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
    if (selectedNewReasonId) {
      onReassign(latestEntry.id, selectedNewReasonId, reassignDetails, reassignAttachments);
      setReassignOpen(false);
      setSelectedNewReasonId('');
      setReassignDetails('');
      setReassignAttachments([]);
    }
  };

  const handleCancelReassign = () => {
    setReassignOpen(false);
    setSelectedNewReasonId('');
    setReassignDetails('');
    setReassignAttachments([]);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Resolve Button */}
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={() => onResolve(latestEntry.id)}
      >
        <CheckCircle className="w-3.5 h-3.5 mr-1" />
        Resolve
      </Button>

      {/* Reassign Popover */}
      <Popover open={reassignOpen} onOpenChange={setReassignOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
            Reassign
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="text-sm font-medium">Reassign rework</div>
            
            <div className="space-y-2">
              <Label className="text-xs">Select new reason</Label>
              <Select value={selectedNewReasonId} onValueChange={setSelectedNewReasonId}>
                <SelectTrigger className="w-full text-xs">
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
              <Label className="text-xs">Details (optional)</Label>
              <Textarea
                placeholder="Enter detailed reason..."
                value={reassignDetails}
                onChange={(e) => setReassignDetails(e.target.value)}
                className="min-h-[60px] resize-none text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Attachments</Label>
              <div className="flex flex-wrap gap-1.5">
                {reassignAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs"
                  >
                    {attachment.type === 'pdf' ? (
                      <FileText className="w-3 h-3 text-destructive" />
                    ) : (
                      <Image className="w-3 h-3 text-primary" />
                    )}
                    <span className="max-w-[80px] truncate">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
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
                className="h-7 text-xs"
              >
                <Upload className="w-3 h-3 mr-1.5" />
                Attach files
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancelReassign}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleReassignConfirm}
                disabled={!selectedNewReasonId}
              >
                Reassign
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
