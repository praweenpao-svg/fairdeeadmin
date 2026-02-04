import { useState, useRef } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { ReworkAttachment, ReworkConfig } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';

interface ReworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reworkConfigs: ReworkConfig[];
  onConfirm: (reasonId: string, details: string, attachments: ReworkAttachment[]) => void;
}

export function ReworkDialog({ open, onOpenChange, reworkConfigs, onConfirm }: ReworkDialogProps) {
  const { language } = useLanguageStore();
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [details, setDetails] = useState('');
  const [attachments, setAttachments] = useState<ReworkAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleConfirm = () => {
    if (!selectedReasonId) return;
    onConfirm(selectedReasonId, details, attachments);
    setSelectedReasonId('');
    setDetails('');
    setAttachments([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedReasonId('');
    setDetails('');
    setAttachments([]);
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
            <Select value={selectedReasonId} onValueChange={setSelectedReasonId}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'th' ? 'เลือกเหตุผล' : 'Select rework reason'} />
              </SelectTrigger>
              <SelectContent>
                {reworkConfigs.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {language === 'th' ? config.descriptionTh : config.descriptionEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">{language === 'th' ? 'รายละเอียดเพิ่มเติม' : 'Rework reason details'}</Label>
            <Textarea
              id="details"
              placeholder={language === 'th' ? 'ใส่รายละเอียดเพิ่มเติม...' : 'Enter detailed reason for rework...'}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'th' ? 'ไฟล์แนบ' : 'Attachments'}</Label>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md text-sm"
                >
                  {attachment.type === 'pdf' ? (
                    <FileText className="w-4 h-4 text-destructive" />
                  ) : (
                    <Image className="w-4 h-4 text-primary" />
                  )}
                  <span className="max-w-[120px] truncate">{attachment.name}</span>
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
