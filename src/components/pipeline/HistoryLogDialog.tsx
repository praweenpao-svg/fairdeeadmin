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

// Format status label for display
function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Format assignee type label
function formatAssigneeType(type: string, language: 'en' | 'th'): string {
  const labels: Record<string, { en: string; th: string }> = {
    rf: { en: 'RF Assignee', th: 'ผู้รับผิดชอบ RF' },
    sc: { en: 'SC Assignee', th: 'ผู้รับผิดชอบ SC' },
    de: { en: 'DE Assignee', th: 'ผู้รับผิดชอบ DE' },
    owner: { en: 'Owner', th: 'เจ้าของงาน' },
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
            {formatStatusLabel(entry.fromStatus || 'Unknown')}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {formatStatusLabel(entry.toStatus || 'Unknown')}
          </span>
        </div>
      );
    
    case 'rework_created':
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            {language === 'th' ? 'เหตุผล:' : 'Reason:'} {entry.reworkReasonLabel}
          </span>
        </div>
      );
    
    case 'rework_resolved':
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs text-green-600 dark:text-green-400">
            {language === 'th' ? 'แก้ไขแล้ว:' : 'Resolved:'} {entry.reworkReasonLabel}
          </span>
        </div>
      );
    
    case 'rework_reassigned':
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-purple-600 dark:text-purple-400">
            {language === 'th' ? 'เหตุผลใหม่:' : 'New Reason:'} {entry.reworkReasonLabel}
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
            {formatStatusLabel(entry.fromStatus || 'Unknown')}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
            {formatStatusLabel(entry.toStatus || 'Unknown')}
          </span>
        </div>
      );
    
    case 'rf_status_changed':
    case 'sc_status_changed':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded bg-muted">
            {formatStatusLabel(entry.fromStatus || 'Unknown')}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {formatStatusLabel(entry.toStatus || 'Unknown')}
          </span>
        </div>
      );
    
    case 'policy_attached':
      return <span className="text-muted-foreground">{language === 'th' ? 'แนบกรมธรรม์แล้ว' : 'Policy document was attached'}</span>;
    
    case 'shipping_updated':
      return (
        <span className="text-muted-foreground">
          {language === 'th' ? 'อัพเดทการจัดส่ง:' : 'Shipping updated:'} {formatStatusLabel(entry.toStatus || '')}
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

  // Sort entries by date (newest first)
  const sortedLog = [...historyLog].sort((a, b) => {
    // Try to parse dates for proper sorting
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
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
                        <span>{entry.triggeredBy}</span>
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
