import { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
type DisplayableAction = 'status_changed' | 'lead_status_changed' | 'payment_status_changed' | 'endorsement_status_changed' | 'assignee_changed';

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
  // Lead (pre-conversion) statuses
  pending: { en: 'Pending', th: 'รอดำเนินการ' },
  docs_missing: { en: 'Docs Missing', th: 'ขอเอกสารเพิ่มเติม' },
  waiting_for_insurer: { en: 'Waiting for Insurer', th: 'รอเบี้ยจากบริษัทประกัน' },
  partially_added: { en: 'Partially Added', th: 'มีเบี้ยบางส่วนแล้ว' },
  completed: { en: 'Completed', th: 'เสร็จแล้ว' },
  quotation_shared: { en: 'Quotation Shared', th: 'ส่งเบี้ยให้ตัวแทนแล้ว' },
  price_pending: { en: 'Price Pending', th: 'ยังไม่ทราบเบี้ยต่ออายุ' },
  revision_pending: { en: 'Revision Pending', th: 'กำลังต่อรองกับบริษัทประกัน' },
  renewal_rejected: { en: 'Renewal Rejected', th: 'ปฎิเสธการต่ออายุ' },
  price_ready: { en: 'Price Ready', th: 'ได้รับเบี้ยต่ออายุแล้ว' },
  // Payment statuses based on payment method
  unpaid: { en: 'Unpaid', th: 'ยังไม่ชำระ' },
  paid: { en: 'Paid', th: 'ชำระแล้ว' },
  partial: { en: 'Partial', th: 'ชำระบางส่วน' },
  payment_verified: { en: 'Payment Verified', th: 'ยืนยันการชำระเงินแล้ว' },
  insurer_notified: { en: 'Insurer Notified', th: 'แจ้งบริษัทประกันแล้ว' },
  credit_approved: { en: 'Credit Approved', th: 'อนุมัติเครดิตแล้ว' },
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

// Get icon and colors for action type - unified blue color for all entries
function getActionConfig(action: DisplayableAction, policyKind?: 'vmi' | 'cmi') {
  // Use consistent blue for VMI tab and purple for CMI tab
  const isVmi = policyKind === 'vmi';
  const color = isVmi ? 'text-blue-600' : 'text-purple-600';
  const bgColor = isVmi ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30';
  
  switch (action) {
    case 'status_changed':
      return { icon: RefreshCw, color, bgColor };
    case 'lead_status_changed':
      return { icon: RefreshCw, color, bgColor };
    case 'payment_status_changed':
      return { icon: CreditCard, color, bgColor };
    case 'endorsement_status_changed':
      return { icon: FileCheck, color, bgColor };
    case 'assignee_changed':
      return { icon: UserPlus, color, bgColor };
  }
}

function getActionLabel(action: DisplayableAction, language: 'en' | 'th', assigneeType?: string): string {
  // For assignee changes, use specific type in the label
  if (action === 'assignee_changed' && assigneeType) {
    const typeLabels: Record<string, { en: string; th: string }> = {
      rf: { en: 'RF Changed', th: 'เปลี่ยน RF' },
      sc: { en: 'SC Changed', th: 'เปลี่ยน SC' },
      de: { en: 'DE Changed', th: 'เปลี่ยน DE' },
      owner: { en: 'Owner Changed', th: 'เปลี่ยนผู้รับผิดชอบ' },
    };
    return typeLabels[assigneeType]?.[language] || typeLabels.owner[language];
  }

  const labels: Record<DisplayableAction, { en: string; th: string }> = {
    status_changed: { en: 'Status Changed', th: 'เปลี่ยนสถานะงาน' },
    lead_status_changed: { en: 'Status Changed', th: 'เปลี่ยนสถานะงาน' },
    payment_status_changed: { en: 'Payment Status Changed', th: 'เปลี่ยนสถานะการชำระเงิน' },
    endorsement_status_changed: { en: 'Endorsement Status Changed', th: 'เปลี่ยนสถานะเอกสารแนบท้าย' },
    assignee_changed: { en: 'Owner Changed', th: 'เปลี่ยนผู้รับผิดชอบ' },
  };
  return labels[action][language];
}

// Extract timeline entries from a policy's history log
function extractPolicyTimeline(policy: PolicyRecord): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const historyLog = policy.historyLog || [];
  
  for (const entry of historyLog) {
    // Include displayable actions (exclude rework-related)
    if (entry.action === 'status_changed') {
      entries.push({
        id: entry.id,
        timestamp: entry.triggeredAt,
        action: 'status_changed',
        triggeredBy: entry.triggeredBy,
        fromStatus: entry.fromStatus as string,
        toStatus: entry.toStatus as string,
        policyKind: policy.kind,
      });
    } else if (entry.action === 'lead_status_changed') {
      entries.push({
        id: entry.id,
        timestamp: entry.triggeredAt,
        action: 'lead_status_changed',
        triggeredBy: entry.triggeredBy,
        fromStatus: entry.fromStatus as string,
        toStatus: entry.toStatus as string,
        policyKind: policy.kind,
      });
    } else if (entry.action === 'payment_status_changed') {
      entries.push({
        id: entry.id,
        timestamp: entry.triggeredAt,
        action: 'payment_status_changed',
        triggeredBy: entry.triggeredBy,
        fromStatus: entry.fromStatus as string,
        toStatus: entry.toStatus as string,
        policyKind: policy.kind,
      });
    } else if (entry.action === 'endorsement_status_changed') {
      entries.push({
        id: entry.id,
        timestamp: entry.triggeredAt,
        action: 'endorsement_status_changed',
        triggeredBy: entry.triggeredBy,
        fromStatus: entry.fromStatus as string,
        toStatus: entry.toStatus as string,
        policyKind: policy.kind,
      });
    } else if (entry.action === 'assignee_changed' && entry.assigneeType) {
      entries.push({
        id: entry.id,
        timestamp: entry.triggeredAt,
        action: 'assignee_changed',
        triggeredBy: entry.triggeredBy,
        assigneeType: entry.assigneeType,
        fromAssignee: entry.fromAssignee,
        toAssignee: entry.toAssignee,
        policyKind: policy.kind,
      });
    }
  }
  
  return entries;
}

// Build timeline for a specific policy type
function buildPolicyTimeline(lead: Lead, policyKind: 'vmi' | 'cmi'): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const policy = lead.policyRecords?.find(p => p.kind === policyKind);
  
  // Add policy-specific history
  if (policy) {
    entries.push(...extractPolicyTimeline(policy));
  }
  
  // Add lead-level assignee changes (RF/SC/DE) - applies to both
  const leadHistory = lead.historyLog || [];
  for (const entry of leadHistory) {
    if (entry.action === 'assignee_changed' && entry.assigneeType) {
      entries.push({
        id: `${entry.id}-${policyKind}`,
        timestamp: entry.triggeredAt,
        action: 'assignee_changed',
        triggeredBy: entry.triggeredBy,
        assigneeType: entry.assigneeType,
        fromAssignee: entry.fromAssignee,
        toAssignee: entry.toAssignee,
        policyKind: policyKind,
      });
    }
    
    // Add payment status changes - applies to both
    if (entry.action === 'payment_status_changed') {
      entries.push({
        id: `${entry.id}-${policyKind}`,
        timestamp: entry.triggeredAt,
        action: 'payment_status_changed',
        triggeredBy: entry.triggeredBy,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        policyKind: policyKind,
      });
    }
  }
  
  // Sort by timestamp (oldest first)
  entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  return entries;
}

// Format timestamp to DD-MM-YYYY HH:MM
function formatTimestamp(timestamp: string): string {
  // Handle ISO format
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }
  
  // Try parsing existing format (DD-MM-YYYY HH:MM)
  const [datePart, timePart] = timestamp.split(' ');
  if (!datePart) return timestamp;
  return timePart ? `${datePart} ${timePart}` : datePart;
}

// Timeline entry card component
function EntryCard({ 
  entry, 
  language,
  isLast,
  colorClass,
}: { 
  entry: TimelineEntry; 
  language: 'en' | 'th';
  isLast?: boolean;
  colorClass: string;
}) {
  const config = getActionConfig(entry.action, entry.policyKind);
  const Icon = config.icon;
  const showTriggeredBy = !isSystemTriggered(entry.triggeredBy);
  
  return (
    <div className="relative">
      {/* Connecting line above */}
      <div className={cn(
        "absolute left-0 top-0 w-0.5 h-full -translate-y-full",
        colorClass
      )} style={{ display: 'none' }} />
      
      <div className={cn(
        "rounded-lg border p-3 space-y-2 bg-card border-l-4",
        colorClass
      )}>
        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium">{formatTimestamp(entry.timestamp)}</span>
        </div>
        
        {/* Action badge */}
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-semibold px-2 py-1 rounded flex items-center gap-1.5",
            config.bgColor,
            config.color
          )}>
            <Icon className="w-3 h-3" />
            {getActionLabel(entry.action, language, entry.assigneeType)}
          </span>
        </div>
        
        {/* Content based on action type */}
        {/* Unified styling for all status changes - use policy kind color */}
        {(entry.action === 'status_changed' || entry.action === 'lead_status_changed' || entry.action === 'payment_status_changed' || entry.action === 'endorsement_status_changed') && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded bg-muted">
              {formatStatusLabel(entry.fromStatus || '', language)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={cn(
              "text-xs px-2 py-1 rounded font-medium",
              entry.policyKind === 'vmi' 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
            )}>
              {formatStatusLabel(entry.toStatus || '', language)}
            </span>
          </div>
        )}
        
        {entry.action === 'assignee_changed' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded bg-muted">
              {entry.fromAssignee || (language === 'th' ? 'ไม่มี' : 'None')}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={cn(
              "text-xs px-2 py-1 rounded font-medium",
              entry.policyKind === 'vmi' 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
            )}>
              {entry.toAssignee || (language === 'th' ? 'ไม่มี' : 'None')}
            </span>
          </div>
        )}
        
        {/* Triggered by - only show if not system */}
        {showTriggeredBy && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{entry.triggeredBy}</span>
          </div>
        )}
      </div>
      
      {/* Connecting line below */}
      {!isLast && (
        <div className={cn("w-0.5 h-3 ml-4", colorClass)} />
      )}
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
  const hasBoth = hasVmi && hasCmi;
  
  // Build separate timelines
  const vmiTimeline = hasVmi ? buildPolicyTimeline(lead, 'vmi') : [];
  const cmiTimeline = hasCmi ? buildPolicyTimeline(lead, 'cmi') : [];
  
  const [activeTab, setActiveTab] = useState<'vmi' | 'cmi'>(hasVmi ? 'vmi' : 'cmi');
  
  const currentTimeline = activeTab === 'vmi' ? vmiTimeline : cmiTimeline;
  const colorClass = activeTab === 'vmi' ? 'border-l-blue-500' : 'border-l-purple-500';
  const lineColorClass = activeTab === 'vmi' ? 'bg-blue-500' : 'bg-purple-500';
  
  const isEmpty = (hasVmi ? vmiTimeline.length === 0 : true) && (hasCmi ? cmiTimeline.length === 0 : true);
  
  if (isEmpty) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {language === 'th' ? 'ประวัติการทำงาน' : 'History Log'}
            </DialogTitle>
          <DialogDescription>
            {leadNumber}
          </DialogDescription>
          </DialogHeader>
          <div className="py-12 text-center text-muted-foreground">
            {language === 'th' ? 'ไม่มีประวัติสำหรับงานนี้' : 'No history log for this lead'}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {language === 'th' ? 'ประวัติการทำงาน' : 'History Log'}
          </DialogTitle>
          <DialogDescription>
            {leadNumber}
          </DialogDescription>
        </DialogHeader>

        {hasBoth ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'vmi' | 'cmi')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger 
                value="vmi"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400"
              >
                VMI
              </TabsTrigger>
              <TabsTrigger 
                value="cmi"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/30 dark:data-[state=active]:text-purple-400"
              >
                CMI
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="vmi" className="mt-0">
              <ScrollArea className="h-[450px] pr-4">
                {vmiTimeline.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    {language === 'th' ? 'ไม่มีประวัติสำหรับ VMI' : 'No VMI history'}
                  </div>
                ) : (
                  <div className="space-y-0 py-2">
                    {vmiTimeline.map((entry, index) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        language={language}
                        isLast={index === vmiTimeline.length - 1}
                        colorClass="border-l-blue-500"
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="cmi" className="mt-0">
              <ScrollArea className="h-[450px] pr-4">
                {cmiTimeline.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    {language === 'th' ? 'ไม่มีประวัติสำหรับ CMI' : 'No CMI history'}
                  </div>
                ) : (
                  <div className="space-y-0 py-2">
                    {cmiTimeline.map((entry, index) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        language={language}
                        isLast={index === cmiTimeline.length - 1}
                        colorClass="border-l-purple-500"
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          // Single policy type - no tabs needed
          <ScrollArea className="h-[450px] pr-4">
            <div className="space-y-0 py-2">
              {currentTimeline.map((entry, index) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  language={language}
                  isLast={index === currentTimeline.length - 1}
                  colorClass={colorClass}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
