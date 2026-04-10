import React, { useState, useRef } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Paperclip, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Attachment {
  id: string;
  name: string;
  size: string;
  isDefault?: boolean;
}

// Team quotation email list
const SENDER_EMAILS = [
  { label: 'FM AST+', value: 'mlm_astplus_quotation@fairdee.co.th' },
  { label: 'FM KAM', value: 'mlm_kam_quotation@fairdee.co.th' },
  { label: 'FM AST', value: 'mlm_rfsc_quotation@fairdee.co.th' },
  { label: 'FD', value: 'fd_quotation@fairdee.co.th' },
  { label: 'IG/AO', value: 'aoig_quotation@fairdee.co.th' },
];

const RENEWAL_NOTICE_ATTACHMENT: Attachment = {
  id: 'renewal-notice-default',
  name: 'Renewal_Notice.pdf',
  size: '124.0 KB',
  isDefault: true,
};

interface PreSendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultSubject: string;
  defaultBody: string;
  leadNumber?: string;
  onSend?: () => void;
  /** Pre-attach a renewal notice PDF */
  includeRenewalNotice?: boolean;
  /** Hide the sender (From) row by default */
  hideSenderByDefault?: boolean;
}

export function PreSendEmailModal({
  open,
  onOpenChange,
  title,
  defaultSubject,
  defaultBody,
  leadNumber,
  onSend,
  includeRenewalNotice = false,
  hideSenderByDefault = false,
}: PreSendEmailModalProps) {
  const { language } = useLanguageStore();
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [senderEmail, setSenderEmail] = useState(SENDER_EMAILS[2].value);
  const [showSender, setShowSender] = useState(!hideSenderByDefault);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset when modal opens
  React.useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setBody(defaultBody);
      setSenderEmail(SENDER_EMAILS[2].value);
      setShowSender(!hideSenderByDefault);
      // Set default attachments
      if (includeRenewalNotice) {
        setAttachments([{ ...RENEWAL_NOTICE_ATTACHMENT }]);
      } else {
        setAttachments([]);
      }
    }
  }, [open, defaultSubject, defaultBody, includeRenewalNotice, hideSenderByDefault]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(f => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    if (e.target) e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = () => {
    onOpenChange(false);
    onSend?.();
    toast.success(
      language === 'th' ? 'ส่งอีเมลเรียบร้อยแล้ว' : 'Email sent successfully',
      {
        description: language === 'th'
          ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต'
          : 'This will connect to the real system.',
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {title}
            {leadNumber && (
              <span className="text-muted-foreground font-normal ml-2">#{leadNumber}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sender - collapsible */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setShowSender(prev => !prev)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSender ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {language === 'th' ? 'ส่งจาก' : 'From'}
              {!showSender && (
                <span className="ml-1 text-[10px] text-muted-foreground/70">
                  ({SENDER_EMAILS.find(s => s.value === senderEmail)?.label || 'FM AST'})
                </span>
              )}
            </button>
            {showSender && (
              <Select value={senderEmail} onValueChange={setSenderEmail}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENDER_EMAILS.map(sender => (
                    <SelectItem key={sender.value} value={sender.value} className="text-xs">
                      {sender.label} — {sender.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs">{language === 'th' ? 'หัวข้ออีเมล' : 'Email Subject'}</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs h-9"
              placeholder={language === 'th' ? 'กรอกหัวข้ออีเมล' : 'Enter email subject'}
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label className="text-xs">{language === 'th' ? 'เนื้อหาอีเมล' : 'Email Body'}</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="text-xs min-h-[160px]"
              placeholder={language === 'th' ? 'กรอกเนื้อหาอีเมล' : 'Enter email body'}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-1.5">
            <Label className="text-xs">{language === 'th' ? 'ไฟล์แนบ' : 'Attachments'}</Label>
            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between px-2 py-1.5 bg-muted/30 rounded-md border border-border">
                    <div className="flex items-center gap-2">
                      {att.isDefault ? (
                        <FileText className="w-3 h-3 text-destructive" />
                      ) : (
                        <Paperclip className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-[11px] font-medium">{att.name}</span>
                      <span className="text-[10px] text-muted-foreground">({att.size})</span>
                      {att.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                          {language === 'th' ? 'แนบอัตโนมัติ' : 'Auto-attached'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-3 h-3" />
              {language === 'th' ? 'แนบไฟล์' : 'Attach File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button size="sm" className="text-xs" onClick={handleSend} disabled={!subject.trim()}>
            {language === 'th' ? 'ส่งอีเมล' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
