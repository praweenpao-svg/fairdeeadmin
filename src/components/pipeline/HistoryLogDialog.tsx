import { 
  Clock, 
  User, 
  ArrowRight,
  History,
  CreditCard,
  UserPlus,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PolicyRecord, Lead } from '@/types/pipeline';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';

interface HistoryLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadNumber: string;
  lead: Lead;
}

// Types of history entries we want to show
type DisplayableAction = 'status_changed' | 'payment_status_changed' | 'endorsement_status_changed' | 'assignee_changed';

// Status translations
const statusTranslations: Record<string, { en: string; th: string }> = {
  // Policy statuses
  pending_payment: { en: 'Pending Payment', th: 'รอชำระเงิน' },
  pending_review: { en: 'Pending Review', th: 'รอตรวจเอกสาร' },
  pending_issuance: { en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  policy_issued: { en: 'Policy Issued', th: 'กรมธรรม์ออกแล้ว' },
  policy_shipped: { en: 'Policy Shipped', th: 'กรมธรรม์ถูกจัดส่ง' },
  policy_delivered: { en: 'Policy Delivered', th: 'กรมธรรม์จัดส่งสำเร็จ' },
  policy_cancelled: { en: 'Policy Cancelled', th: 'กรมธรรม์ยกเลิก' },
  rework_required: { en: 'Rework Required', th: 'ต้องแก้ไข' },
  // Payment statuses
  unpaid: { en: 'Unpaid', th: 'ยังไม่ชำระ' },
  paid: { en: 'Paid', th: 'ชำระแล้ว' },
  partial: { en: 'Partial', th: 'ชำระบางส่วน' },
  // Endorsement statuses
  request_created: { en: 'Request Created', th: 'สร้างคำขอ' },
  request_submitted: { en: 'Request Submitted', th: 'ส่งคำขอแล้ว' },
  request_approved: { en: 'Request Approved', th: 'คำขออนุมัติแล้ว' },
  pending_on_ops: { en: 'Pending on OPS', th: 'รอ OPS' },
  pending_finance: { en: 'Pending Finance', th: 'รอการเงิน' },
  invalid: { en: 'Invalid', th: 'ไม่ถูกต้อง' },
};

function formatStatusLabel(status: string, language: 'en' | 'th'): string {
  const translation = statusTranslations[status];
  if (translation) return translation[language];
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatAssigneeType(type: string, language: 'en' | 'th'): string {
  const labels: Record<string, { en: string; th: string }> = {
    rf: { en: 'RF', th: 'RF' },
    sc: { en: 'SC', th: 'SC' },
    de: { en: 'DE', th: 'DE' },
  };
  return labels[type]?.[language] || type.toUpperCase();
}

// Check if triggeredBy is a system/automated action
function isSystemTriggered(triggeredBy: string): boolean {
  const systemTriggers = ['system', 'payment system', 'system (round robin)', 'auto'];
  return systemTriggers.some(trigger => triggeredBy.toLowerCase().includes(trigger));
}

// Unified timeline entry for display
interface TimelineEntry {
  id: string;
  timestamp: string;
  action: DisplayableAction;
  triggeredBy: string;
  fromStatus?: string;
  toStatus?: string;
  assigneeType?: string;
  fromAssignee?: string;
  toAssignee?: string;
  policyKind?: 'vmi' | 'cmi'; // undefined means it applies to the whole sale
}

// Get icon and colors for action type
function getActionConfig(action: DisplayableAction) {
  switch (action) {
    case 'status_changed':
      return { icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
    case 'payment_status_changed':
      return { icon: CreditCard, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' };
    case 'endorsement_status_changed':
      return { icon: FileCheck, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' };
    case 'assignee_changed':
      return { icon: UserPlus, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' };
  }
}

function getActionLabel(action: DisplayableAction, language: 'en' | 'th'): string {
  const labels: Record<DisplayableAction, { en: string; th: string }> = {
    status_changed: { en: 'Status Changed', th: 'เปลี่ยนสถานะ' },
    payment_status_changed: { en: 'Payment Updated', th: 'อัพเดทการชำระเงิน' },
    endorsement_status_changed: { en: 'Endorsement Updated', th: 'อัพเดทเอกสารแนบท้าย' },
    assignee_changed: { en: 'Assignee Changed', th: 'เปลี่ยนผู้รับผิดชอบ' },
  };
  return labels[action][language];
}

// Extract timeline entries from a policy's history log
function extractPolicyTimeline(policy: PolicyRecord): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const historyLog = policy.historyLog || [];
  
  for (const entry of historyLog) {
    // Only include displayable actions (exclude rework-related)
    if (entry.action === 'status_changed') {
      entries.push({
        id: entry.id,
        timestamp: entry.triggeredAt,
        action: 'status_changed',
        triggeredBy: entry.triggeredBy,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        policyKind: policy.kind,
      });
    }
  }
  
  return entries;
}

// Build unified timeline from lead data
function buildTimeline(lead: Lead): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const vmiPolicy = lead.policyRecords?.find(p => p.kind === 'vmi');
  const cmiPolicy = lead.policyRecords?.find(p => p.kind === 'cmi');
  
  // Add VMI history
  if (vmiPolicy) {
    entries.push(...extractPolicyTimeline(vmiPolicy));
  }
  
  // Add CMI history
  if (cmiPolicy) {
    entries.push(...extractPolicyTimeline(cmiPolicy));
  }
  
  // Add lead-level assignee changes (RF/SC/DE)
  const leadHistory = lead.historyLog || [];
  for (const entry of leadHistory) {
    if (entry.action === 'assignee_changed' && entry.assigneeType) {
      entries.push({
        id: entry.id,
        timestamp: entry.triggeredAt,
        action: 'assignee_changed',
        triggeredBy: entry.triggeredBy,
        assigneeType: entry.assigneeType,
        fromAssignee: entry.fromAssignee,
        toAssignee: entry.toAssignee,
        policyKind: undefined, // Applies to whole sale
      });
    }
    
    // Add payment status changes
    if (entry.action === 'payment_status_changed') {
      entries.push({
        id: entry.id,
        timestamp: entry.triggeredAt,
        action: 'payment_status_changed',
        triggeredBy: entry.triggeredBy,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        policyKind: undefined, // Applies to whole sale
      });
    }
  }
  
  // Sort by timestamp (oldest first)
  entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  return entries;
}

// Group entries by timestamp for merging
interface TimelineRow {
  timestamp: string;
  vmiEntry?: TimelineEntry;
  cmiEntry?: TimelineEntry;
  sharedEntry?: TimelineEntry; // For entries that apply to both or are merged
}

function buildTimelineRows(entries: TimelineEntry[], hasVmi: boolean, hasCmi: boolean): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const timestampGroups = new Map<string, TimelineEntry[]>();
  
  // Group by timestamp
  for (const entry of entries) {
    const existing = timestampGroups.get(entry.timestamp) || [];
    existing.push(entry);
    timestampGroups.set(entry.timestamp, existing);
  }
  
  // Process each timestamp group
  const sortedTimestamps = Array.from(timestampGroups.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  
  for (const timestamp of sortedTimestamps) {
    const group = timestampGroups.get(timestamp)!;
    const row: TimelineRow = { timestamp };
    
    // Check if entries should be merged (same action, same from/to status, same time)
    const vmiEntries = group.filter(e => e.policyKind === 'vmi');
    const cmiEntries = group.filter(e => e.policyKind === 'cmi');
    const sharedEntries = group.filter(e => e.policyKind === undefined);
    
    // If there's a shared entry (payment, assignee), it spans both columns
    if (sharedEntries.length > 0) {
      row.sharedEntry = sharedEntries[0];
    }
    // Check if VMI and CMI have matching entries (merge them)
    else if (vmiEntries.length > 0 && cmiEntries.length > 0) {
      const vmi = vmiEntries[0];
      const cmi = cmiEntries[0];
      
      // If both have same action and same status transition, merge
      if (vmi.action === cmi.action && 
          vmi.fromStatus === cmi.fromStatus && 
          vmi.toStatus === cmi.toStatus) {
        row.sharedEntry = { ...vmi, policyKind: undefined };
      } else {
        row.vmiEntry = vmi;
        row.cmiEntry = cmi;
      }
    }
    // Only VMI entry
    else if (vmiEntries.length > 0) {
      row.vmiEntry = vmiEntries[0];
    }
    // Only CMI entry
    else if (cmiEntries.length > 0) {
      row.cmiEntry = cmiEntries[0];
    }
    
    rows.push(row);
  }
  
  return rows;
}

// Format timestamp to DD-MM-YYYY HH:MM
function formatTimestamp(timestamp: string): string {
  const [datePart, timePart] = timestamp.split(' ');
  if (!datePart) return timestamp;
  // datePart is already in DD-MM-YYYY format
  return timePart ? `${datePart} ${timePart}` : datePart;
}

// Timeline entry card component with timestamp inside
function EntryCard({ 
  entry, 
  language,
  isLast,
  columnType,
}: { 
  entry: TimelineEntry; 
  language: 'en' | 'th';
  isLast?: boolean;
  columnType?: 'vmi' | 'cmi' | 'shared';
}) {
  const config = getActionConfig(entry.action);
  const Icon = config.icon;
  const showTriggeredBy = !isSystemTriggered(entry.triggeredBy);
  
  // Determine border color based on column type
  const getBorderClass = () => {
    if (columnType === 'vmi') return 'border-l-2 border-l-blue-500';
    if (columnType === 'cmi') return 'border-l-2 border-l-purple-500';
    return 'border-l-2 border-l-primary';
  };
  
  return (
    <div className={cn(
      "rounded-r-lg border border-l-0 p-2.5 space-y-1.5 bg-card",
      getBorderClass()
    )}>
      {/* Timestamp */}
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span className="font-medium">{formatTimestamp(entry.timestamp)}</span>
      </div>
      
      {/* Action badge */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1",
          config.bgColor,
          config.color
        )}>
          <Icon className="w-2.5 h-2.5" />
          {getActionLabel(entry.action, language)}
        </span>
      </div>
      
      {/* Content based on action type */}
      {entry.action === 'status_changed' && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
            {formatStatusLabel(entry.fromStatus || '', language)}
          </span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {formatStatusLabel(entry.toStatus || '', language)}
          </span>
        </div>
      )}
      
      {entry.action === 'payment_status_changed' && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
            {formatStatusLabel(entry.fromStatus || '', language)}
          </span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
            {formatStatusLabel(entry.toStatus || '', language)}
          </span>
        </div>
      )}
      
      {entry.action === 'endorsement_status_changed' && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
            {formatStatusLabel(entry.fromStatus || '', language)}
          </span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium">
            {formatStatusLabel(entry.toStatus || '', language)}
          </span>
        </div>
      )}
      
      {entry.action === 'assignee_changed' && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            {formatAssigneeType(entry.assigneeType || '', language)}:
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
            {entry.fromAssignee || (language === 'th' ? 'ไม่มี' : 'None')}
          </span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {entry.toAssignee || (language === 'th' ? 'ไม่มี' : 'None')}
          </span>
        </div>
      )}
      
      {/* Triggered by - only show if not system */}
      {showTriggeredBy && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <User className="w-2.5 h-2.5" />
          <span>{entry.triggeredBy}</span>
        </div>
      )}
    </div>
  );
}

// Column with connecting line
function TimelineColumn({ 
  children, 
  colorClass,
  hasContent,
  isLast,
}: { 
  children: React.ReactNode;
  colorClass: string;
  hasContent: boolean;
  isLast: boolean;
}) {
  return (
    <div className="relative flex-1">
      {/* Vertical connecting line */}
      {!isLast && (
        <div className={cn(
          "absolute left-0 top-full w-0.5 h-2",
          colorClass
        )} />
      )}
      {hasContent ? children : <div className="h-full min-h-[60px]" />}
    </div>
  );
}

export function HistoryLogDialog({ 
  open, 
  onOpenChange, 
  leadNumber, 
  lead,
}: HistoryLogDialogProps) {
  const { language } = useLanguageStore();
  
  const hasVmi = lead.policyRecords?.some(p => p.kind === 'vmi') || false;
  const hasCmi = lead.policyRecords?.some(p => p.kind === 'cmi') || false;
  const isTwoColumn = hasVmi && hasCmi;
  
  // Build timeline
  const entries = buildTimeline(lead);
  const rows = buildTimelineRows(entries, hasVmi, hasCmi);
  
  if (rows.length === 0) {
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
      <DialogContent className={cn(
        "max-h-[85vh]",
        isTwoColumn ? "sm:max-w-[650px]" : "sm:max-w-[400px]"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {language === 'th' ? 'ประวัติการทำงาน' : 'History Log'}
          </DialogTitle>
          <DialogDescription>
            {language === 'th' ? 'งาน' : 'Lead'} {leadNumber} — {rows.length} {rows.length === 1 ? (language === 'th' ? 'รายการ' : 'event') : (language === 'th' ? 'รายการ' : 'events')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {/* Column headers for two-column layout */}
          {isTwoColumn && (
            <div className="grid grid-cols-2 gap-2 mb-2 sticky top-0 bg-background pb-2 z-10">
              <div className="text-xs font-semibold text-center px-2 py-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                VMI
              </div>
              <div className="text-xs font-semibold text-center px-2 py-1.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                CMI
              </div>
            </div>
          )}
          
          {/* Timeline rows - no gap, connected */}
          <div className="pr-4">
            {rows.map((row, index) => {
              const isLast = index === rows.length - 1;
              
              if (isTwoColumn) {
                // Shared entry spans both columns
                if (row.sharedEntry) {
                  return (
                    <div key={row.timestamp + index} className="relative">
                      {/* Connecting line from previous row */}
                      {index > 0 && (
                        <div className="absolute left-0 right-0 top-0 h-2 flex">
                          <div className="flex-1 flex justify-center">
                            <div className="w-0.5 h-full bg-blue-500" />
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div className="w-0.5 h-full bg-purple-500" />
                          </div>
                        </div>
                      )}
                      <div className={cn(index > 0 && "pt-2")}>
                        <div className="border-l-2 border-l-primary rounded-r-lg border border-l-0 p-2.5 space-y-1.5 bg-gradient-to-r from-blue-50/50 via-background to-purple-50/50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
                          {/* Timestamp */}
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">{formatTimestamp(row.sharedEntry.timestamp)}</span>
                          </div>
                          
                          {/* Action badge */}
                          <div className="flex items-center gap-2">
                            {(() => {
                              const config = getActionConfig(row.sharedEntry.action);
                              const Icon = config.icon;
                              return (
                                <span className={cn(
                                  "text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1",
                                  config.bgColor,
                                  config.color
                                )}>
                                  <Icon className="w-2.5 h-2.5" />
                                  {getActionLabel(row.sharedEntry.action, language)}
                                </span>
                              );
                            })()}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              VMI + CMI
                            </span>
                          </div>
                          
                          {/* Content */}
                          {row.sharedEntry.action === 'payment_status_changed' && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                                {formatStatusLabel(row.sharedEntry.fromStatus || '', language)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                                {formatStatusLabel(row.sharedEntry.toStatus || '', language)}
                              </span>
                            </div>
                          )}
                          
                          {row.sharedEntry.action === 'assignee_changed' && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground">
                                {formatAssigneeType(row.sharedEntry.assigneeType || '', language)}:
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                                {row.sharedEntry.fromAssignee || (language === 'th' ? 'ไม่มี' : 'None')}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                {row.sharedEntry.toAssignee || (language === 'th' ? 'ไม่มี' : 'None')}
                              </span>
                            </div>
                          )}
                          
                          {row.sharedEntry.action === 'status_changed' && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                                {formatStatusLabel(row.sharedEntry.fromStatus || '', language)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                {formatStatusLabel(row.sharedEntry.toStatus || '', language)}
                              </span>
                            </div>
                          )}
                          
                          {/* Triggered by - only show if not system */}
                          {!isSystemTriggered(row.sharedEntry.triggeredBy) && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <User className="w-2.5 h-2.5" />
                              <span>{row.sharedEntry.triggeredBy}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Connecting line to next row */}
                      {!isLast && (
                        <div className="h-2 flex">
                          <div className="flex-1 flex justify-center">
                            <div className="w-0.5 h-full bg-blue-500" />
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div className="w-0.5 h-full bg-purple-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Separate VMI and CMI columns
                return (
                  <div key={row.timestamp + index} className="relative">
                    {/* Connecting lines from previous row */}
                    {index > 0 && (
                      <div className="h-2 flex gap-2">
                        <div className="flex-1 flex justify-start pl-0">
                          <div className="w-0.5 h-full bg-blue-500" />
                        </div>
                        <div className="flex-1 flex justify-start pl-0">
                          <div className="w-0.5 h-full bg-purple-500" />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* VMI column */}
                      <div className="relative">
                        {row.vmiEntry ? (
                          <EntryCard 
                            entry={row.vmiEntry} 
                            language={language} 
                            isLast={isLast}
                            columnType="vmi"
                          />
                        ) : (
                          <div className="min-h-[60px] border-l-2 border-l-blue-200 dark:border-l-blue-800 border-dashed" />
                        )}
                      </div>
                      
                      {/* CMI column */}
                      <div className="relative">
                        {row.cmiEntry ? (
                          <EntryCard 
                            entry={row.cmiEntry} 
                            language={language} 
                            isLast={isLast}
                            columnType="cmi"
                          />
                        ) : (
                          <div className="min-h-[60px] border-l-2 border-l-purple-200 dark:border-l-purple-800 border-dashed" />
                        )}
                      </div>
                    </div>
                    
                    {/* Connecting lines to next row */}
                    {!isLast && (
                      <div className="h-2 flex gap-2">
                        <div className="flex-1 flex justify-start pl-0">
                          <div className="w-0.5 h-full bg-blue-500" />
                        </div>
                        <div className="flex-1 flex justify-start pl-0">
                          <div className="w-0.5 h-full bg-purple-500" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              
              // Single column layout (VMI only)
              const entry = row.sharedEntry || row.vmiEntry || row.cmiEntry;
              if (!entry) return null;
              
              return (
                <div key={row.timestamp + index} className="relative">
                  {/* Connecting line from previous */}
                  {index > 0 && (
                    <div className="h-2 flex justify-start">
                      <div className="w-0.5 h-full bg-blue-500" />
                    </div>
                  )}
                  <EntryCard 
                    entry={entry} 
                    language={language} 
                    isLast={isLast}
                    columnType="vmi"
                  />
                  {/* Connecting line to next */}
                  {!isLast && (
                    <div className="h-2 flex justify-start">
                      <div className="w-0.5 h-full bg-blue-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
