import React, { useState, useMemo } from 'react';
import { 
  ExternalLink, 
  MoreVertical,
  History,
  Eye,
  ChevronRight,
  ChevronDown,
  FileText,
  MessageSquare,
  Truck,
  CalendarClock,
  ChevronsUpDown,
} from 'lucide-react';
import { Lead, PipelineStage, LeadType, LeadSource, ReworkConfig, CreatedByType, ReworkAttachment, ReworkHistoryEntry, HistoryLogEntry, PolicyStatus, PolicyReworkEntry, PolicyRecord, PaymentMethod, PolicyHistoryLogEntry, InstallmentCount, EndorsementStatus, PolicyEndorsementEntry } from '@/types/pipeline';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { leadStatusColors, getStatusStyles } from '@/utils/statusColors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { TablePagination } from '@/components/ui/table-pagination';
import { mockStaffMembers } from '@/data/mockStaff';

import { HistoryLogDialog } from './HistoryLogDialog';
import { InlineReworkActions } from './InlineReworkActions';
import { PolicyStatusCell } from './PolicyStatusCell';
import { getPoliciesForStage, getPolicyStage } from './PipelineTabs';
import { InsurersExpandableRow } from './InsurersExpandableRow';
import { PolicyRemarksReworkDialog } from './PolicyRemarksReworkDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PreSendEmailModal } from './PreSendEmailModal';
import { RefreshCw, AlertTriangle, Upload, Share2 } from 'lucide-react';

interface LeadsTableProps {
  leads: Lead[];
  allLeads?: Lead[];
  stage: PipelineStage;
  reworkConfigs: ReworkConfig[];
  onLeadUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

// Status translations
const statusTranslations: Record<string, { en: string; th: string }> = {
  // Pre-lead statuses (new_leads)
  pending: { en: 'Pending', th: 'รอดำเนินการ' },
  docs_missing: { en: 'Docs Missing', th: 'ขอเอกสารเพิ่มเติม' },
  waiting_for_insurer: { en: 'Waiting for Insurer', th: 'รอเบี้ยจากบริษัทประกัน' },
  partially_added: { en: 'Partially Added', th: 'มีเบี้ยบางส่วนแล้ว' },
  completed: { en: 'Completed', th: 'เสร็จแล้ว' },
  quotation_shared: { en: 'Quotation Shared', th: 'ส่งเบี้ยให้ตัวแทนแล้ว' },
  invalid: { en: 'Invalid', th: 'ยกเลิก' },
  // Renewal-specific statuses
  price_pending: { en: 'Price Pending', th: 'รอเพิ่มเบี้ยงานต่ออายุ' },
  request_sent_to_insurer: { en: 'Request Sent to Insurer', th: 'ส่งคำขอไปยังบ.ประกันแล้ว' },
  pricelist_added: { en: 'Pricelist Added', th: 'เพิ่มเบี้ยงานต่ออายุแล้ว' },
  revision_pending: { en: 'Revision Pending', th: 'รอยืนยันเบี้ยงานต่ออายุ' },
  recheck_price_claim: { en: 'Recheck Price (Claim)', th: 'รอยืนยันประวัติการเคลม' },
  special_request_pending: { en: 'Special Request Pending', th: 'รอยืนยันผลการขออนุโลม' },
  pricelist_verified: { en: 'Pricelist Verified', th: 'ยืนยันเบี้ยงานต่ออายุแล้ว' },
  quotation_shared_to_agent: { en: 'Quotation Shared to Agent', th: 'ส่งเบี้ยให้ตัวแทนแล้ว' },
  renewal_rejected: { en: 'Renewal Rejected', th: 'บ.ประกันปฎิเสธการต่ออายุ' },
  // Post-lead statuses
  // Post-lead statuses
  pending_payment: { en: 'Pending', th: 'รอดำเนินการ' },
  pending_review: { en: 'Pending Review', th: 'รอตรวจเอกสาร' },
  under_review: { en: 'Under Review', th: 'กำลังตรวจเอกสาร' },
  de_in_progress: { en: 'DE in Progress', th: 'DE กำลังดำเนินการ' },
  ready_for_de: { en: 'Ready for DE', th: 'พร้อมส่ง DE' },
  pending_issuance: { en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  policy_issued: { en: 'Policy Uploaded', th: 'กรมธรรม์ออกแล้ว' },
  policy_shipped: { en: 'Policy Shipped', th: 'กรมธรรม์ถูกจัดส่ง' },
  policy_delivered: { en: 'Policy Delivered', th: 'กรมธรรม์จัดส่งสำเร็จ' },
  policy_cancelled: { en: 'Policy Cancelled', th: 'กรมธรรม์ยกเลิก' },
  rework_required: { en: 'Rework Required', th: 'งานติดปัญหา' },
};

// Helper to get translated status label
function getStatusLabel(value: string, language: 'en' | 'th'): string {
  return statusTranslations[value]?.[language] || value;
}

// Status options by lead sub-type for to_convert stage
const statusOptionsByLeadType: Record<string, string[]> = {
  new_leads: [
    'pending',
    'docs_missing',
    'waiting_for_insurer',
    'partially_added',
    'completed',
    'quotation_shared',
    'invalid',
  ],
  coa: [
    'pending',
    'docs_missing',
    'waiting_for_insurer',
    'completed',
    'quotation_shared',
    'invalid',
  ],
  renewals: [
    'price_pending',
    'request_sent_to_insurer',
    'pricelist_added',
    'revision_pending',
    'recheck_price_claim',
    'special_request_pending',
    'pricelist_verified',
    'quotation_shared_to_agent',
    'renewal_rejected',
    'invalid',
  ],
};

// Manual status transition rules for renewals per the spec
// Returns allowed manual next statuses for a given current renewal status
function getRenewalAllowedManualStatuses(currentStatus: string, lead?: Lead): string[] {
  // Track if recheck price or special request has been done (using a flag on the lead)
  const hasCompletedRecheckOrSpecialRequest = lead ? 
    (lead as any)._hasCompletedRecheckPrice || (lead as any)._hasCompletedSpecialRequest : false;

  switch (currentStatus) {
    case 'price_pending':
      return ['renewal_rejected'];
    case 'request_sent_to_insurer':
      return ['renewal_rejected'];
    case 'pricelist_added':
      return ['recheck_price_claim', 'renewal_rejected'];
    case 'revision_pending':
      return ['pricelist_added', 'renewal_rejected'];
    case 'recheck_price_claim':
      return ['pricelist_verified', 'renewal_rejected'];
    case 'pricelist_verified':
      return ['renewal_rejected'];
    case 'quotation_shared_to_agent':
      return ['renewal_rejected'];
    case 'renewal_rejected':
      return []; // No dropdown exits — exits via Request Exception action only
    case 'special_request_pending':
      return ['invalid'];
    case 'invalid':
      return []; // Terminal
    default:
      return ['renewal_rejected'];
  }
}

const statusOptionsByStage: Record<PipelineStage, string[]> = {
  all: [
    // Post-lead statuses only (no new_leads, coa, renewals statuses)
    // rework_required is excluded - shown dynamically based on each sale's actual stage
    'pending_payment',
    'pending_review',
    // 'under_review', // Hidden for now
    // 'de_in_progress', // Hidden for now
    'pending_issuance',
    'policy_issued',
    'policy_shipped',
    'policy_delivered',
    'policy_cancelled',
  ],
  to_convert: [
    'pending',
    'docs_missing',
    'waiting_for_insurer',
    'partially_added',
    'completed',
    'quotation_shared',
    'invalid',
  ],
  to_pay: [
    'pending_payment',
    'rework_required',
  ],
  to_report: [
    'pending_review',
    // 'under_review', // Hidden for now
    // 'de_in_progress', // Hidden for now
    'rework_required',
  ],
  to_issue: [
    'pending_issuance',
    'rework_required',
  ],
  to_deliver: [
    'policy_issued',
    'rework_required',
  ],
  completed: [
    'policy_issued',
    'policy_shipped',
    'policy_delivered',
    'rework_required',
  ],
  cancelled: [
    'policy_cancelled',
  ],
};

const defaultStatusByStage: Record<PipelineStage, string> = {
  all: 'pending',
  to_convert: 'pending',
  to_pay: 'pending_payment',
  to_report: 'pending_review',
  to_issue: 'pending_issuance',
  to_deliver: 'policy_issued',
  completed: 'policy_delivered',
  cancelled: 'policy_cancelled',
};

function CreatedByBadge({ createdBy, stage }: { createdBy: CreatedByType; stage?: string }) {
  const isLeadsStage = stage === 'to_convert';
  const config = {
    agent: { label: isLeadsStage ? 'Agent' : 'SS', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    admin: { label: isLeadsStage ? 'Admin' : 'NSS', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  };
  const { label, className } = config[createdBy];
  return <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', className)}>{label}</span>;
}

// Lead source badge: System / Custom / COA / Renewal (always English)
function LeadSourceBadge({ leadType, leadSource }: { leadType: LeadType; leadSource?: LeadSource }) {
  // COA leads show "COA" badge
  if (leadType === 'coa') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        COA
      </span>
    );
  }
  
  // Renewals show "Renewal" badge
  if (leadType === 'renewals') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Renewal
      </span>
    );
  }
  
  // new_leads show System or Custom badge based on leadSource (always English)
  if (leadType === 'new_leads') {
    const label = leadSource === 'system' ? 'System' : 'Custom';
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {label}
      </span>
    );
  }
  
  return null;
}

// Helper to format premium in THB
function formatPremium(premium?: number): string {
  if (premium === undefined || premium === null) return '-';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(premium);
}

// Payment method display labels
const paymentMethodLabels: Record<PaymentMethod, { en: string; th: string }> = {
  credit: { en: 'Credit', th: 'เครดิต' },
  cbc_to_fairdee: { en: 'CBC to FairDee', th: 'จ่ายเข้าแฟร์ดี' },
  cbc_to_insurer: { en: 'CBC to Insurer', th: 'จ่ายเข้าบ.ประกัน' },
};

// Payment status options - varies by payment method
type PaymentStatus = 'invoice_issued' | 'verified';
const paymentStatusLabels: Record<PaymentStatus, { en: string; th: string }> = {
  invoice_issued: { en: 'Invoice Issued', th: 'ออกใบแจ้งหนี้แล้ว' },
  verified: { en: 'Payment Verified', th: 'ยืนยันการชำระเงินแล้ว' },
};

// Payment status labels that vary by payment method (for post to_pay stages)
const paymentStatusByMethod: Record<PaymentMethod, { en: string; th: string }> = {
  cbc_to_fairdee: { en: 'Payment Verified', th: 'ยืนยันการชำระเงินแล้ว' },
  cbc_to_insurer: { en: 'Insurer Notified', th: 'แจ้งบริษัทประกันแล้ว' },
  credit: { en: 'Credit Approved', th: 'อนุมัติเครดิตแล้ว' },
};

// Helper to check if both policies are pending
function areBothPoliciesPending(lead: Lead): boolean {
  const vmiPolicy = lead.policyRecords?.find(p => p.kind === 'vmi');
  const cmiPolicy = lead.policyRecords?.find(p => p.kind === 'cmi');
  
  const vmiisPending = vmiPolicy?.status === 'pending_payment';
  const cmiisPending = cmiPolicy?.status === 'pending_payment';
  
  if (lead.policyType === 'vmi_cmi') {
    return vmiisPending && cmiisPending;
  }
  return vmiisPending === true;
}

// Helper to get payment method display
function getPaymentMethodLabel(lead: Lead, language: 'en' | 'th'): string {
  if (areBothPoliciesPending(lead)) return '-';
  return lead.paymentMethod ? paymentMethodLabels[lead.paymentMethod][language] : '-';
}

// Helper to get premium display (shows "-" for To Pay stage)
function getPremiumDisplay(lead: Lead, stage: PipelineStage): string {
  if (stage === 'to_pay') return '-';
  if (areBothPoliciesPending(lead)) return '-';
  return formatPremium(lead.premium);
}

// Helper to get payment status for display based on stage
function getPaymentStatusForStage(stage: PipelineStage): PaymentStatus {
  if (stage === 'to_pay') return 'invoice_issued';
  return 'verified';
}

// Helper to get payment status label based on payment method (for post to_pay stages)
function getPaymentStatusLabelByMethod(lead: Lead, stage: PipelineStage, language: 'en' | 'th'): string {
  // To Pay stage shows "-"
  if (stage === 'to_pay') {
    return '-';
  }
  // For post to_pay stages, show label based on payment method
  if (lead.paymentMethod) {
    return paymentStatusByMethod[lead.paymentMethod][language];
  }
  return paymentStatusLabels.verified[language];
}

// Helper to get staff members by team (based on fixed rosters)

// Helper to get staff members by team (based on fixed rosters)
const teamRosters: Record<string, string[]> = {
  'AST RF': ['Ricky', 'Jenny', 'Tommy'],
  'AST SC': ['Lisa', 'Mike', 'Nina'],
  'DE': ['Oscar', 'Paula', 'Quinn'],
  'Admin': ['Rachel', 'Sam', 'Tina'],
  'Delivery': ['Dao', 'Kai', 'Ploy'],
};

function getStaffByTeam(team: string) {
  const roster = teamRosters[team];
  if (!roster) return mockStaffMembers.filter((staff) => staff.team === team);

  return mockStaffMembers.filter((staff) => roster.includes(staff.name));
}

// Get RF staff (AST RF team)
function getRFStaff() {
  return mockStaffMembers.filter(staff => staff.team === 'AST RF');
}

// Get SC staff (AST SC team)
function getSCStaff() {
  return mockStaffMembers.filter(staff => staff.team === 'AST SC');
}

// Get DE staff (DE team)
function getDEStaff() {
  return mockStaffMembers.filter(staff => staff.team === 'DE');
}

// Get Admin staff (Admin team)
function getAdminStaff() {
  return mockStaffMembers.filter(staff => staff.team === 'Admin');
}

// Get Delivery staff (Delivery team)
function getDeliveryStaff() {
  return mockStaffMembers.filter(staff => staff.team === 'Delivery');
}

// Round robin state per team
const roundRobinIndexes: Record<string, number> = {};

// Round robin state for arbitrary lists (e.g., ReworkConsole teamMembers)
const roundRobinListIndexes: Record<string, number> = {};

function getNextFromList(key: string, members: string[]): string | undefined {
  if (!members || members.length === 0) return undefined;
  if (!(key in roundRobinListIndexes)) {
    roundRobinListIndexes[key] = 0;
  }
  const idx = roundRobinListIndexes[key] % members.length;
  roundRobinListIndexes[key] = (roundRobinListIndexes[key] + 1) % members.length;
  return members[idx];
}

// Get next staff member via round robin for a team
function getNextRoundRobinStaff(team: string): string | undefined {
  const teamStaff = getStaffByTeam(team);
  if (teamStaff.length === 0) return undefined;
  
  if (!(team in roundRobinIndexes)) {
    roundRobinIndexes[team] = 0;
  }
  
  const staff = teamStaff[roundRobinIndexes[team] % teamStaff.length];
  roundRobinIndexes[team] = (roundRobinIndexes[team] + 1) % teamStaff.length;
  
  return staff.name;
}

// Get next DE staff via round robin
function getNextDERoundRobin(): string | undefined {
  return getNextRoundRobinStaff('DE');
}

// Parse DD-MM-YYYY HH:MM format to Date
function parseDateTime(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

// Current user - from profile store
import { useCurrentUserStore } from '@/stores/currentUserStore';
import { useNotificationNavigationStore } from '@/stores/notificationNavigationStore';

export function LeadsTable({ leads, allLeads, stage, reworkConfigs, onLeadUpdate }: LeadsTableProps) {
  const { language } = useLanguageStore();
  const CURRENT_USER = useCurrentUserStore(s => s.name);
  const navTarget = useNotificationNavigationStore(s => s.target);
  const clearNavTarget = useNotificationNavigationStore(s => s.clearTarget);
  
  const [historyLogDialogOpen, setHistoryLogDialogOpen] = useState(false);
  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [selectedPolicyForRemarks, setSelectedPolicyForRemarks] = useState<{ leadId: string; policyId: string; kind: 'vmi' | 'cmi' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(() => new Set());
  const [recheckPriceOpen, setRecheckPriceOpen] = useState(false);
  const [requestExceptionOpen, setRequestExceptionOpen] = useState(false);
  const [emailModalLead, setEmailModalLead] = useState<Lead | null>(null);

  // Auto-open remarks dialog when notification navigation target is set
  React.useEffect(() => {
    if (navTarget && navTarget.targetStage === stage) {
      setSelectedPolicyForRemarks({
        leadId: navTarget.leadId,
        policyId: navTarget.policyId,
        kind: navTarget.policyKind,
      });
      setRemarksDialogOpen(true);
      clearNavTarget();
    }
  }, [navTarget, stage, clearNavTarget]);

  // Toggle expanded state for a lead
  const toggleLeadExpanded = (leadId: string) => {
    setExpandedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Check if current stage is a post-lead stage (To Pay onwards) - 'all' uses same layout as post-lead stages
  const isPostLeadStage = ['all', 'to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'].includes(stage);

  // DE column is shown in post-lead stages only (not in Leads stage)
  const showDEColumn = isPostLeadStage;

  // Filter rework configs by current stage (for 'all' tab, include configs from all post-lead stages)
  const stageReworkConfigs = stage === 'all' 
    ? reworkConfigs.filter(config => config.stages.some(s => ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'].includes(s)))
    : reworkConfigs.filter(config => config.stages.includes(stage));

  // Helper: check if a policy has any unresolved EXTERNAL rework entries
  const hasExternalUnresolvedRework = (policy: PolicyRecord): boolean => {
    const unresolved = policy.reworkHistory?.filter(e => !e.resolved) || [];
    return unresolved.some(e => {
      const config = reworkConfigs.find(r => r.id === e.reasonId);
      return config?.partyType === 'external';
    });
  };

  // Helper: determine correct policy status considering internal/external rework
  const getPolicyStatusForRework = (policy: PolicyRecord, hasExternal: boolean): PolicyStatus => {
    if (hasExternal) return 'rework_required';
    // Internal only - keep previous status from the first unresolved entry, or current status
    const firstUnresolved = policy.reworkHistory?.find(e => !e.resolved);
    return firstUnresolved?.previousStatus || policy.status;
  };

  const getActivePolicyRework = (policy: PolicyRecord | undefined): PolicyReworkEntry | undefined => {
    const history = policy?.reworkHistory;
    if (!history || history.length === 0) return undefined;
    // Most recent unresolved wins
    return [...history].reverse().find(e => !e.resolved);
  };

  const getLeadActivePolicyRework = (lead: Lead): { policyId: string; kind: 'vmi' | 'cmi'; entry: PolicyReworkEntry } | undefined => {
    const records = lead.policyRecords;
    if (!records || records.length === 0) return undefined;

    // Prefer VMI over CMI if both are in rework
    const vmi = records.find(r => r.kind === 'vmi');
    const cmi = records.find(r => r.kind === 'cmi');

    // Check for any unresolved rework (both external/rework_required status AND internal-only)
    const vmiEntry = getActivePolicyRework(vmi);
    if (vmi && vmiEntry) return { policyId: vmi.id, kind: 'vmi', entry: vmiEntry };

    const cmiEntry = getActivePolicyRework(cmi);
    if (cmi && cmiEntry) return { policyId: cmi.id, kind: 'cmi', entry: cmiEntry };

    return undefined;
  };

  const computeReworkOwner = (lead: Lead, reasonId: string, policy?: PolicyRecord): string | undefined => {
    const config = reworkConfigs.find(r => r.id === reasonId);
    if (!config) return undefined;

    // Step 1: Check sticky columns first (priority order)
    if (config.stickyEnabled && config.stickyColumns && config.stickyColumns.length > 0) {
      for (const col of config.stickyColumns) {
        let stickyOwner: string | undefined;
        switch (col) {
          case 'RF': stickyOwner = lead.rfAssignee; break;
          case 'SC': stickyOwner = lead.scAssignee; break;
          case 'DE': stickyOwner = lead.deAssignee; break;
          case 'Admin': stickyOwner = policy?.adminAssignee; break;
          case 'Delivery': stickyOwner = policy?.deliveryAssignee; break;
        }
        if (stickyOwner) return stickyOwner;
      }
    }

    // Step 2: Fallback to assignment logic
    switch (config.assignment) {
      case 'round_robin': {
        if (config.teamMembers && config.teamMembers.length > 0) {
          return getNextFromList(`rework-${config.id}`, config.teamMembers);
        }
        return getNextRoundRobinStaff(config.team || 'Admin');
      }
      case 'rf_sc':
        return lead.scAssignee || lead.rfAssignee;
      case 'rf':
        return lead.rfAssignee;
      case 'requestor':
        return CURRENT_USER;
      case 'none':
        return undefined;
      default:
        return undefined;
    }
  };

  // Handle policy status change (for non-rework status changes)
  const handlePolicyStatusChange = (lead: Lead, policyId: string, newStatus: PolicyStatus) => {
    if (!lead.policyRecords) return;
    
    // If changing to rework_required, open rework dialog (always allowed manually)
    if (newStatus === 'rework_required') {
      setSelectedPolicyForRemarks({ leadId: lead.id, policyId, kind: lead.policyRecords?.find(p => p.id === policyId)?.kind || 'vmi' });
      setRemarksDialogOpen(true);
      return;
    }

    // Block all other manual status changes — forward progression is system-driven
    const policy = lead.policyRecords.find(r => r.id === policyId);
    if (policy && newStatus !== policy.status) {
      toast.error(
        language === 'th'
          ? 'สถานะนี้เปลี่ยนโดยระบบอัตโนมัติ ไม่สามารถเปลี่ยนด้วยตนเองได้'
          : 'This status is changed automatically by the system and cannot be changed manually.',
        { duration: 4000 }
      );
      return;
    }

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // This code is unreachable now due to the manual restriction above,
    // but kept for when system-driven changes call this handler directly.
    
    const policyHistoryEntry: PolicyHistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'status_changed',
      triggeredBy: CURRENT_USER,
      triggeredAt: timestamp,
      fromStatus: policy?.status,
      toStatus: newStatus,
    };

    // Update ONLY the specific policy with the status change and history entry
    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id === policyId) {
        return {
          ...record,
          status: newStatus,
          historyLog: [...(record.historyLog || []), policyHistoryEntry],
        };
      }
      return record;
    });

    onLeadUpdate?.(lead.id, {
      policyRecords: updatedRecords,
    });
  };

  // Handle policy rework resolve (for specific entry)
  const handlePolicyReworkResolve = (lead: Lead, policyId: string, entryId: string) => {
    if (!lead.policyRecords) return;

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const policy = lead.policyRecords.find(r => r.id === policyId);
    const targetEntry = policy?.reworkHistory?.find(e => e.id === entryId);

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== policyId) return record;
      
      const reworkHistory = record.reworkHistory || [];
      
      // Find the target entry by ID
      const unresolvedEntry = reworkHistory.find(e => e.id === entryId && !e.resolved);
      if (!unresolvedEntry) return record;
      
      // Mark it as resolved
      const updatedHistory = reworkHistory.map(entry => {
        if (entry.id === entryId) {
          return {
            ...entry,
            resolved: true,
            resolvedAt: timestamp,
            resolvedBy: CURRENT_USER,
          };
        }
        return entry;
      });

      // Create policy-level history log entry
      const policyHistoryEntry: PolicyHistoryLogEntry = {
        id: crypto.randomUUID(),
        action: 'rework_resolved',
        triggeredBy: CURRENT_USER,
        triggeredAt: timestamp,
        reworkReasonId: unresolvedEntry.reasonId,
        reworkReasonLabel: unresolvedEntry.reasonLabel,
        comment: 'Rework resolved',
      };

      // Check if there are still other unresolved entries
      const remainingUnresolved = updatedHistory.filter(e => !e.resolved);
      const hasRemainingRework = remainingUnresolved.length > 0;
      
      // Check if remaining unresolved has any external reasons
      const hasRemainingExternal = remainingUnresolved.some(e => {
        const c = reworkConfigs.find(r => r.id === e.reasonId);
        return c?.partyType === 'external';
      });

      // Determine status: if no rework left, restore previous. If only internal left, also restore previous.
      const newStatus: PolicyStatus = !hasRemainingRework 
        ? unresolvedEntry.previousStatus 
        : (hasRemainingExternal ? 'rework_required' : unresolvedEntry.previousStatus);

      return {
        ...record,
        status: newStatus,
        reworkRequired: hasRemainingRework,
        reworkHistory: updatedHistory,
        historyLog: [...(record.historyLog || []), policyHistoryEntry],
      };
    });

    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_resolved',
      triggeredBy: CURRENT_USER,
      triggeredAt: timestamp,
      reworkReasonId: targetEntry?.reasonId,
      reworkReasonLabel: targetEntry?.reasonLabel,
      comment: `${policy?.kind.toUpperCase()} policy rework resolved`,
    };

    // If any policy is still in active rework, keep lead-level rework priority + owner
    const leadAfter: Lead = { ...lead, policyRecords: updatedRecords };
    const active = getLeadActivePolicyRework(leadAfter);
    const nextOwner = active ? computeReworkOwner(lead, active.entry.reasonId, updatedRecords.find(r => r.reworkHistory?.some(e => e.id === active.entry.id))) : undefined;

    // Post-resolution ownership transfer: when the resolved entry has a postResolutionOwner
    // (or its config used 'specific' assignment with a team default), hand the case over.
    const resolvedConfig = reworkConfigs.find(c => c.id === targetEntry?.reasonId);
    const postResolutionOwner = targetEntry?.postResolutionOwner
      || (resolvedConfig?.assignment === 'specific' && resolvedConfig.team
          ? getNextRoundRobinStaff(resolvedConfig.team)
          : undefined);

    onLeadUpdate?.(lead.id, {
      policyRecords: updatedRecords,
      reworkRequired: Boolean(active),
      assignedTo: active ? nextOwner : (postResolutionOwner ?? undefined),
      historyLog: [...(lead.historyLog || []), historyLogEntry],
    });
  };

  // Handle policy rework reassign (for specific entry)
  const handlePolicyReworkReassign = (lead: Lead, policyId: string, entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[], postResolutionOwner?: string) => {
    if (!lead.policyRecords) return;

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const reworkConfig = reworkConfigs.find(r => r.id === newReasonId);
    const reasonLabel = reworkConfig?.descriptionEn || 'Unknown';
    const newOwner = computeReworkOwner(lead, newReasonId, lead.policyRecords?.find(r => r.id === policyId));

    const policy = lead.policyRecords.find(r => r.id === policyId);
    const targetEntry = policy?.reworkHistory?.find(e => e.id === entryId);

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== policyId) return record;
      
      const reworkHistory = record.reworkHistory || [];
      
      // Find the target entry by ID
      const unresolvedEntry = reworkHistory.find(e => e.id === entryId && !e.resolved);
      const previousStatus = unresolvedEntry?.previousStatus || (record.status as PolicyStatus);
      
      // Mark the target entry as resolved (reassigned)
      const updatedHistory = reworkHistory.map(entry => {
        if (entry.id === entryId) {
          return {
            ...entry,
            resolved: true,
            resolvedAt: timestamp,
            resolvedBy: `${CURRENT_USER} (Reassigned)`,
          };
        }
        return entry;
      });

      // Add new rework entry with its own owner + post-resolution owner
      const newEntry: PolicyReworkEntry = {
        id: crypto.randomUUID(),
        reasonId: newReasonId,
        reasonLabel,
        details,
        attachments,
        savedBy: CURRENT_USER,
        savedAt: timestamp,
        assignedTo: newOwner, // rework worker
        postResolutionOwner, // owner after resolve (specific assignment)
        previousStatus,
      };

      // Create policy-level history log entry for reassignment
      const policyHistoryEntry: PolicyHistoryLogEntry = {
        id: crypto.randomUUID(),
        action: 'rework_reassigned',
        triggeredBy: CURRENT_USER,
        triggeredAt: timestamp,
        reworkReasonId: newReasonId,
        reworkReasonLabel: reasonLabel,
        comment: details || `Reassigned from: ${unresolvedEntry?.reasonLabel || 'Unknown'}`,
        attachments: attachments.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          url: a.url,
        })),
      };

      // After reassignment, check if remaining unresolved (including the new entry) has external
      const allUnresolved = [...updatedHistory.filter(e => !e.resolved), newEntry];
      const hasExternalAfterReassign = allUnresolved.some(e => {
        const c = reworkConfigs.find(r => r.id === e.reasonId);
        return c?.partyType === 'external';
      });
      const newStatus: PolicyStatus = hasExternalAfterReassign 
        ? 'rework_required' 
        : (unresolvedEntry?.previousStatus || record.status as PolicyStatus);

      return {
        ...record,
        status: newStatus,
        reworkRequired: true,
        reworkHistory: [...updatedHistory, newEntry],
        historyLog: [...(record.historyLog || []), policyHistoryEntry],
      };
    });

    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_reassigned',
      triggeredBy: CURRENT_USER,
      triggeredAt: timestamp,
      reworkReasonId: newReasonId,
      reworkReasonLabel: reasonLabel,
      comment: `${policy?.kind.toUpperCase()} policy rework reassigned: ${details || reasonLabel}`,
      attachments: attachments.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        url: a.url,
      })),
    };

    // Build update object with new owner
    const updates: Partial<Lead> = {
      policyRecords: updatedRecords,
      // Policy-level rework should take priority over normal ownership
      reworkRequired: true,
      assignedTo: newOwner,
      historyLog: [...(lead.historyLog || []), historyLogEntry],
    };

    // Add assignee change to history if owner changed
    if (newOwner !== lead.assignedTo) {
      const assigneeChangeEntry: HistoryLogEntry = {
        id: crypto.randomUUID(),
        action: 'assignee_changed',
        triggeredBy: 'System',
        triggeredAt: timestamp,
        assigneeType: 'owner',
        fromAssignee: lead.assignedTo,
        toAssignee: newOwner,
      };
      updates.historyLog = [...(updates.historyLog || []), assigneeChangeEntry];
    }

    onLeadUpdate?.(lead.id, updates);
  };

  // Handle adding a new rework entry (without resolving existing ones)
  const handlePolicyReworkAdd = (lead: Lead, policyId: string, reasonId: string, details: string, attachments: ReworkAttachment[], autoResolveDate?: string, postResolutionOwner?: string) => {
    if (!lead.policyRecords) return;

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const reworkConfig = reworkConfigs.find(r => r.id === reasonId);
    const reasonLabel = reworkConfig?.descriptionEn || 'Unknown';
    const newOwner = computeReworkOwner(lead, reasonId, lead.policyRecords?.find(r => r.id === policyId));

    const policy = lead.policyRecords.find(r => r.id === policyId);

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== policyId) return record;
      
      const reworkHistory = record.reworkHistory || [];
      
      // Get the previous status (either from existing unresolved entry or current status)
      const existingUnresolved = reworkHistory.find(e => !e.resolved);
      const previousStatus = existingUnresolved?.previousStatus || (record.status as PolicyStatus);
      const currentOwner = existingUnresolved?.assignedTo;

      // Add new rework entry with its own owner + post-resolution owner
      const newEntry: PolicyReworkEntry = {
        id: crypto.randomUUID(),
        reasonId,
        reasonLabel,
        details,
        attachments,
        savedBy: CURRENT_USER,
        savedAt: timestamp,
        assignedTo: newOwner, // rework worker
        postResolutionOwner, // owner after resolve (specific assignment)
        previousStatus,
        ...(autoResolveDate ? { autoResolveDate } : {}),
      };

      // Determine if there will be any external unresolved rework after adding this one
      const isExternalReasonLocal = reworkConfig?.partyType === 'external';
      const existingExternalUnresolvedLocal = reworkHistory.filter(e => !e.resolved).some(e => {
        const c = reworkConfigs.find(r => r.id === e.reasonId);
        return c?.partyType === 'external';
      });
      const willHaveExternalLocal = isExternalReasonLocal || existingExternalUnresolvedLocal;
      const newStatusLocal: PolicyStatus = willHaveExternalLocal ? 'rework_required' : previousStatus;

      // Build policy-level history entries
      const historyEntries: PolicyHistoryLogEntry[] = [];
      
      // 1. Status change entry (if status is actually changing)
      if (record.status !== newStatusLocal) {
        historyEntries.push({
          id: crypto.randomUUID(),
          action: 'status_changed',
          triggeredBy: CURRENT_USER,
          triggeredAt: timestamp,
          fromStatus: record.status,
          toStatus: newStatusLocal,
        });
      }
      
      // 2. Owner change entry (if applicable) - same timestamp
      if (newOwner && newOwner !== currentOwner) {
        historyEntries.push({
          id: crypto.randomUUID(),
          action: 'assignee_changed',
          triggeredBy: CURRENT_USER,
          triggeredAt: timestamp,
          assigneeType: 'owner',
          fromAssignee: currentOwner,
          toAssignee: newOwner,
        });
      }

      return {
        ...record,
        status: newStatusLocal,
        reworkRequired: true,
        reworkHistory: [...reworkHistory, newEntry],
        historyLog: [...(record.historyLog || []), ...historyEntries],
      };
    });

    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_created',
      triggeredBy: CURRENT_USER,
      triggeredAt: timestamp,
      reworkReasonId: reasonId,
      reworkReasonLabel: reasonLabel,
      comment: `${policy?.kind.toUpperCase()} policy: additional rework reason added - ${details || reasonLabel}`,
      attachments: attachments.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        url: a.url,
      })),
    };

    // Build update object with new owner
    const updates: Partial<Lead> = {
      policyRecords: updatedRecords,
      reworkRequired: true,
      assignedTo: newOwner,
      historyLog: [...(lead.historyLog || []), historyLogEntry],
    };

    onLeadUpdate?.(lead.id, updates);
  };

  // Handle endorsement status change - validates against rework console, creates entry, updates owner
  const handleEndorsementStatusChange = (lead: Lead, policyId: string, newStatus: EndorsementStatus) => {
    if (!lead.policyRecords) return;

    const policy = lead.policyRecords.find(r => r.id === policyId);
    if (!policy || !policy.endorsementType) return;

    const oldStatus = policy.endorsementStatus;
    if (oldStatus === newStatus) return;

    // Validate: find matching endorsement config in rework console
    const matchingConfig = reworkConfigs.find(
      c => c.configType === 'endorsement'
        && c.endorsementConfigType === policy.endorsementType
        && c.endorsementConfigStatus === newStatus
    );

    if (!matchingConfig) {
      toast.error(
        language === 'th'
          ? 'ไม่พบการตั้งค่าสถานะนี้ใน Rework Console กรุณาเพิ่มการตั้งค่าก่อน'
          : 'This endorsement status is not configured in the Rework Console. Please add the configuration first.',
        { duration: 4000 }
      );
      return;
    }

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Terminal endorsement statuses have no owner
    const isTerminalStatus = newStatus === 'request_approved' || newStatus === 'invalid';
    const newOwner = isTerminalStatus ? undefined : computeReworkOwner(lead, matchingConfig.id, policy);

    // Create endorsement entry (ticket)
    const endorsementEntry: PolicyEndorsementEntry = {
      id: crypto.randomUUID(),
      endorsementType: policy.endorsementType,
      fromStatus: oldStatus!,
      toStatus: newStatus,
      details: '',
      attachments: [],
      savedBy: CURRENT_USER,
      savedAt: timestamp,
      assignedTo: newOwner,
    };

    // Create policy-level history log entry
    const policyHistoryEntry: PolicyHistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'endorsement_status_changed',
      triggeredBy: CURRENT_USER,
      triggeredAt: timestamp,
      fromStatus: oldStatus,
      toStatus: newStatus,
    };

    const historyEntries: PolicyHistoryLogEntry[] = [policyHistoryEntry];

    // Add owner change to history if applicable
    if (newOwner) {
      historyEntries.push({
        id: crypto.randomUUID(),
        action: 'assignee_changed',
        triggeredBy: 'System',
        triggeredAt: timestamp,
        assigneeType: 'owner',
        fromAssignee: lead.assignedTo,
        toAssignee: newOwner,
      });
    }

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== policyId) return record;
      return {
        ...record,
        endorsementStatus: newStatus,
        endorsementHistory: [...(record.endorsementHistory || []), endorsementEntry],
        historyLog: [...(record.historyLog || []), ...historyEntries],
      };
    });

    const leadHistoryEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'status_changed',
      triggeredBy: CURRENT_USER,
      triggeredAt: timestamp,
      fromStatus: oldStatus,
      toStatus: newStatus,
      comment: `${policy.kind.toUpperCase()} endorsement status changed`,
    };

    const updates: Partial<Lead> = {
      policyRecords: updatedRecords,
      assignedTo: newOwner || lead.assignedTo,
      historyLog: [...(lead.historyLog || []), leadHistoryEntry],
    };

    onLeadUpdate?.(lead.id, updates);
  };

  const handleStatusChange = (lead: Lead, newStatus: string) => {
    if (newStatus === 'rework_required') {
      const firstPolicy = lead.policyRecords?.[0];
      if (firstPolicy) {
        setSelectedPolicyForRemarks({ leadId: lead.id, policyId: firstPolicy.id, kind: firstPolicy.kind });
        setRemarksDialogOpen(true);
      }
      return;
    }

    // Renewal-specific validations
    if (lead.leadType === 'renewals') {
      const currentStatus = lead.saleStatus || 'price_pending';
      const allowed = getRenewalAllowedManualStatuses(currentStatus, lead);
      const hasCompletedRecheck = (lead as any)._hasCompletedRecheckPrice === true;
      const hasCompletedSpecialRequest = (lead as any)._hasCompletedSpecialRequest === true;
      const hasCompletedEither = hasCompletedRecheck || hasCompletedSpecialRequest;

      // Block if not in allowed manual transitions (and not same status)
      if (newStatus !== currentStatus && !allowed.includes(newStatus)) {
        // R-19a: specific message for pricelist_added block
        if (newStatus === 'pricelist_added' && hasCompletedEither) {
          toast.error(
            language === 'th'
              ? 'ไม่สามารถย้อนกลับไปยัง "เพิ่มเบี้ยงานต่ออายุแล้ว" ได้เนื่องจากผ่านขั้นตอน "รอยืนยันประวัติการเคลม" แล้ว สามารถตั้งค่าเป็น "ยืนยันเบี้ยงานต่ออายุแล้ว" แทนได้'
              : 'This lead has already been through Recheck Price (Claim). You cannot revert to Pricelist Added — you can set it to Pricelist Verified instead.',
            { duration: 5000 }
          );
        } else if (newStatus === 'pricelist_verified' && !hasCompletedEither) {
          // R-19c: specific message for pricelist_verified block
          toast.error(
            language === 'th'
              ? 'ไม่สามารถตั้งค่าเป็น "ยืนยันเบี้ยงานต่ออายุแล้ว" ได้ กรุณาดำเนินการ "รอยืนยันประวัติการเคลม" ก่อน'
              : 'You cannot manually set this lead to Pricelist Verified — Recheck Price (Claim) must be completed first.',
            { duration: 5000 }
          );
        } else {
          toast.error(
            language === 'th'
              ? 'ไม่สามารถเปลี่ยนสถานะนี้ได้'
              : 'This status transition is not allowed.',
            { duration: 3000 }
          );
        }
        return;
      }
    }

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Create history log entry for status change
    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'status_changed',
      triggeredBy: CURRENT_USER,
      triggeredAt: timestamp,
      fromStatus: lead.saleStatus,
      toStatus: newStatus,
    };

    const updates: Partial<Lead> = {
      saleStatus: newStatus as Lead['saleStatus'],
      reworkRequired: false,
      reworkReasonId: undefined,
      assignedTo: undefined,
      historyLog: [...(lead.historyLog || []), historyLogEntry],
    };

    // Auto-assign DE when entering pending_review at To Report stage
    if (stage === 'to_report' && newStatus === 'pending_review' && !lead.deAssignee) {
      const newDE = getNextDERoundRobin();
      updates.deAssignee = newDE;
      if (newDE) {
        updates.historyLog = [...(updates.historyLog || []), {
          id: crypto.randomUUID(),
          action: 'assignee_changed' as const,
          triggeredBy: 'System (Round Robin)',
          triggeredAt: timestamp,
          assigneeType: 'de' as const,
          fromAssignee: undefined,
          toAssignee: newDE,
        }];
      }
    }

    onLeadUpdate?.(lead.id, updates);
  };

  const handleReworkConfirm = (reasonId: string, details: string, attachments: ReworkAttachment[], autoResolveDate?: string) => {
    if (!selectedLead || !reasonId) return;

    const reworkConfig = reworkConfigs.find(r => r.id === reasonId);
    const reasonLabel = reworkConfig?.descriptionEn || 'Unknown';

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Check if this is a policy-level rework
    if (selectedPolicyId && selectedLead.policyRecords) {
      // Policy-level rework
      const policy = selectedLead.policyRecords.find(p => p.id === selectedPolicyId);
      if (!policy) return;

      const previousStatus = policy.status === 'rework_required' 
        ? (policy.reworkHistory?.find(e => !e.resolved)?.previousStatus || policy.status)
        : policy.status as PolicyStatus;

      const assignedOwner = computeReworkOwner(selectedLead, reasonId, policy);
      const isExternalReason = reworkConfig?.partyType === 'external';

      const newPolicyReworkEntry: PolicyReworkEntry = {
        id: crypto.randomUUID(),
        reasonId,
        reasonLabel,
        details,
        attachments,
        savedBy: CURRENT_USER,
        savedAt: timestamp,
        assignedTo: assignedOwner,
        previousStatus,
        ...(autoResolveDate ? { autoResolveDate } : {}),
      };

      // Determine new status: only change to rework_required if external reason
      // For internal reasons, keep the current status
      const willHaveExternalRework = isExternalReason || (policy.reworkHistory?.filter(e => !e.resolved).some(e => {
        const c = reworkConfigs.find(r => r.id === e.reasonId);
        return c?.partyType === 'external';
      }) || false);
      const newStatus: PolicyStatus = willHaveExternalRework ? 'rework_required' : previousStatus;

      // Create POLICY-LEVEL history entries (not lead-level)
      const historyEntries: PolicyHistoryLogEntry[] = [];
      
      // 1. Status change entry - only if status actually changes
      if (policy.status !== newStatus) {
        historyEntries.push({
          id: crypto.randomUUID(),
          action: 'status_changed',
          triggeredBy: CURRENT_USER,
          triggeredAt: timestamp,
          fromStatus: policy.status,
          toStatus: newStatus,
        });
      }

      // 2. Owner change entry (if applicable) - same timestamp
      const currentPolicyOwner = policy.reworkHistory?.find(e => !e.resolved)?.assignedTo;
      if (assignedOwner && assignedOwner !== currentPolicyOwner) {
        historyEntries.push({
          id: crypto.randomUUID(),
          action: 'assignee_changed',
          triggeredBy: CURRENT_USER,
          triggeredAt: timestamp,
          assigneeType: 'owner',
          fromAssignee: currentPolicyOwner || undefined,
          toAssignee: assignedOwner,
        });
      }

      const updatedRecords = selectedLead.policyRecords.map(record => {
        if (record.id !== selectedPolicyId) return record;
        
        return {
          ...record,
          status: newStatus,
          reworkRequired: true,
          reworkHistory: [...(record.reworkHistory || []), newPolicyReworkEntry],
          historyLog: [...(record.historyLog || []), ...historyEntries],
        };
      });

      const updates: Partial<Lead> = {
        policyRecords: updatedRecords,
        // Policy-level rework takes priority over normal ownership
        reworkRequired: true,
        assignedTo: assignedOwner,
      };

      onLeadUpdate?.(selectedLead.id, updates);

      setSelectedLead(null);
      setSelectedPolicyId(null);
      return;
    }

    // Lead-level rework (legacy)
    const previousStatus = selectedLead.saleStatus;
    
    const newHistoryEntry: ReworkHistoryEntry = {
      id: crypto.randomUUID(),
      reasonId,
      reasonLabel,
      details,
      attachments,
      savedBy: CURRENT_USER,
      savedAt: timestamp,
      previousStatus,
    };

    // Create history log entry for rework creation
    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_created',
      triggeredBy: CURRENT_USER,
      triggeredAt: timestamp,
      reworkReasonId: reasonId,
      reworkReasonLabel: reasonLabel,
      comment: details,
      attachments: attachments.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        url: a.url,
      })),
    };

    // Determine assigned owner based on assignment type
    let assignedOwner: string | undefined;
    if (reworkConfig) {
      if (reworkConfig.assignment === 'round_robin') {
        assignedOwner = getNextRoundRobinStaff(reworkConfig.team);
      } else if (reworkConfig.assignment === 'rf_sc') {
        // RF/SC assignment: prefer SC, fallback to RF
        assignedOwner = selectedLead.scAssignee || selectedLead.rfAssignee;
      }
    }

    onLeadUpdate?.(selectedLead.id, {
      reworkRequired: true,
      reworkReasonId: reasonId,
      assignedTo: assignedOwner,
      reworkHistory: [...selectedLead.reworkHistory, newHistoryEntry],
      historyLog: [...(selectedLead.historyLog || []), historyLogEntry],
    });

    setSelectedLead(null);
    setSelectedPolicyId(null);
  };

  const handleResolveRework = (lead: Lead, entryId: string) => {
    const entryIndex = lead.reworkHistory.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;

    const entry = lead.reworkHistory[entryIndex];
    const resolvedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Update the history entry with resolved status
    const updatedHistory = [...lead.reworkHistory];
    updatedHistory[entryIndex] = {
      ...entry,
      resolved: true,
      resolvedAt,
      resolvedBy: CURRENT_USER,
    };

    // Create history log entry for rework resolution
    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_resolved',
      triggeredBy: CURRENT_USER,
      triggeredAt: resolvedAt,
      reworkReasonId: entry.reasonId,
      reworkReasonLabel: entry.reasonLabel,
    };

    // Check if this is the latest unresolved rework entry
    const hasOtherUnresolvedRework = updatedHistory.some(
      (e, idx) => idx !== entryIndex && !e.resolved
    );

    // Restore previous status if no other unresolved rework exists
    const updates: Partial<Lead> = {
      reworkHistory: updatedHistory,
      historyLog: [...(lead.historyLog || []), historyLogEntry],
    };

    if (!hasOtherUnresolvedRework) {
      updates.reworkRequired = false;
      updates.reworkReasonId = undefined;
      updates.assignedTo = undefined;
      // Restore to previous status or default for this stage
      const restoredStatus = entry.previousStatus || defaultStatusByStage[stage] as Lead['saleStatus'];
      updates.saleStatus = restoredStatus;
      
      // Add status change to history log
      updates.historyLog = [...(updates.historyLog || []), {
        id: crypto.randomUUID(),
        action: 'status_changed' as const,
        triggeredBy: 'System',
        triggeredAt: resolvedAt,
        fromStatus: 'rework_required',
        toStatus: restoredStatus,
      }];
    }

    onLeadUpdate?.(lead.id, updates);
  };

  const handleReassignRework = (lead: Lead, entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => {
    const entryIndex = lead.reworkHistory.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;

    const entry = lead.reworkHistory[entryIndex];
    const newReworkConfig = reworkConfigs.find(r => r.id === newReasonId);
    const newReasonLabel = newReworkConfig?.descriptionEn || 'Unknown';

    const resolvedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Mark original entry as resolved (reassigned)
    const updatedHistory = [...lead.reworkHistory];
    updatedHistory[entryIndex] = {
      ...entry,
      resolved: true,
      resolvedAt,
      resolvedBy: `${CURRENT_USER} (Reassigned)`,
    };

    // Create new rework entry with the new reason
    const newHistoryEntry: ReworkHistoryEntry = {
      id: crypto.randomUUID(),
      reasonId: newReasonId,
      reasonLabel: newReasonLabel,
      details: details || `Reassigned from: ${entry.reasonLabel}`,
      attachments,
      savedBy: CURRENT_USER,
      savedAt: resolvedAt,
      previousStatus: entry.previousStatus, // Keep the original previous status
    };

    // Determine new assigned owner based on assignment type
    let assignedOwner: string | undefined;
    if (newReworkConfig) {
      if (newReworkConfig.assignment === 'round_robin') {
        assignedOwner = getNextRoundRobinStaff(newReworkConfig.team);
      } else if (newReworkConfig.assignment === 'rf_sc') {
        assignedOwner = lead.scAssignee || lead.rfAssignee;
      }
    }

    // Create history log entry for rework reassignment
    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_reassigned',
      triggeredBy: CURRENT_USER,
      triggeredAt: resolvedAt,
      reworkReasonId: newReasonId,
      reworkReasonLabel: newReasonLabel,
      toAssignee: assignedOwner,
      comment: details || `Reassigned from: ${entry.reasonLabel}`,
      attachments: attachments.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        url: a.url,
      })),
    };

    // Build the updated history with the new entry appended
    const newHistory = [...updatedHistory, newHistoryEntry];

    const updates: Partial<Lead> = {
      reworkHistory: newHistory,
      reworkReasonId: newReasonId,
      assignedTo: assignedOwner,
      // Keep reworkRequired as true since we're just reassigning
      reworkRequired: true,
      historyLog: [...(lead.historyLog || []), historyLogEntry],
    };

    onLeadUpdate?.(lead.id, updates);
  };

  const handleOpenHistoryLog = (lead: Lead) => {
    setSelectedLead(lead);
    setHistoryLogDialogOpen(true);
  };

  const handleOpenRemarks = (leadId: string, policyId: string, kind: 'vmi' | 'cmi') => {
    setSelectedPolicyForRemarks({ leadId, policyId, kind });
    setRemarksDialogOpen(true);
  };

  const handleAddRemark = (comment: string, attachments?: ReworkAttachment[]) => {
    if (!selectedPolicyForRemarks) return;

    const lead = leads.find(l => l.id === selectedPolicyForRemarks.leadId);
    if (!lead || !lead.policyRecords) return;

    const timestamp = new Date().toISOString();
    const newRemark = {
      id: crypto.randomUUID(),
      comment,
      attachments,
      createdBy: CURRENT_USER,
      createdAt: timestamp,
    };

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== selectedPolicyForRemarks.policyId) return record;
      
      const policyHistoryEntry: PolicyHistoryLogEntry = {
        id: crypto.randomUUID(),
        action: 'remark_added',
        triggeredBy: CURRENT_USER,
        triggeredAt: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        comment,
      };

      return {
        ...record,
        remarks: [...(record.remarks || []), newRemark],
        historyLog: [...(record.historyLog || []), policyHistoryEntry],
      };
    });

    onLeadUpdate?.(lead.id, { policyRecords: updatedRecords });
  };

  const handleAddRemarkReply = (remarkId: string, comment: string, attachments?: ReworkAttachment[]) => {
    if (!selectedPolicyForRemarks) return;

    const lead = leads.find(l => l.id === selectedPolicyForRemarks.leadId);
    if (!lead || !lead.policyRecords) return;

    const newReply = {
      id: crypto.randomUUID(),
      comment,
      attachments,
      createdBy: CURRENT_USER,
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== selectedPolicyForRemarks.policyId) return record;
      
      const updatedRemarks = record.remarks?.map(remark => {
        if (remark.id !== remarkId) return remark;
        return {
          ...remark,
          replies: [...(remark.replies || []), newReply],
        };
      });

      return {
        ...record,
        remarks: updatedRemarks,
      };
    });

    onLeadUpdate?.(lead.id, { policyRecords: updatedRecords });
  };

  const handleAddReworkReply = (entryId: string, comment: string, attachments?: ReworkAttachment[]) => {
    if (!selectedPolicyForRemarks) return;

    const lead = leads.find(l => l.id === selectedPolicyForRemarks.leadId);
    if (!lead || !lead.policyRecords) return;

    const newReply = {
      id: crypto.randomUUID(),
      comment,
      attachments,
      createdBy: CURRENT_USER,
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== selectedPolicyForRemarks.policyId) return record;
      
      const updatedReworkHistory = record.reworkHistory?.map(entry => {
        if (entry.id !== entryId) return entry;
        return {
          ...entry,
          replies: [...(entry.replies || []), newReply],
        };
      });

      return {
        ...record,
        reworkHistory: updatedReworkHistory,
      };
    });

    onLeadUpdate?.(lead.id, { policyRecords: updatedRecords });
  };

  const handleAddEndorsementReply = (entryId: string, comment: string, attachments?: ReworkAttachment[]) => {
    if (!selectedPolicyForRemarks) return;

    const lead = leads.find(l => l.id === selectedPolicyForRemarks.leadId);
    if (!lead || !lead.policyRecords) return;

    const newReply = {
      id: crypto.randomUUID(),
      comment,
      attachments,
      createdBy: CURRENT_USER,
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== selectedPolicyForRemarks.policyId) return record;
      
      const updatedEndorsementHistory = record.endorsementHistory?.map(entry => {
        if (entry.id !== entryId) return entry;
        return {
          ...entry,
          replies: [...(entry.replies || []), newReply],
        };
      });

      return {
        ...record,
        endorsementHistory: updatedEndorsementHistory,
      };
    });

    onLeadUpdate?.(lead.id, { policyRecords: updatedRecords });
  };


  const sortedLeads = [...leads].sort((a, b) => {
    const dateA = parseDateTime(a.createdOn).getTime();
    const dateB = parseDateTime(b.createdOn).getTime();
    
    const comparison = dateB - dateA; // descending (newest first)
    if (comparison !== 0) return comparison;
    
    // Then prioritize rework required (lead-level OR any policy-level)
    const aHasPolicyRework = Boolean(getLeadActivePolicyRework(a));
    const bHasPolicyRework = Boolean(getLeadActivePolicyRework(b));
    const aIsRework = a.reworkRequired || aHasPolicyRework;
    const bIsRework = b.reworkRequired || bHasPolicyRework;
    if (aIsRework && !bIsRework) return -1;
    if (!aIsRework && bIsRework) return 1;
    return 0;
  });

  // Pagination
  const totalItems = sortedLeads.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  // Get owner based on stage and rework status (lead-level, for backwards compatibility)
  const getOwner = (lead: Lead): string | undefined => {
    // Policy-level rework takes priority over everything
    const activePolicyRework = getLeadActivePolicyRework(lead);
    if (activePolicyRework) {
      return lead.assignedTo || computeReworkOwner(lead, activePolicyRework.entry.reasonId);
    }

    // If rework is required, assignedTo takes priority
    if (lead.reworkRequired && lead.assignedTo) {
      return lead.assignedTo;
    }

    // Stage-specific ownership logic
    if (stage === 'all') {
      // For "All" tab, show DE if assigned, else SC/RF
      return lead.deAssignee || lead.scAssignee || lead.rfAssignee;
    } else if (stage === 'to_convert' || stage === 'to_pay') {
      // To Convert and To Pay: SC if available, else RF (DE not assigned yet)
      return lead.scAssignee || lead.rfAssignee;
    } else {
      // All other stages: DE is the owner (unless rework)
      return lead.deAssignee;
    }
  };

  // Helper to check if a policy has reached terminal state (no owner needed)
  const isPolicyTerminal = (policy: PolicyRecord): boolean => {
    // Policy Cancelled is always terminal
    if (policy.status === 'policy_cancelled') {
      return true;
    }
    // Policy Issued is terminal for E-Policy and Print by Myself
    if (policy.status === 'policy_issued') {
      const shippingMethod = policy.shippingMethod;
      if (shippingMethod === 'e_policy' || shippingMethod === 'print_by_myself') {
        return true;
      }
    }
    // Policy Delivered is terminal for Print by FairDee
    if (policy.status === 'policy_delivered') {
      return true;
    }
    return false;
  };

  // Get owners for a specific policy row (policy-level)
  // Status-based ownership per the owner role mapping table:
  // - Lead/Renewal statuses: SC > RF (except terminal Invalid/Renewal Rejected → empty)
  // - Pending (to_pay): SC > RF
  // - Pending Review: DE (sticky, else round-robin)
  // - Pending Issuance: Admin on policy (sticky, else round-robin) — only if triggered
  // - Policy Uploaded/Shipped: Delivery on policy (sticky, else round-robin) — only if print_by_fairdee
  // - Policy Delivered/Cancelled: empty (terminal)
  // Rework/endorsement owners override when active.
  const getPolicyOwners = (lead: Lead, policy: PolicyRecord): string[] => {
    // Terminal state - no owner needed
    if (isPolicyTerminal(policy)) {
      return [];
    }

    // Collect owners from both active endorsements and active reworks
    const allOwners: string[] = [];

    // Endorsement owners (from latest non-terminal entry)
    if (policy.endorsementHistory && policy.endorsementHistory.length > 0) {
      const latestEndorsement = policy.endorsementHistory[policy.endorsementHistory.length - 1];
      const isTerminal = latestEndorsement.toStatus === 'request_approved' || latestEndorsement.toStatus === 'invalid';
      if (!isTerminal && latestEndorsement.assignedTo) {
        allOwners.push(latestEndorsement.assignedTo);
      }
    }

    // Rework owners (from all active/unresolved entries)
    if (policy.reworkHistory) {
      const activeReworks = policy.reworkHistory.filter(e => !e.resolved);
      if (activeReworks.length > 0) {
        const reworkOwners = activeReworks
          .map(e => e.assignedTo || computeReworkOwner(lead, e.reasonId, policy))
          .filter((owner): owner is string => !!owner);
        allOwners.push(...reworkOwners);
      }
    }

    // Return unique owners if any
    if (allOwners.length > 0) {
      return [...new Set(allOwners)];
    }

    // No active rework on this policy - use status-based owner
    const policyStatus = policy.status;
    
    switch (policyStatus) {
      case 'pending_payment':
        // SC > RF (sale-level)
        return lead.scAssignee ? [lead.scAssignee] : lead.rfAssignee ? [lead.rfAssignee] : [];
      
      case 'pending_review':
        // DE (sale-level, sticky)
        return lead.deAssignee ? [lead.deAssignee] : [];
      
      case 'pending_issuance':
        // Admin (policy-level, sticky)
        return policy.adminAssignee ? [policy.adminAssignee] : [];
      
      case 'policy_issued':
        // Delivery only if print_by_fairdee, else no owner (terminal for e_policy/print_by_myself)
        if (policy.shippingMethod === 'print_by_fairdee') {
          return policy.deliveryAssignee ? [policy.deliveryAssignee] : [];
        }
        return []; // terminal for other shipping methods
      
      case 'policy_shipped':
        // Delivery only if print_by_fairdee
        if (policy.shippingMethod === 'print_by_fairdee') {
          return policy.deliveryAssignee ? [policy.deliveryAssignee] : [];
        }
        return [];
      
      case 'policy_delivered':
      case 'policy_cancelled':
        return []; // terminal
      
      default:
        // Fallback: use stage-based logic
        const policyStage = getPolicyStage(policy);
        const effectiveStage = policyStage || stage;
        let stageOwner: string | undefined;
        if (effectiveStage === 'to_convert' || effectiveStage === 'to_pay') {
          stageOwner = lead.scAssignee || lead.rfAssignee;
        } else {
          stageOwner = lead.deAssignee;
        }
        return stageOwner ? [stageOwner] : [];
    }
  };

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Expand/Collapse All button for post-lead stages */}
        {isPostLeadStage && paginatedLeads.some(l => (l.policyRecords || []).length > 0) && (
          <div className="flex items-center justify-start px-4 py-1.5 border-b border-border bg-muted/30">
            <button
              onClick={() => {
                const allExpanded = paginatedLeads.every(l => expandedLeads.has(l.id));
                setExpandedLeads(prev => {
                  const newSet = new Set(prev);
                  if (allExpanded) {
                    paginatedLeads.forEach(l => newSet.delete(l.id));
                  } else {
                    paginatedLeads.forEach(l => {
                      if ((l.policyRecords || []).length > 0) newSet.add(l.id);
                    });
                  }
                  return newSet;
                });
              }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              {paginatedLeads.every(l => expandedLeads.has(l.id))
                ? (language === 'th' ? 'ย่อทั้งหมด' : 'Collapse All')
                : (language === 'th' ? 'ขยายทั้งหมด' : 'Expand All')
              }
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="data-table-header px-4 py-3 text-left">{stage === 'to_convert' ? 'Lead ID' : 'Quotation ID'}</th>
                <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'แท็ก' : 'Tags'}</th>
                <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'ตัวแทน' : 'Agent'}</th>
                <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'สร้างเมื่อ' : 'Created On'}</th>
                {isPostLeadStage && (
                  <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'รายละเอียดคุ้มครอง' : 'Coverage Details'}</th>
                )}
                <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'รายละเอียดรถ' : 'Vehicle details'}</th>
                {isPostLeadStage && (
                  <>
                    <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'เบี้ยประกัน' : 'Premium'}</th>
                    <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'วิธีชำระเงิน' : 'Payment Method'}</th>
                    <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'สถานะการชำระเงิน' : 'Payment Status'}</th>
                  </>
                )}
                <th className="data-table-header px-4 py-3 text-left">RF</th>
                <th className="data-table-header px-4 py-3 text-left">SC</th>
                {showDEColumn && (
                  <th className="data-table-header px-4 py-3 text-left">DE</th>
                )}
                {isPostLeadStage && (
                  <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'สถานะ ETA' : 'ETA Status'}</th>
                )}
                {!isPostLeadStage && (
                  <>
                    <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}</th>
                    <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'สถานะ ETA' : 'ETA Status'}</th>
                    <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'สถานะงาน' : 'Lead Status'}</th>
                  </>
                )}
                {/* Owner column hidden - now at policy row level. Uncomment to restore:
                <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}</th>
                */}
                <th className="data-table-header w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.length === 0 ? (
                <tr>
                   <td colSpan={isPostLeadStage ? (showDEColumn ? 14 : 13) : 11} className="px-4 py-12 text-center text-muted-foreground">
                    {language === 'th' ? 'ไม่พบเคสของคุณ ณ ตอนนี้' : 'No cases found at the moment'}
                  </td>
                </tr>
              ) : (
              paginatedLeads.map((lead) => {
                // Get the latest unresolved rework entry (entries are appended, so search from end)
                const latestReworkEntry = [...lead.reworkHistory].reverse().find(e => !e.resolved);
                const hasActiveRework = lead.reworkRequired && latestReworkEntry && !latestReworkEntry.resolved;
                
                // Get only the policy records relevant to this stage
                const stagePolicies = isPostLeadStage ? getPoliciesForStage(lead, stage) : [];
                // Get VMI and CMI policies
                const allPolicies = lead.policyRecords || [];
                const vmiPolicy = allPolicies.find(p => p.kind === 'vmi');
                const cmiPolicy = allPolicies.find(p => p.kind === 'cmi');
                // Check if each policy is editable (in current stage)
                const isVmiEditable = vmiPolicy ? stagePolicies.some(p => p.id === vmiPolicy.id) : false;
                const isCmiEditable = cmiPolicy ? stagePolicies.some(p => p.id === cmiPolicy.id) : false;
                const isExpanded = expandedLeads.has(lead.id);
                const hasPolicies = allPolicies.length > 0;
                
                return (
                  <React.Fragment key={lead.id}>
                    <tr className="data-table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {/* Expand/Collapse chevron for post-lead stages only */}
                          {(isPostLeadStage && hasPolicies) ? (
                            <button 
                              onClick={() => toggleLeadExpanded(lead.id)}
                              className="mt-0.5 p-0.5 hover:bg-muted rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          ) : (
                            <div className="w-5" /> 
                          )}
                          <span className="font-medium text-sm">{lead.leadNumber}</span>
                        </div>
                      </td>
                      {/* Tags Column - 2 tags per row */}
                      <td className="px-4 py-3">
                        {(() => {
                          const policies = lead.policyRecords || [];
                          const hasEndorsement = policies.some(p => p.endorsementType === 'policy_endorsement');
                          const hasCancellation = policies.some(p => p.endorsementType === 'policy_cancellation');

                          // Collect all tags into a flat array
                          const tags: React.ReactNode[] = [];
                          tags.push(<CreatedByBadge key="created" createdBy={lead.createdBy} stage={stage} />);
                          if (stage === 'to_convert') {
                            tags.push(<LeadSourceBadge key="source" leadType={lead.leadType} leadSource={lead.leadSource} />);
                          }
                          if (lead.saleId) {
                            tags.push(
                              <span
                                key="sale"
                                title={lead.saleId}
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              >
                                {language === 'th' ? 'การขาย' : 'Sale'}
                              </span>
                            );
                          }
                          if (lead.policyType) {
                            tags.push(
                              <span key="vmi" className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">VMI</span>
                            );
                            if (lead.policyType === 'vmi_cmi') {
                              tags.push(
                                <span key="cmi" className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">CMI</span>
                              );
                            }
                          }
                          if (hasEndorsement) {
                            tags.push(
                              <span key="endorse" className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                {language === 'th' ? 'สลักหลัง' : 'Endorse'}
                              </span>
                            );
                          }
                          if (hasCancellation) {
                            tags.push(
                              <span key="cancel" className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                              </span>
                            );
                          }

                          // Chunk into rows of 2
                          const rows: React.ReactNode[][] = [];
                          for (let i = 0; i < tags.length; i += 2) {
                            rows.push(tags.slice(i, i + 2));
                          }

                          return (
                            <div className="flex flex-col gap-1">
                              {rows.map((row, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  {row}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <a
                            href="#"
                            className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
                          >
                            {lead.agentId}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-xs text-muted-foreground">{lead.agentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{lead.createdOn.split(' ')[0]}</span>
                          <span className="text-xs text-muted-foreground">{lead.createdOn.split(' ')[1] || ''}</span>
                        </div>
                      </td>
                      {isPostLeadStage && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {lead.insuranceClass ? `${language === 'th' ? 'ชั้น' : 'Class'} ${lead.insuranceClass} · ${lead.garageType === 'Dealer' ? (language === 'th' ? 'ซ่อมห้าง' : 'Dealer') : (language === 'th' ? 'ซ่อมอู่' : 'Garage')}` : '-'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {lead.insurerName ? (language === 'th' ? lead.insurerNameTh : lead.insurerName) : '-'}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{lead.vehicleDetails || '-'}</span>
                          <span className="text-xs text-muted-foreground">
                            {lead.vehicleBrand && lead.vehicleSubBrand && lead.vehicleYear
                              ? `${lead.vehicleBrand} ${lead.vehicleSubBrand} ${lead.vehicleYear}`
                              : 'N/A'}
                          </span>
                        </div>
                      </td>
                      {isPostLeadStage && (
                        <>
                          <td className="px-4 py-3 text-sm">{getPremiumDisplay(lead, stage)}</td>
                          <td className="px-4 py-3">
                            {stage === 'to_pay' || areBothPoliciesPending(lead) ? (
                              <span className="text-sm">-</span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{getPaymentMethodLabel(lead, language)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {lead.paymentType === 'installment' && lead.installmentCount
                                    ? (language === 'th' ? `งานเงินผ่อน ${lead.installmentCount} งวด` : `Installment (${lead.installmentCount})`)
                                    : (language === 'th' ? 'งานเงินสด' : 'Full Payment')
                                  }
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {stage === 'to_pay' || areBothPoliciesPending(lead) ? (
                              <span className="text-sm">-</span>
                            ) : (
                              (() => {
                                const currentStatus = getPaymentStatusForStage(stage);
                                const handlePaymentStatusChange = (newValue: string) => {
                                  // Show error toast when trying to change
                                  toast.error(
                                    language === 'th' 
                                      ? 'ไม่สามารถเปลี่ยนสถานะการชำระเงินได้ที่นี่' 
                                      : 'Cannot change payment status from here'
                                  );
                                };
                                
                                return (
                                  <Select value={currentStatus} onValueChange={handlePaymentStatusChange}>
                                    <SelectTrigger className="w-[180px] h-8 text-xs">
                                      <SelectValue>
                                        {getPaymentStatusLabelByMethod(lead, stage, language)}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="cbc_to_fairdee_verified">
                                        {paymentStatusByMethod.cbc_to_fairdee[language]}
                                      </SelectItem>
                                      <SelectItem value="cbc_to_insurer_notified">
                                        {paymentStatusByMethod.cbc_to_insurer[language]}
                                      </SelectItem>
                                      <SelectItem value="credit_approved">
                                        {paymentStatusByMethod.credit[language]}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                );
                              })()
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <Select 
                          value={lead.rfAssignee || '__none__'}
                          onValueChange={(value) => onLeadUpdate?.(lead.id, { rfAssignee: value === '__none__' ? undefined : value })}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="Select RF" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-muted-foreground">
                              {language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'}
                            </SelectItem>
                            {getRFStaff().map((staff) => (
                              <SelectItem key={staff.id} value={staff.name}>
                                {staff.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={lead.scAssignee || '__none__'}
                          onValueChange={(value) => onLeadUpdate?.(lead.id, { scAssignee: value === '__none__' ? undefined : value })}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder={language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-muted-foreground">
                              {language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'}
                            </SelectItem>
                            {getSCStaff().map((staff) => (
                              <SelectItem key={staff.id} value={staff.name}>
                                {staff.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      {showDEColumn && (
                        <td className="px-4 py-3">
                          <Select
                            value={lead.deAssignee || '__none__'}
                            onValueChange={(value) => onLeadUpdate?.(lead.id, { deAssignee: value === '__none__' ? undefined : value })}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue placeholder={language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__" className="text-muted-foreground">
                                {language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'}
                              </SelectItem>
                              {getDEStaff().map((staff) => (
                                <SelectItem key={staff.id} value={staff.name}>
                                  {staff.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      )}
                      {/* ETA Status Cell for post-lead stages */}
                      {isPostLeadStage && (
                        <td className="px-4 py-3">
                          {(() => {
                            const eta = lead.etaStatus;
                            if (eta === 'breached') {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full" style={{ color: '#DC2626', backgroundColor: 'rgba(220, 38, 38, 0.08)' }}>
                                  <CalendarClock className="w-3.5 h-3.5" />
                                  {lead.etaDaysOverdue || 0} {language === 'th' ? 'วัน' : 'Days'}
                                </span>
                              );
                            } else if (eta === 'on_time') {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full" style={{ color: '#16A34A', backgroundColor: 'rgba(22, 163, 74, 0.08)' }}>
                                  <CalendarClock className="w-3.5 h-3.5" />
                                  {language === 'th' ? 'ตามกำหนด' : 'On Time'}
                                </span>
                              );
                            }
                            return <span className="text-xs text-muted-foreground">-</span>;
                          })()}
                        </td>
                      )}
                      {!isPostLeadStage && (
                        <>
                          {/* Owner Cell - SC if exists, else RF */}
                          <td className="px-4 py-3">
                            {(() => {
                              const owner = lead.scAssignee || lead.rfAssignee;
                              if (owner) {
                                return <span className="text-sm font-medium">{owner}</span>;
                              }
                              return <span className="text-xs text-muted-foreground">-</span>;
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              // For Leads stage, use sale-level etaStatus if available, else derive from insurer quotes
                              const eta = lead.etaStatus;
                              const quotes = lead.insurerQuotes || [];
                              const hasBreached = eta === 'breached' || quotes.some(q => q.etaStatus === 'breached');
                              const hasOnTime = eta === 'on_time' || quotes.some(q => q.etaStatus === 'on_time');
                              const daysOverdue = lead.etaDaysOverdue || quotes.find(q => q.etaStatus === 'breached')?.daysOverdue || 0;
                              
                              if (hasBreached) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full" style={{ color: '#DC2626', backgroundColor: 'rgba(220, 38, 38, 0.08)' }}>
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    {daysOverdue} {language === 'th' ? 'วัน' : 'Days'}
                                  </span>
                                );
                              } else if (hasOnTime) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full" style={{ color: '#16A34A', backgroundColor: 'rgba(22, 163, 74, 0.08)' }}>
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    {language === 'th' ? 'ตามกำหนด' : 'On Time'}
                                  </span>
                                );
                              }
                              return <span className="text-xs text-muted-foreground">-</span>;
                            })()}
                          </td>
                          {/* Status Cell */}
                          <td className="px-4 py-3">
                            {hasActiveRework ? (
                              <InlineReworkActions
                                lead={lead}
                                latestEntry={latestReworkEntry}
                                reworkConfigs={reworkConfigs}
                                onResolve={handleResolveRework}
                                onReassign={handleReassignRework}
                              />
                            ) : (
                            <Select 
                                value={lead.saleStatus || defaultStatusByStage[stage]}
                                onValueChange={(value) => handleStatusChange(lead, value)}
                              >
                                <SelectTrigger 
                                  className="w-[220px] h-8 text-xs"
                                  style={getStatusStyles(lead.saleStatus || defaultStatusByStage[stage], leadStatusColors)}
                                >
                                  <SelectValue placeholder={language === 'th' ? 'เลือกสถานะ' : 'Select status'} />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    // For renewals, show all renewal statuses in dropdown
                                    if (stage === 'to_convert' && lead.leadType === 'renewals') {
                                      const allRenewalStatuses = [
                                        'price_pending',
                                        'request_sent_to_insurer',
                                        'pricelist_added',
                                        'revision_pending',
                                        'recheck_price_claim',
                                        'special_request_pending',
                                        'pricelist_verified',
                                        'quotation_shared_to_agent',
                                        'renewal_rejected',
                                        'invalid',
                                      ];
                                      const currentStatus = lead.saleStatus || 'price_pending';
                                      const allowed = getRenewalAllowedManualStatuses(currentStatus, lead);
                                      return allRenewalStatuses.map((statusValue) => {
                                        const isAllowed = statusValue === currentStatus || allowed.includes(statusValue);
                                        return (
                                          <SelectItem 
                                            key={statusValue} 
                                            value={statusValue}
                                            disabled={!isAllowed}
                                            className={!isAllowed ? 'opacity-40' : ''}
                                          >
                                            {getStatusLabel(statusValue, language)}
                                          </SelectItem>
                                        );
                                      });
                                    }
                                    // For other lead types, use static options
                                    const options = stage === 'to_convert' && lead.leadType 
                                      ? statusOptionsByLeadType[lead.leadType] || statusOptionsByStage[stage]
                                      : statusOptionsByStage[stage];
                                    return options.map((statusValue) => (
                                      <SelectItem key={statusValue} value={statusValue}>
                                        {getStatusLabel(statusValue, language)}
                                      </SelectItem>
                                    ));
                                  })()}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                        </>
                      )}
                      {/* Owner cell hidden - now at policy row level. Uncomment to restore:
                      <td className="px-4 py-3">
                        {(() => {
                          const owner = getOwner(lead);
                          if (owner) {
                            return (
                              <span className="text-sm px-2 py-1 bg-muted rounded">
                                {owner}
                              </span>
                            );
                          }
                          return <span className="text-xs text-muted-foreground">-</span>;
                        })()}
                      </td>
                      */}
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* View Details - Hidden for now
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              {language === 'th' ? 'ดูรายละเอียด' : 'View Details'}
                            </DropdownMenuItem>
                            */}
                            <DropdownMenuItem onClick={() => handleOpenHistoryLog(lead)}>
                              <History className="w-4 h-4 mr-2" />
                              {language === 'th' ? 'ประวัติการทำงาน' : 'History Log'}
                            </DropdownMenuItem>
                            {/* Upload Pricelist: visible at price_pending, request_sent_to_insurer, revision_pending, recheck_price_claim, special_request_pending */}
                            {lead.leadType === 'renewals' && ['price_pending', 'request_sent_to_insurer', 'revision_pending', 'recheck_price_claim', 'special_request_pending'].includes(lead.saleStatus) && (
                              <DropdownMenuItem onClick={() => {
                                if (!lead) return;
                                const hasCompletedRecheck = (lead as any)._hasCompletedRecheckPrice === true;
                                const hasCompletedSpecialRequest = (lead as any)._hasCompletedSpecialRequest === true;
                                const hasCompletedEither = hasCompletedRecheck || hasCompletedSpecialRequest;
                                // R-12/R-28: If recheck/special request done → Pricelist Verified, else → Pricelist Added
                                // R-20: Returning from Revision Pending → Pricelist Added
                                const newStatus = (hasCompletedEither || lead.saleStatus === 'recheck_price_claim' || lead.saleStatus === 'special_request_pending')
                                  ? 'pricelist_verified' 
                                  : 'pricelist_added';
                                const timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                onLeadUpdate?.(lead.id, {
                                  saleStatus: newStatus as Lead['saleStatus'],
                                  historyLog: [...(lead.historyLog || []), {
                                    id: crypto.randomUUID(),
                                    action: 'status_changed' as const,
                                    triggeredBy: CURRENT_USER,
                                    triggeredAt: timestamp,
                                    fromStatus: lead.saleStatus,
                                    toStatus: newStatus,
                                    comment: 'Pricelist uploaded',
                                  }],
                                });
                                toast.success(language === 'th' ? 'อัปโหลดรายการราคาเรียบร้อย' : 'Pricelist uploaded successfully');
                              }}>
                                <Upload className="w-4 h-4 mr-2" />
                                {language === 'th' ? 'อัปโหลดรายการราคา' : 'Upload Pricelist'}
                              </DropdownMenuItem>
                            )}
                            {/* R-21: Recheck Price visible at pricelist_added or pricelist_verified */}
                            {lead.leadType === 'renewals' && (lead.saleStatus === 'pricelist_added' || lead.saleStatus === 'pricelist_verified') && (
                              <DropdownMenuItem onClick={() => { setEmailModalLead(lead); setRecheckPriceOpen(true); }}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {language === 'th' ? 'ตรวจสอบราคาใหม่ (เคลม)' : 'Recheck Price (Claim)'}
                              </DropdownMenuItem>
                            )}
                            {/* R-26: Request Exception visible at renewal_rejected */}
                            {lead.leadType === 'renewals' && lead.saleStatus === 'renewal_rejected' && (
                              <DropdownMenuItem onClick={() => { setEmailModalLead(lead); setRequestExceptionOpen(true); }}>
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {language === 'th' ? 'ขออนุโลม' : 'Request Exception'}
                              </DropdownMenuItem>
                            )}
                            {/* R-30: Share Quotation / Go to Quotes visible at pricelist_added, recheck_price_claim, pricelist_verified */}
                            {lead.leadType === 'renewals' && ['pricelist_added', 'recheck_price_claim', 'pricelist_verified'].includes(lead.saleStatus) && (
                              <DropdownMenuItem onClick={() => {
                                if (!lead) return;
                                const timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                onLeadUpdate?.(lead.id, {
                                  saleStatus: 'quotation_shared_to_agent' as Lead['saleStatus'],
                                  historyLog: [...(lead.historyLog || []), {
                                    id: crypto.randomUUID(),
                                    action: 'status_changed' as const,
                                    triggeredBy: CURRENT_USER,
                                    triggeredAt: timestamp,
                                    fromStatus: lead.saleStatus,
                                    toStatus: 'quotation_shared_to_agent',
                                    comment: 'Quotation shared to agent',
                                  }],
                                });
                                toast.success(language === 'th' ? 'ส่งเบี้ยให้ตัวแทนเรียบร้อย' : 'Quotation shared to agent');
                              }}>
                                <Share2 className="w-4 h-4 mr-2" />
                                {language === 'th' ? 'ส่งเบี้ยให้ตัวแทน (Go to Quotes)' : 'Share Quotation (Go to Quotes)'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    
                    {/* Expanded Insurer Rows for Leads Stage (New Leads / COA) - Hidden for now
                    {stage === 'to_convert' && isExpanded && (lead.leadType === 'new_leads' || lead.leadType === 'coa') && lead.insurerQuotes && lead.insurerQuotes.length > 0 && (
                      <tr>
                        <td colSpan={showDEColumn ? 12 : 11} className="p-0">
                          <div className="mx-4 my-2">
                            <InsurersExpandableRow 
                              insurerQuotes={lead.insurerQuotes}
                              onQuoteUpdate={(quoteId, updates) => {
                                // Handle quote updates if needed
                                console.log('Quote update:', quoteId, updates);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                    */}
                    
                    {/* Expanded Policy Rows */}
                    {isPostLeadStage && isExpanded && allPolicies.length > 0 && (
                      <tr className="border-b border-border">
                         <td colSpan={showDEColumn ? 12 : 11} className="p-0">
                          <div className="mx-4 my-2 rounded-lg border border-border overflow-hidden bg-card shadow-sm">
                            {/* Policy Sub-Table */}
                            <div className="overflow-x-auto">
                              {/* Policy Sub-Table Header */}
                              <div className="flex gap-6 px-4 py-3 data-table-header border-b border-border min-w-max">
                                <div className="w-[50px] shrink-0">
                                  {language === 'th' ? 'ประเภท' : 'Type'}
                                </div>
                                <div className="w-[120px] shrink-0">
                                  {language === 'th' ? 'วันที่อัปเดต' : 'Updated On'}
                                </div>
                                <div className="w-[120px] shrink-0">
                                  {language === 'th' ? 'วันที่อัปโหลด' : 'Uploaded On'}
                                </div>
                                <div className="w-[100px] shrink-0">
                                  {language === 'th' ? 'รูปแบบการพิมพ์' : 'Print Type'}
                                </div>
                                <div className="w-[90px] shrink-0">
                                  {language === 'th' ? 'วันเริ่มคุ้มครอง' : 'Start Date'}
                                </div>
                                <div className="w-[90px] shrink-0">
                                  {language === 'th' ? 'วันสิ้นคุ้มครอง' : 'End Date'}
                                </div>
                                <div className="w-[110px] shrink-0">
                                  {language === 'th' ? 'เลขกรมธรรม์' : 'Policy No.'}
                                </div>
                                <div className="w-[80px] shrink-0">
                                  {language === 'th' ? 'ไฟล์กรมธรรม์' : 'Policy File'}
                                </div>
                                <div className="w-[80px] shrink-0">
                                  {language === 'th' ? 'ติดตามพัสดุ' : 'Tracking'}
                                </div>
                                <div className="w-[120px] shrink-0">
                                  {language === 'th' ? 'ประเภทสลักหลัง' : 'Endorse. Type'}
                                </div>
                                <div className="w-[160px] shrink-0">
                                  {language === 'th' ? 'สถานะสลักหลัง' : 'Endorse. Status'}
                                </div>
                                <div className="w-[150px] shrink-0">
                                  {language === 'th' ? 'สถานะกรมธรรม์' : 'Policy Status'}
                                </div>
                                <div className="w-[130px] shrink-0">
                                  Admin
                                </div>
                                <div className="w-[130px] shrink-0">
                                  Delivery
                                </div>
                                <div className="w-[100px] shrink-0">
                                  {language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}
                                </div>
                                <div className="w-[70px] shrink-0">
                                  {language === 'th' ? 'หมายเหตุ' : 'Remarks'}
                                </div>
                              </div>
                            
                            {/* Policy Rows */}
                            <div className="divide-y divide-border">
                              {[...allPolicies]
                                .sort((a, b) => {
                                  if (a.kind === 'vmi' && b.kind === 'cmi') return -1;
                                  if (a.kind === 'cmi' && b.kind === 'vmi') return 1;
                                  return 0;
                                })
                                .map((policy, idx) => {
                                  const isEditable = stagePolicies.some(p => p.id === policy.id);
                                  const policyKindLabel = policy.kind === 'vmi' ? 'VMI' : 'CMI';
                                  
                                  const formatDate = (dateStr?: string) => {
                                    if (!dateStr) return '-';
                                    // Parse DD-MM-YYYY HH:MM format
                                    const [datePart, timePart] = dateStr.split(' ');
                                    if (!datePart) return '-';
                                    const [day, month, year] = datePart.split('-');
                                    const [hours, mins] = (timePart || '00:00').split(':');
                                    return `${day}/${month}/${year} ${hours}:${mins}`;
                                  };
                                  
                                  const formatDateOnly = (dateStr?: string) => {
                                    if (!dateStr) return '-';
                                    // Parse DD-MM-YYYY format (with optional time)
                                    const datePart = dateStr.split(' ')[0];
                                    const [day, month, year] = datePart.split('-');
                                    return `${day}/${month}/${year}`;
                                  };
                                  
                                  const getPrintingPreferenceLabel = (method?: string) => {
                                    if (!method) return '-';
                                    if (method === 'e_policy') return 'E-Policy';
                                    if (method === 'print_by_myself') return language === 'th' ? 'พิมพ์เอง' : 'Print by Myself';
                                    if (method === 'print_by_fairdee') return language === 'th' ? 'พิมพ์โดยแฟร์ดี' : 'Print by FairDee';
                                    return '-';
                                  };
                                  
                                  const remarkCount = policy.remarks?.length || 0;
                                  const reworkCount = policy.reworkHistory?.length || 0;
                                  const totalCount = remarkCount + reworkCount;
                                  
                                  // Show tracking button when print_by_fairdee and policy shipped/delivered
                                  const showTracking = policy.shippingMethod === 'print_by_fairdee' && 
                                    (policy.status === 'policy_shipped' || policy.status === 'policy_delivered');
                                  
                                    return (
                                      <div 
                                        key={policy.id}
                                        className={cn(
                                          "flex gap-6 px-4 py-3 items-center min-w-max data-table-subrow",
                                          policy.status === 'rework_required' && 'bg-warning/[0.06] hover:bg-warning/[0.10]'
                                        )}
                                      >
                                      {/* Policy Kind Badge */}
                                      <div className="w-[50px] shrink-0">
                                        <span className={cn(
                                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
                                          policy.kind === 'vmi'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                        )}>
                                          {policyKindLabel}
                                        </span>
                                      </div>
                                      
                                      {/* Updated On */}
                                      <div className="w-[120px] shrink-0 text-sm text-foreground">
                                        {policy.updatedOn ? formatDate(policy.updatedOn) : <span className="text-muted-foreground/50">-</span>}
                                      </div>
                                      
                                      {/* Policy Uploaded On */}
                                      <div className="w-[120px] shrink-0 text-sm text-foreground">
                                        {policy.policyUploadedOn ? formatDate(policy.policyUploadedOn) : <span className="text-muted-foreground/50">-</span>}
                                      </div>
                                      
                                      {/* Printing Preference */}
                                      <div className="w-[100px] shrink-0 text-sm text-foreground whitespace-nowrap">
                                        {policy.shippingMethod ? getPrintingPreferenceLabel(policy.shippingMethod) : <span className="text-muted-foreground/50">-</span>}
                                      </div>
                                      
                                      {/* Policy Start Date */}
                                      <div className="w-[90px] shrink-0 text-sm text-foreground">
                                        {policy.policyStartDate ? formatDateOnly(policy.policyStartDate) : <span className="text-muted-foreground/50">-</span>}
                                      </div>
                                      
                                      {/* Policy End Date - exactly 1 year after start date */}
                                      <div className="w-[90px] shrink-0 text-sm text-foreground">
                                        {policy.policyStartDate ? (() => {
                                          const datePart = policy.policyStartDate.split(' ')[0];
                                          const [day, month, year] = datePart.split('-');
                                          const endYear = parseInt(year, 10) + 1;
                                          return `${day}/${month}/${endYear}`;
                                        })() : <span className="text-muted-foreground/50">-</span>}
                                      </div>
                                      
                                      {/* Policy Number */}
                                      <div className="w-[110px] shrink-0 text-sm text-foreground font-mono">
                                        {policy.policyNumber || <span className="text-muted-foreground/50">-</span>}
                                      </div>
                                      
                                      {/* Policy File */}
                                      <div className="w-[80px] shrink-0">
                                        {policy.policyFileUrl ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-3 text-xs"
                                            onClick={() => window.open(policy.policyFileUrl, '_blank')}
                                          >
                                            <FileText className="w-4 h-4 mr-1" />
                                            {language === 'th' ? 'ดู' : 'View'}
                                          </Button>
                                        ) : (
                                          <span className="text-sm text-muted-foreground/50">-</span>
                                        )}
                                      </div>
                                      
                                      {/* Tracking */}
                                      <div className="w-[80px] shrink-0">
                                        {showTracking && policy.trackingNumber ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-3 text-xs"
                                            onClick={() => {
                                              window.open(`https://track.thailandpost.co.th/?trackNumber=${policy.trackingNumber}`, '_blank');
                                            }}
                                          >
                                            <Truck className="w-4 h-4 mr-1" />
                                            {language === 'th' ? 'ดู' : 'View'}
                                          </Button>
                                        ) : (
                                          <span className="text-sm text-muted-foreground/50">-</span>
                                        )}
                                      </div>
                                      
                                      {/* Endorsement Type */}
                                      <div className="w-[120px] shrink-0 text-sm text-foreground">
                                        {policy.endorsementType ? (
                                          policy.endorsementType === 'policy_endorsement' 
                                            ? (language === 'th' ? 'สลักหลังกรมธรรม์' : 'Policy Endorsement')
                                            : (language === 'th' ? 'ยกเลิกกรมธรรม์' : 'Policy Cancellation')
                                        ) : (
                                          <span className="text-muted-foreground/50">-</span>
                                        )}
                                      </div>
                                      
                                      {/* Endorsement Status - dropdown that validates against rework console */}
                                      <div className="w-[160px] shrink-0">
                                        {policy.endorsementType && policy.endorsementStatus ? (
                                          <Select
                                            value={policy.endorsementStatus}
                                            onValueChange={(newValue) => {
                                              if (newValue !== policy.endorsementStatus) {
                                                handleEndorsementStatusChange(lead, policy.id, newValue as EndorsementStatus);
                                              }
                                            }}
                                          >
                                            <SelectTrigger className="h-8 text-xs w-full">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover z-50">
                                              <SelectItem value="request_created" className="text-xs">
                                                {language === 'th' ? 'สร้างคำขอแล้ว' : 'Request Created'}
                                              </SelectItem>
                                              <SelectItem value="request_submitted" className="text-xs">
                                                {language === 'th' ? 'ส่งคำขอแล้ว' : 'Request Submitted'}
                                              </SelectItem>
                                              <SelectItem value="request_approved" className="text-xs">
                                                {language === 'th' ? 'อนุมัติคำขอแล้ว' : 'Request Approved'}
                                              </SelectItem>
                                              <SelectItem value="pending_on_ops" className="text-xs">
                                                {language === 'th' ? 'รอดำเนินการ Ops' : 'Pending on Ops'}
                                              </SelectItem>
                                              <SelectItem value="pending_finance" className="text-xs">
                                                {language === 'th' ? 'รอการเงิน' : 'Pending Finance'}
                                              </SelectItem>
                                              <SelectItem value="invalid" className="text-xs">
                                                {language === 'th' ? 'ไม่ถูกต้อง' : 'Invalid'}
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <span className="text-sm text-muted-foreground/50">-</span>
                                        )}
                                      </div>
                                      
                                      {/* Policy Status - moved to after Endorsement Status */}
                                      <div className="w-[150px] shrink-0">
                                      <PolicyStatusCell
                                          policy={policy}
                                          stage={stage}
                                          isEditable={isEditable}
                                          reworkConfigs={reworkConfigs}
                                          onStatusChange={(policyId, newStatus) => handlePolicyStatusChange(lead, policyId, newStatus)}
                                          onReworkAdd={(policyId, reasonId, details, attachments) => handlePolicyReworkAdd(lead, policyId, reasonId, details, attachments)}
                                          onOpenRemarks={(policyId) => handleOpenRemarks(lead.id, policyId, policy.kind)}
                                        />
                                      </div>
                                      
                                      {/* Admin Assignee (policy-level) */}
                                      <div className="w-[130px] shrink-0">
                                        <Select
                                          value={policy.adminAssignee || '__none__'}
                                          onValueChange={(value) => {
                                            const newAdmin = value === '__none__' ? undefined : value;
                                            const updatedRecords = lead.policyRecords?.map(r => 
                                              r.id === policy.id ? { ...r, adminAssignee: newAdmin } : r
                                            );
                                            onLeadUpdate?.(lead.id, { policyRecords: updatedRecords });
                                          }}
                                        >
                                          <SelectTrigger className="w-[120px] h-8 text-xs">
                                            <SelectValue placeholder={language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="__none__" className="text-muted-foreground">
                                              {language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'}
                                            </SelectItem>
                                            {getAdminStaff().map((staff) => (
                                              <SelectItem key={staff.id} value={staff.name}>
                                                {staff.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Delivery Assignee (policy-level) */}
                                      <div className="w-[130px] shrink-0">
                                        <Select
                                          value={policy.deliveryAssignee || '__none__'}
                                          onValueChange={(value) => {
                                            const newDelivery = value === '__none__' ? undefined : value;
                                            const updatedRecords = lead.policyRecords?.map(r => 
                                              r.id === policy.id ? { ...r, deliveryAssignee: newDelivery } : r
                                            );
                                            onLeadUpdate?.(lead.id, { policyRecords: updatedRecords });
                                          }}
                                        >
                                          <SelectTrigger className="w-[120px] h-8 text-xs">
                                            <SelectValue placeholder={language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="__none__" className="text-muted-foreground">
                                              {language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'}
                                            </SelectItem>
                                            {getDeliveryStaff().map((staff) => (
                                              <SelectItem key={staff.id} value={staff.name}>
                                                {staff.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Policy Owners - supports multiple */}
                                      <div className="w-[100px] shrink-0 text-sm">
                                        {(() => {
                                          const policyOwners = getPolicyOwners(lead, policy);
                                          const isReworkOwner = policy.status === 'rework_required';
                                          if (policyOwners.length === 0) {
                                            return <span className="text-muted-foreground/50">-</span>;
                                          }
                                          if (policyOwners.length === 1) {
                                            return (
                                              <span className={cn(
                                                'font-medium',
                                                isReworkOwner ? 'text-primary' : 'text-foreground'
                                              )}>
                                                {policyOwners[0]}
                                              </span>
                                            );
                                          }
                                          // Multiple owners - show "First +N" format with tooltip
                                          const firstOwner = policyOwners[0];
                                          const remainingCount = policyOwners.length - 1;
                                          return (
                                            <Tooltip delayDuration={0}>
                                              <TooltipTrigger asChild>
                                                <button 
                                                  type="button"
                                                  className={cn(
                                                    'font-medium cursor-help text-left',
                                                    isReworkOwner ? 'text-primary' : 'text-foreground'
                                                  )}
                                                >
                                                  {firstOwner} <span className={isReworkOwner ? 'text-primary/70' : 'text-muted-foreground'}>+{remainingCount}</span>
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="max-w-xs">
                                                <div className="flex flex-col gap-1">
                                                  {policyOwners.map((owner, idx) => (
                                                    <span key={idx} className="text-sm">{owner}</span>
                                                  ))}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        })()}
                                      </div>
                                      
                                      {/* Remarks */}
                                      <div className="w-[70px] shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                                          onClick={() => handleOpenRemarks(lead.id, policy.id, policy.kind)}
                                        >
                                          <MessageSquare className="w-4 h-4 mr-1" />
                                          {totalCount > 0 ? totalCount : '0'}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </div>


      {/* History Log Dialog */}
      {selectedLead && (
        <HistoryLogDialog
          open={historyLogDialogOpen}
          onOpenChange={(open) => {
            setHistoryLogDialogOpen(open);
            if (!open) {
              setSelectedLead(null);
            }
          }}
          leadNumber={selectedLead.leadNumber}
          lead={selectedLead}
        />
      )}

      {/* Policy Remarks & Rework Dialog */}
      <PolicyRemarksReworkDialog
        open={remarksDialogOpen}
        onOpenChange={(open) => {
          setRemarksDialogOpen(open);
          if (!open) {
            setSelectedPolicyForRemarks(null);
          }
        }}
        policyKind={selectedPolicyForRemarks?.kind || 'vmi'}
        policyId={selectedPolicyForRemarks?.policyId || ''}
        leadNumber={(() => {
          if (!selectedPolicyForRemarks) return undefined;
          const lead = (allLeads || leads).find(l => l.id === selectedPolicyForRemarks.leadId);
          return lead?.leadNumber;
        })()}
        remarks={(() => {
          if (!selectedPolicyForRemarks) return [];
          const lead = (allLeads || leads).find(l => l.id === selectedPolicyForRemarks.leadId);
          const policy = lead?.policyRecords?.find(p => p.id === selectedPolicyForRemarks.policyId);
          return policy?.remarks || [];
        })()}
        reworkHistory={(() => {
          if (!selectedPolicyForRemarks) return [];
          const lead = (allLeads || leads).find(l => l.id === selectedPolicyForRemarks.leadId);
          const policy = lead?.policyRecords?.find(p => p.id === selectedPolicyForRemarks.policyId);
          return policy?.reworkHistory || [];
        })()}
        endorsementHistory={(() => {
          if (!selectedPolicyForRemarks) return [];
          const lead = (allLeads || leads).find(l => l.id === selectedPolicyForRemarks.leadId);
          const policy = lead?.policyRecords?.find(p => p.id === selectedPolicyForRemarks.policyId);
          return policy?.endorsementHistory || [];
        })()}
        reworkConfigs={reworkConfigs}
        currentStage={(() => {
          // Use policy's actual stage, not the tab's stage (important for "All" tab)
          if (!selectedPolicyForRemarks) return stage;
          const lead = (allLeads || leads).find(l => l.id === selectedPolicyForRemarks.leadId);
          const policy = lead?.policyRecords?.find(p => p.id === selectedPolicyForRemarks.policyId);
          if (policy) {
            const policyStage = getPolicyStage(policy);
            if (policyStage) return policyStage;
          }
          return stage === 'all' ? 'to_pay' : stage; // Fallback for 'all' tab
        })()}
        onAddRemark={handleAddRemark}
        onAddRemarkReply={handleAddRemarkReply}
        onAddReworkReply={handleAddReworkReply}
        onAddEndorsementReply={handleAddEndorsementReply}
        onReworkResolve={(entryId) => {
          if (!selectedPolicyForRemarks) return;
          const lead = (allLeads || leads).find(l => l.id === selectedPolicyForRemarks.leadId);
          if (lead) {
            handlePolicyReworkResolve(lead, selectedPolicyForRemarks.policyId, entryId);
          }
        }}
        onReworkReassign={(entryId, newReasonId, details, attachments, postResolutionOwner) => {
          if (!selectedPolicyForRemarks) return;
          const lead = (allLeads || leads).find(l => l.id === selectedPolicyForRemarks.leadId);
          if (lead) {
            handlePolicyReworkReassign(lead, selectedPolicyForRemarks.policyId, entryId, newReasonId, details, attachments, postResolutionOwner);
          }
        }}
        onAddRework={(policyId, reasonId, details, attachments, autoResolveDate, postResolutionOwner) => {
          if (!selectedPolicyForRemarks) return;
          const lead = (allLeads || leads).find(l => l.id === selectedPolicyForRemarks.leadId);
          if (lead) {
            handlePolicyReworkAdd(lead, policyId, reasonId, details, attachments, autoResolveDate, postResolutionOwner);
          }
        }}
        onUpdateAutoResolveDate={(entryId, newDate) => {
          if (!selectedPolicyForRemarks) return;
          const lead = (allLeads || leads).find(l => l.id === selectedPolicyForRemarks.leadId);
          if (lead) {
            const updatedRecords = lead.policyRecords?.map(p => {
              if (p.id !== selectedPolicyForRemarks.policyId) return p;
              return {
                ...p,
                reworkHistory: p.reworkHistory?.map(e =>
                  e.id === entryId ? { ...e, autoResolveDate: newDate } : e
                ),
              };
            });
            onLeadUpdate?.(lead.id, { policyRecords: updatedRecords });
          }
        }}
      />

      {/* Recheck Price (Claim) Email Modal */}
      <PreSendEmailModal
        open={recheckPriceOpen}
        onOpenChange={setRecheckPriceOpen}
        title={language === 'th' ? 'ตรวจสอบราคาใหม่ (เคลม)' : 'Recheck Price (Claim)'}
        leadNumber={emailModalLead?.leadNumber}
        includeRenewalNotice
        defaultSubject={
          language === 'th'
            ? `ขอตรวจสอบราคาเบี้ยประกันภัยใหม่ - ${emailModalLead?.agentName || ''} (${emailModalLead?.leadNumber || ''})`
            : `Recheck Insurance Premium Price - ${emailModalLead?.agentName || ''} (${emailModalLead?.leadNumber || ''})`
        }
        defaultBody={
          language === 'th'
            ? `เรียน ฝ่ายรับประกันภัย,\n\nขอแจ้งตรวจสอบราคาเบี้ยประกันภัยใหม่สำหรับลูกค้า:\n\nตัวแทน: ${emailModalLead?.agentName || ''}\nเลขที่: ${emailModalLead?.leadNumber || ''}\nรถ: ${emailModalLead?.vehicleDetails || ''}\n\nเนื่องจากมีประวัติเคลม กรุณาตรวจสอบและแจ้งราคาเบี้ยประกันภัยใหม่\n\nขอบคุณครับ/ค่ะ`
            : `Dear Underwriting Team,\n\nPlease recheck the insurance premium price for the following renewal:\n\nAgent: ${emailModalLead?.agentName || ''}\nReference: ${emailModalLead?.leadNumber || ''}\nVehicle: ${emailModalLead?.vehicleDetails || ''}\n\nDue to claim history, please review and provide the updated premium.\n\nThank you.`
        }
        onSend={() => {
          if (!emailModalLead) return;
          // R-23: From Pricelist Added → Recheck Price (Claim). From Pricelist Verified → stay Pricelist Verified
          const newStatus = emailModalLead.saleStatus === 'pricelist_added' ? 'recheck_price_claim' : emailModalLead.saleStatus;
          const timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const updates: Partial<Lead> = {
            saleStatus: newStatus as Lead['saleStatus'],
            historyLog: [...(emailModalLead.historyLog || []), {
              id: crypto.randomUUID(),
              action: 'status_changed' as const,
              triggeredBy: CURRENT_USER,
              triggeredAt: timestamp,
              fromStatus: emailModalLead.saleStatus,
              toStatus: newStatus,
              comment: 'Recheck Price (Claim) email sent',
            }],
          };
          // Mark that recheck price has been completed
          (updates as any)._hasCompletedRecheckPrice = true;
          onLeadUpdate?.(emailModalLead.id, updates);
        }}
      />

      {/* Request Exception Email Modal */}
      <PreSendEmailModal
        open={requestExceptionOpen}
        onOpenChange={setRequestExceptionOpen}
        title={language === 'th' ? 'ขออนุโลม' : 'Request Exception'}
        leadNumber={emailModalLead?.leadNumber}
        includeRenewalNotice
        
        defaultSubject=""
        defaultBody=""
        onSend={() => {
          if (!emailModalLead) return;
          // R-27/R-28: renewal_rejected → special_request_pending
          const timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const updates: Partial<Lead> = {
            saleStatus: 'special_request_pending' as Lead['saleStatus'],
            historyLog: [...(emailModalLead.historyLog || []), {
              id: crypto.randomUUID(),
              action: 'status_changed' as const,
              triggeredBy: CURRENT_USER,
              triggeredAt: timestamp,
              fromStatus: emailModalLead.saleStatus,
              toStatus: 'special_request_pending',
              comment: 'Request Exception email sent',
            }],
          };
          (updates as any)._hasCompletedSpecialRequest = true;
          onLeadUpdate?.(emailModalLead.id, updates);
        }}
      />
    </>
  );
}
