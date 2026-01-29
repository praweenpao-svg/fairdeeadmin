import { 
  FileText, 
  Image, 
  Clock, 
  User, 
  ArrowRight,
  CirclePlus,
  CheckCircle,
  RefreshCw,
  UserPlus,
  CreditCard,
  Truck,
  FileCheck,
  History,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HistoryLogEntry, HistoryActionType, HistoryAttachment } from '@/types/pipeline';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';

interface HistoryLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadNumber: string;
  historyLog: HistoryLogEntry[];
}

// Action type configuration for display
const actionConfig: Record<HistoryActionType, { 
  label: { en: string; th: string }; 
  icon: typeof Clock; 
  color: string;
  bgColor: string;
}> = {
  lead_created: { 
    label: { en: 'Lead Created', th: 'สร้างงานใหม่' }, 
    icon: CirclePlus, 
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  status_changed: { 
    label: { en: 'Status Changed', th: 'เปลี่ยนสถานะ' }, 
    icon: RefreshCw, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  rework_created: { 
    label: { en: 'Rework Created', th: 'สร้างงานติดปัญหา' }, 
    icon: RefreshCw, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  rework_resolved: { 
    label: { en: 'Rework Resolved', th: 'แก้ไขงานติดปัญหาแล้ว' }, 
    icon: CheckCircle, 
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  rework_reassigned: { 
    label: { en: 'Rework Reassigned', th: 'มอบหมายงานติดปัญหาใหม่' }, 
    icon: RefreshCw, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  assignee_changed: { 
    label: { en: 'Assignee Changed', th: 'เปลี่ยนผู้รับผิดชอบ' }, 
    icon: UserPlus, 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  payment_status_changed: { 
    label: { en: 'Payment Updated', th: 'อัพเดทการชำระเงิน' }, 
    icon: CreditCard, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  rf_status_changed: { 
    label: { en: 'RF Status Changed', th: 'เปลี่ยนสถานะ RF' }, 
    icon: RefreshCw, 
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  sc_status_changed: { 
    label: { en: 'SC Status Changed', th: 'เปลี่ยนสถานะ SC' }, 
    icon: RefreshCw, 
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  policy_attached: { 
    label: { en: 'Policy Attached', th: 'แนบกรมธรรม์' }, 
    icon: FileCheck, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  shipping_updated: { 
    label: { en: 'Shipping Updated', th: 'อัพเดทการจัดส่ง' }, 
    icon: Truck, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
};

// Status translations for history log
const statusTranslations: Record<string, { en: string; th: string }> = {
  pending: { en: 'Pending', th: 'รอดำเนินการ' },
  docs_missing: { en: 'Docs Missing', th: 'ขอเอกสารเพิ่มเติม' },
  waiting_for_insurer: { en: 'Waiting for Insurer', th: 'รอเบี้ยจากบริษัทประกัน' },
  partially_added: { en: 'Partially Added', th: 'มีเบี้ยบางส่วนแล้ว' },
  completed: { en: 'Completed', th: 'เสร็จแล้ว' },
  quotation_shared: { en: 'Quotation Shared', th: 'ส่งเบี้ยให้ตัวแทนแล้ว' },
  invalid: { en: 'Invalid', th: 'ปฎิเสธโดย Admin' },
  price_pending: { en: 'Price Pending', th: 'ยังไม่ทราบเบี้ยต่ออายุ' },
  revision_pending: { en: 'Revision Pending', th: 'กำลังต่อรองกับบริษัทประกัน' },
  renewal_rejected: { en: 'Renewal Rejected', th: 'ปฎิเสธการต่ออายุ' },
  price_ready: { en: 'Price Ready', th: 'ได้รับเบี้ยต่ออายุแล้ว' },
  pending_payment: { en: 'Pending', th: 'รอชำระเงิน' },
  pending_review: { en: 'Pending Review', th: 'รอตรวจเอกสาร' },
  under_review: { en: 'Under Review', th: 'กำลังตรวจเอกสาร' },
  de_in_progress: { en: 'DE in Progress', th: 'DE กำลังดำเนินการ' },
  ready_for_de: { en: 'Ready for DE', th: 'พร้อมส่ง DE' },
  pending_issuance: { en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  policy_issued: { en: 'Policy Issued', th: 'กรมธรรม์ออกแล้ว' },
  policy_shipped: { en: 'Policy Shipped', th: 'กรมธรรม์ถูกจัดส่ง' },
  policy_delivered: { en: 'Policy Delivered', th: 'กรมธรรม์จัดส่งสำเร็จ' },
  policy_cancelled: { en: 'Policy Cancelled', th: 'กรมธรรม์ยกเลิก' },
  unpaid: { en: 'Unpaid', th: 'ยังไม่ชำระ' },
  paid: { en: 'Paid', th: 'ชำระแล้ว' },
  partial: { en: 'Partial', th: 'ชำระบางส่วน' },
  transferred: { en: 'Transferred', th: 'โอนแล้ว' },
  claimed: { en: 'Claimed', th: 'รับงานแล้ว' },
};

// Format status label for display with language support
function formatStatusLabel(status: string, language: 'en' | 'th'): string {
  const translation = statusTranslations[status];
  if (translation) {
    return translation[language];
  }
  // Fallback: format the status key
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Rework reason translations
const reworkReasonTranslations: Record<string, { en: string; th: string }> = {
  '1': { en: 'Missing Documents', th: 'เอกสารไม่ครบ' },
  '2': { en: 'Pending Confirmation', th: 'รอยืนยันข้อมูล' },
  '3': { en: 'Pending Verification', th: 'รอตรวจสอบ' },
  '4': { en: 'Pending Initial Payment', th: 'รองวดแรก' },
  '5': { en: 'Pre-submission: Return to AST', th: 'ตีกลับก่อนแจ้งงาน' },
  '6': { en: 'Reverted by Insurer', th: 'บ.ประกันตีกลับ' },
  '7': { en: 'Rejected by Insurer', th: 'บ.ประกันปฎิเสธ' },
  '8': { en: 'Pending Re-submission', th: 'รอแจ้งงานอีกครั้ง' },
  '9': { en: 'Return to OPS', th: 'ตีกลับให้ OPS' },
  '10': { en: 'Submitted to Insurer: Under Review', th: 'แจ้งประกันแล้ว รอพิจารณา' },
  '11': { en: 'Pending Cancellation: Awaiting Documents', th: 'รอแจ้งประกันยกเลิก รอเอกสาร' },
  '12': { en: 'Pending Cancellation: Documents Complete', th: 'รอแจ้งประกันยกเลิก เอกสารครบ' },
};

// Get translated rework reason
function getReworkReasonLabel(reasonId: string | undefined, fallbackLabel: string | undefined, language: 'en' | 'th'): string {
  if (reasonId && reworkReasonTranslations[reasonId]) {
    return reworkReasonTranslations[reasonId][language];
  }
  return fallbackLabel || 'Unknown';
}

// Format assignee type label
function formatAssigneeType(type: string, language: 'en' | 'th'): string {
  const labels: Record<string, { en: string; th: string }> = {
    rf: { en: 'RF Assignee', th: 'ผู้รับผิดชอบ RF' },
    sc: { en: 'SC Assignee', th: 'ผู้รับผิดชอบ SC' },
    de: { en: 'DE Assignee', th: 'ผู้รับผิดชอบ DE' },
    owner: { en: 'Owner', th: 'ผู้รับผิดชอบ' },
  };
  return labels[type]?.[language] || type.toUpperCase();
}

// Action description component with language support
function ActionDescription({ entry, language }: { entry: HistoryLogEntry; language: 'en' | 'th' }) {
  switch (entry.action) {
    case 'lead_created':
      return <span className="text-muted-foreground">{language === 'th' ? 'สร้างงานใหม่' : 'Lead was created'}</span>;
    
    case 'status_changed':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded bg-muted">
            {formatStatusLabel(entry.fromStatus || 'Unknown', language)}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {formatStatusLabel(entry.toStatus || 'Unknown', language)}
          </span>
        </div>
      );
    
    case 'rework_created':
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            {language === 'th' ? 'เหตุผล:' : 'Reason:'} {getReworkReasonLabel(entry.reworkReasonId, entry.reworkReasonLabel, language)}
          </span>
        </div>
      );
    
    case 'rework_resolved':
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs text-green-600 dark:text-green-400">
            {language === 'th' ? 'แก้ไขแล้ว:' : 'Resolved:'} {getReworkReasonLabel(entry.reworkReasonId, entry.reworkReasonLabel, language)}
          </span>
        </div>
      );
    
    case 'rework_reassigned':
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-purple-600 dark:text-purple-400">
            {language === 'th' ? 'เหตุผลใหม่:' : 'New Reason:'} {getReworkReasonLabel(entry.reworkReasonId, entry.reworkReasonLabel, language)}
          </span>
          {entry.toAssignee && (
            <span className="text-xs text-muted-foreground">
              {language === 'th' ? 'มอบหมายให้:' : 'Assigned to:'} {entry.toAssignee}
            </span>
          )}
        </div>
      );
    
    case 'assignee_changed':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {formatAssigneeType(entry.assigneeType || '', language)}:
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-muted">
            {entry.fromAssignee || (language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned')}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {entry.toAssignee || (language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned')}
          </span>
        </div>
      );
    
    case 'payment_status_changed':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded bg-muted">
            {formatStatusLabel(entry.fromStatus || 'Unknown', language)}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
            {formatStatusLabel(entry.toStatus || 'Unknown', language)}
          </span>
        </div>
      );
    
    case 'rf_status_changed':
    case 'sc_status_changed':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded bg-muted">
            {formatStatusLabel(entry.fromStatus || 'Unknown', language)}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {formatStatusLabel(entry.toStatus || 'Unknown', language)}
          </span>
        </div>
      );
    
    case 'policy_attached':
      return <span className="text-muted-foreground">{language === 'th' ? 'แนบกรมธรรม์แล้ว' : 'Policy document was attached'}</span>;
    
    case 'shipping_updated':
      return (
        <span className="text-muted-foreground">
          {language === 'th' ? 'อัพเดทการจัดส่ง:' : 'Shipping updated:'} {formatStatusLabel(entry.toStatus || '', language)}
        </span>
      );
    
    default:
      return null;
  }
}

// Render attachments
function AttachmentsList({ attachments }: { attachments: HistoryAttachment[] }) {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-muted px-2.5 py-1.5 rounded text-xs hover:bg-muted/80 transition-colors"
        >
          {attachment.type === 'pdf' ? (
            <FileText className="w-3.5 h-3.5 text-destructive" />
          ) : (
            <Image className="w-3.5 h-3.5 text-primary" />
          )}
          <span className="max-w-[100px] truncate">{attachment.name}</span>
        </a>
      ))}
    </div>
  );
}

export function HistoryLogDialog({ 
  open, 
  onOpenChange, 
  leadNumber, 
  historyLog,
}: HistoryLogDialogProps) {
  const { language } = useLanguageStore();

  // Sort entries by date (oldest first - Previous -> Latest timeline)
  const sortedLog = [...historyLog].sort((a, b) => {
    return new Date(a.triggeredAt).getTime() - new Date(b.triggeredAt).getTime();
  });

  if (historyLog.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {language === 'th' ? 'ประวัติการทำงาน' : 'History Log'}
            </DialogTitle>
            <DialogDescription>
              {language === 'th' ? 'งาน' : 'Lead'} {leadNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            {language === 'th' ? 'ไม่มีประวัติสำหรับงานนี้' : 'No history log for this lead'}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {language === 'th' ? 'ประวัติการทำงาน' : 'History Log'}
          </DialogTitle>
          <DialogDescription>
            {language === 'th' ? 'งาน' : 'Lead'} {leadNumber} — {historyLog.length} {historyLog.length === 1 ? (language === 'th' ? 'รายการ' : 'event') : (language === 'th' ? 'รายการ' : 'events')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline entries */}
            <div className="space-y-4">
              {sortedLog.map((entry, index) => {
                const config = actionConfig[entry.action];
                const Icon = config.icon;
                
                return (
                  <div key={entry.id} className="relative pl-12">
                    {/* Timeline dot */}
                    <div 
                      className={cn(
                        "absolute left-2.5 w-5 h-5 rounded-full flex items-center justify-center",
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("w-3 h-3", config.color)} />
                    </div>
                    
                    {/* Entry card */}
                    <div 
                      className={cn(
                        "rounded-lg border p-3 space-y-2",
                        index === 0 && "border-primary/30 bg-primary/5"
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded",
                          config.bgColor,
                          config.color
                        )}>
                          {config.label[language]}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{entry.triggeredAt}</span>
                        </div>
                      </div>

                      {/* Triggered by */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{language === 'th' ? 'โดย' : 'By'} {entry.triggeredBy}</span>
                      </div>

                      {/* Action description */}
                      <div className="text-sm">
                        <ActionDescription entry={entry} language={language} />
                      </div>

                      {/* Comment */}
                      {entry.comment && (
                        <div className="bg-muted/50 rounded-md p-2.5 text-xs text-muted-foreground">
                          {entry.comment}
                        </div>
                      )}

                      {/* Attachments */}
                      {entry.attachments && entry.attachments.length > 0 && (
                        <AttachmentsList attachments={entry.attachments} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
