import { useState, useRef } from 'react';
import { Upload, CalendarIcon } from 'lucide-react';
import { format, parse, addDays, startOfDay } from 'date-fns';
import { th as thLocale } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MentionTextarea } from '@/components/ui/mention-textarea';
import { Label } from '@/components/ui/label';
import { SearchableReasonSelect } from '@/components/pipeline/SearchableReasonSelect';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ReworkAttachment, ReworkConfig } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';
import { useMentionNotificationsStore, extractMentions } from '@/stores/mentionNotificationsStore';
import { CURRENT_USER } from '@/data/mockLeads';
import { AttachmentThumbnails } from '@/components/ui/attachment-thumbnails';

interface ReworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reworkConfigs: ReworkConfig[];
  onConfirm: (reasonId: string, details: string, attachments: ReworkAttachment[], autoResolveDate?: string) => void;
  leadNumber?: string;
  policyKind?: 'vmi' | 'cmi';
}

export function ReworkDialog({ open, onOpenChange, reworkConfigs, onConfirm, leadNumber, policyKind }: ReworkDialogProps) {
  const { language } = useLanguageStore();
  const { addNotification } = useMentionNotificationsStore();
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [details, setDetails] = useState('');
  const [attachments, setAttachments] = useState<ReworkAttachment[]>([]);
  const [autoResolveDate, setAutoResolveDate] = useState<Date | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to process mentions and create notifications
  const processMentions = (comment: string) => {
    const mentions = extractMentions(comment);
    mentions.forEach(() => {
      addNotification({
        recipientUserId: mentionedName,
        saleId: leadNumber || 'Unknown',
        mentionTextPreview: comment.slice(0, 80),
        mentionedBy: CURRENT_USER,
        mentionedByUserId: CURRENT_USER,
        mentionedAt: new Date().toISOString(),
        policyType: policyKind === 'vmi' ? 'vmi' : policyKind === 'cmi' ? 'cmi' : undefined,
      });
    });
  };

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
        setAttachments((prev) => [...prev, attachment]);
      }
    });

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Check if selected reason is auto-resolve type
  const selectedConfig = reworkConfigs.find(c => c.id === selectedReasonId);
  const isAutoResolve = selectedConfig?.automationEnabled && selectedConfig?.automationType === 'auto_resolve';

  const handleConfirm = () => {
    if (!selectedReasonId) return;
    if (details.trim()) {
      processMentions(details.trim());
    }
    const resolveDate = isAutoResolve && autoResolveDate 
      ? format(autoResolveDate, 'dd/MM/yyyy') 
      : undefined;
    onConfirm(selectedReasonId, details, attachments, resolveDate);
    setSelectedReasonId('');
    setDetails('');
    setAttachments([]);
    setAutoResolveDate(undefined);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedReasonId('');
    setDetails('');
    setAttachments([]);
    setAutoResolveDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{language === 'th' ? 'รายละเอียดงานติดปัญหา' : 'Rework Details'}</DialogTitle>
          <DialogDescription>
            {language === 'th' ? 'เลือกเหตุผลและระบุรายละเอียดเพิ่มเติม' : 'Select a rework reason and provide additional details.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{language === 'th' ? 'เหตุผล' : 'Rework Reason'}</Label>
            <SearchableReasonSelect
              configs={(() => {
                const reworkOnly = reworkConfigs.filter(c => c.configType === 'rework');
                return policyKind 
                  ? reworkOnly.filter(c => c.policyScope === 'both' || c.policyScope === policyKind)
                  : reworkOnly;
              })()}
              value={selectedReasonId}
              onValueChange={setSelectedReasonId}
            />
          </div>

          {/* Auto-Resolve Date Picker */}
          {isAutoResolve && (
            <div className="space-y-2">
              <Label>{language === 'th' ? 'วันที่ Auto-Resolve' : 'Auto-Resolve Date'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !autoResolveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {autoResolveDate
                      ? format(autoResolveDate, 'd MMM yyyy', language === 'th' ? { locale: thLocale } : undefined)
                      : (language === 'th' ? 'เลือกวันที่' : 'Select date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <Calendar
                    mode="single"
                    selected={autoResolveDate}
                    onSelect={setAutoResolveDate}
                    disabled={(date) => date <= startOfDay(new Date())}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="details">{language === 'th' ? 'รายละเอียดเพิ่มเติม' : 'Rework reason details'}</Label>
            <MentionTextarea
              placeholder={language === 'th' ? 'ใส่รายละเอียดเพิ่มเติม... (พิมพ์ @ เพื่อ tag คน)' : 'Enter detailed reason for rework... (type @ to tag someone)'}
              value={details}
              onChange={setDetails}
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <AttachmentThumbnails
              attachments={attachments} 
              onRemove={removeAttachment}
              size="md"
            />
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
              className="mt-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              {language === 'th' ? 'แนบไฟล์ (PNG, JPG, PDF)' : 'Attach files (PNG, JPG, PDF)'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedReasonId}>
            {language === 'th' ? 'ยืนยัน' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
