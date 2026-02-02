import React, { useState } from 'react';
import { 
  ExternalLink, 
  MoreVertical,
  History,
  Eye,
  ChevronRight,
  ChevronDown,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Lead, PipelineStage, LeadType, ReworkConfig, CreatedByType, ReworkAttachment, ReworkHistoryEntry, HistoryLogEntry, PolicyStatus, PolicyReworkEntry, PaymentMethod } from '@/types/pipeline';
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
import { ReworkDialog } from './ReworkDialog';
import { HistoryLogDialog } from './HistoryLogDialog';
import { InlineReworkActions } from './InlineReworkActions';
import { PolicyStatusCell } from './PolicyStatusCell';
import { getPoliciesForStage } from './PipelineTabs';
import { InsurersExpandableRow } from './InsurersExpandableRow';

interface LeadsTableProps {
  leads: Lead[];
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
  invalid: { en: 'Invalid', th: 'ปฎิเสธโดย Admin' },
  // Pre-lead statuses (renewals only)
  price_pending: { en: 'Price Pending', th: 'ยังไม่ทราบเบี้ยต่ออายุ' },
  revision_pending: { en: 'Revision Pending', th: 'กำลังต่อรองกับบริษัทประกัน' },
  renewal_rejected: { en: 'Renewal Rejected', th: 'ปฎิเสธการต่ออายุ' },
  price_ready: { en: 'Price Ready', th: 'ได้รับเบี้ยต่ออายุแล้ว' },
  revision_required: { en: 'Revision Required', th: 'กำลังต่อรองกับบริษัทประกัน' },
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
    'revision_pending',
    'renewal_rejected',
    'price_ready',
    'revision_required',
  ],
};

const statusOptionsByStage: Record<PipelineStage, string[]> = {
  all: [
    'pending',
    'waiting_for_insurer',
    'partially_added',
    'completed',
    'quotation_shared',
    'invalid',
    'price_pending',
    'revision_pending',
    'renewal_rejected',
    'price_ready',
    'revision_required',
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

function CreatedByBadge({ createdBy }: { createdBy: CreatedByType }) {
  const config = {
    agent: { label: 'Agent', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    admin: { label: 'Admin', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  };
  const { label, className } = config[createdBy];
  return <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', className)}>{label}</span>;
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
const paymentMethodLabels: Record<PaymentMethod, string> = {
  credit: 'Credit',
  cbc_to_fairdee: 'CBC to FairDee',
  cbc_to_insurer: 'CBC to Insurer',
};

// Payment status options
type PaymentStatus = 'invoice_issued' | 'verified';
const paymentStatusLabels: Record<PaymentStatus, { en: string; th: string }> = {
  invoice_issued: { en: 'Invoice Issued', th: 'ออกใบแจ้งหนี้แล้ว' },
  verified: { en: 'Payment Verified', th: 'ยืนยันการชำระเงินแล้ว' },
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
function getPaymentMethodLabel(lead: Lead): string {
  if (areBothPoliciesPending(lead)) return '-';
  return lead.paymentMethod ? paymentMethodLabels[lead.paymentMethod] : '-';
}

// Helper to get premium display (same logic as payment method)
function getPremiumDisplay(lead: Lead): string {
  if (areBothPoliciesPending(lead)) return '-';
  return formatPremium(lead.premium);
}

// Helper to get payment status for display based on stage
function getPaymentStatusForStage(stage: PipelineStage): PaymentStatus {
  if (stage === 'to_pay') return 'invoice_issued';
  return 'verified';
}

// Helper to get staff members by team (based on fixed rosters)

// Helper to get staff members by team (based on fixed rosters)
const teamRosters: Record<string, string[]> = {
  'AST RF': ['Ricky', 'Jenny', 'Tommy'],
  'AST SC': ['Lisa', 'Mike', 'Nina'],
  'DE': ['Oscar', 'Paula', 'Quinn'],
  'Admin': ['Rachel', 'Sam', 'Tina'],
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

// Round robin state per team
const roundRobinIndexes: Record<string, number> = {};

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

export function LeadsTable({ leads, stage, reworkConfigs, onLeadUpdate }: LeadsTableProps) {
  const { language } = useLanguageStore();
  const [reworkDialogOpen, setReworkDialogOpen] = useState(false);
  const [historyLogDialogOpen, setHistoryLogDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(() => new Set());

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

  // Check if current stage is a post-lead stage (To Pay onwards)
  const isPostLeadStage = ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'].includes(stage);

  // DE column is shown in all stages
  const showDEColumn = true;

  // Filter rework configs by current stage
  const stageReworkConfigs = reworkConfigs.filter(config => config.stages.includes(stage));

  // Handle policy status change (for non-rework status changes)
  const handlePolicyStatusChange = (lead: Lead, policyId: string, newStatus: PolicyStatus) => {
    if (!lead.policyRecords) return;
    
    // If changing to rework_required, open rework dialog
    if (newStatus === 'rework_required') {
      setSelectedLead(lead);
      setSelectedPolicyId(policyId);
      setReworkDialogOpen(true);
      return;
    }
    
    const updatedRecords = lead.policyRecords.map(record => 
      record.id === policyId ? { ...record, status: newStatus } : record
    );

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Create history log entry for policy status change
    const policy = lead.policyRecords.find(r => r.id === policyId);
    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'status_changed',
      triggeredBy: 'Akshay Bazad',
      triggeredAt: timestamp,
      fromStatus: policy?.status,
      toStatus: newStatus,
      comment: `${policy?.kind.toUpperCase()} policy status updated`,
    };

    onLeadUpdate?.(lead.id, {
      policyRecords: updatedRecords,
      historyLog: [...(lead.historyLog || []), historyLogEntry],
    });
  };

  // Handle policy rework resolve
  const handlePolicyReworkResolve = (lead: Lead, policyId: string) => {
    if (!lead.policyRecords) return;

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== policyId) return record;
      
      // Find latest unresolved rework entry
      const reworkHistory = record.reworkHistory || [];
      const latestEntryIndex = reworkHistory.slice().reverse().findIndex(e => !e.resolved);
      if (latestEntryIndex === -1) return record;
      
      const actualIndex = reworkHistory.length - 1 - latestEntryIndex;
      const latestEntry = reworkHistory[actualIndex];
      
      // Mark as resolved and restore previous status
      const updatedHistory = [...reworkHistory];
      updatedHistory[actualIndex] = {
        ...latestEntry,
        resolved: true,
        resolvedAt: timestamp,
        resolvedBy: 'Akshay Bazad',
      };

      return {
        ...record,
        status: latestEntry.previousStatus,
        reworkRequired: false,
        reworkHistory: updatedHistory,
      };
    });

    const policy = lead.policyRecords.find(r => r.id === policyId);
    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_resolved',
      triggeredBy: 'Akshay Bazad',
      triggeredAt: timestamp,
      comment: `${policy?.kind.toUpperCase()} policy rework resolved`,
    };

    onLeadUpdate?.(lead.id, {
      policyRecords: updatedRecords,
      historyLog: [...(lead.historyLog || []), historyLogEntry],
    });
  };

  // Handle policy rework reassign
  const handlePolicyReworkReassign = (lead: Lead, policyId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => {
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

    const updatedRecords = lead.policyRecords.map(record => {
      if (record.id !== policyId) return record;
      
      const reworkHistory = record.reworkHistory || [];
      const latestEntryIndex = reworkHistory.slice().reverse().findIndex(e => !e.resolved);
      
      let previousStatus = record.status as PolicyStatus;
      const updatedHistory = [...reworkHistory];
      
      // If there's an existing unresolved entry, mark it as resolved (reassigned)
      if (latestEntryIndex !== -1) {
        const actualIndex = reworkHistory.length - 1 - latestEntryIndex;
        const latestEntry = reworkHistory[actualIndex];
        previousStatus = latestEntry.previousStatus;
        updatedHistory[actualIndex] = {
          ...latestEntry,
          resolved: true,
          resolvedAt: timestamp,
          resolvedBy: 'Akshay Bazad (Reassigned)',
        };
      }

      // Add new rework entry
      const newEntry: PolicyReworkEntry = {
        id: crypto.randomUUID(),
        reasonId: newReasonId,
        reasonLabel,
        details,
        attachments,
        savedBy: 'Akshay Bazad',
        savedAt: timestamp,
        previousStatus,
      };

      return {
        ...record,
        status: 'rework_required' as PolicyStatus,
        reworkRequired: true,
        reworkHistory: [...updatedHistory, newEntry],
      };
    });

    const policy = lead.policyRecords.find(r => r.id === policyId);
    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_reassigned',
      triggeredBy: 'Akshay Bazad',
      triggeredAt: timestamp,
      reworkReasonId: newReasonId,
      reworkReasonLabel: reasonLabel,
      comment: `${policy?.kind.toUpperCase()} policy rework reassigned: ${details || reasonLabel}`,
    };

    onLeadUpdate?.(lead.id, {
      policyRecords: updatedRecords,
      historyLog: [...(lead.historyLog || []), historyLogEntry],
    });
  };

  const handleStatusChange = (lead: Lead, newStatus: string) => {
    if (newStatus === 'rework_required') {
      setSelectedLead(lead);
      setReworkDialogOpen(true);
    } else {
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
        triggeredBy: 'Akshay Bazad',
        triggeredAt: timestamp,
        fromStatus: lead.saleStatus,
        toStatus: newStatus,
      };

      // When status changes to pending_review at To Report, assign DE
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
        // Add assignee change to history
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
    }
  };

  const handleReworkConfirm = (reasonId: string, details: string, attachments: ReworkAttachment[]) => {
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

      const previousStatus = policy.status as PolicyStatus;

      const newPolicyReworkEntry: PolicyReworkEntry = {
        id: crypto.randomUUID(),
        reasonId,
        reasonLabel,
        details,
        attachments,
        savedBy: 'Akshay Bazad',
        savedAt: timestamp,
        previousStatus,
      };

      const updatedRecords = selectedLead.policyRecords.map(record => {
        if (record.id !== selectedPolicyId) return record;
        return {
          ...record,
          status: 'rework_required' as PolicyStatus,
          reworkRequired: true,
          reworkHistory: [...(record.reworkHistory || []), newPolicyReworkEntry],
        };
      });

      const historyLogEntry: HistoryLogEntry = {
        id: crypto.randomUUID(),
        action: 'rework_created',
        triggeredBy: 'Akshay Bazad',
        triggeredAt: timestamp,
        reworkReasonId: reasonId,
        reworkReasonLabel: reasonLabel,
        comment: `${policy.kind.toUpperCase()} policy: ${details || reasonLabel}`,
        attachments: attachments.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          url: a.url,
        })),
      };

      onLeadUpdate?.(selectedLead.id, {
        policyRecords: updatedRecords,
        historyLog: [...(selectedLead.historyLog || []), historyLogEntry],
      });

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
      savedBy: 'Akshay Bazad',
      savedAt: timestamp,
      previousStatus,
    };

    // Create history log entry for rework creation
    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_created',
      triggeredBy: 'Akshay Bazad',
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
      resolvedBy: 'Akshay Bazad',
    };

    // Create history log entry for rework resolution
    const historyLogEntry: HistoryLogEntry = {
      id: crypto.randomUUID(),
      action: 'rework_resolved',
      triggeredBy: 'Akshay Bazad',
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
      resolvedBy: 'Akshay Bazad (Reassigned)',
    };

    // Create new rework entry with the new reason
    const newHistoryEntry: ReworkHistoryEntry = {
      id: crypto.randomUUID(),
      reasonId: newReasonId,
      reasonLabel: newReasonLabel,
      details: details || `Reassigned from: ${entry.reasonLabel}`,
      attachments,
      savedBy: 'Akshay Bazad',
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
      triggeredBy: 'Akshay Bazad',
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

  // Sort leads by createdOn descending (newest first)
  const sortedLeads = [...leads].sort((a, b) => {
    const dateA = parseDateTime(a.createdOn).getTime();
    const dateB = parseDateTime(b.createdOn).getTime();
    
    const comparison = dateB - dateA; // descending (newest first)
    if (comparison !== 0) return comparison;
    
    // Then prioritize rework required
    if (a.reworkRequired && !b.reworkRequired) return -1;
    if (!a.reworkRequired && b.reworkRequired) return 1;
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

  // Get owner based on stage and rework status
  const getOwner = (lead: Lead): string | undefined => {
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

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="data-table-header px-4 py-3 text-left">ID</th>
                <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'ตัวแทน' : 'Agent'}</th>
                <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'วันที่สร้าง' : 'Created On'}</th>
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
                {!isPostLeadStage && (
                  <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'สถานะงาน' : 'Status'}</th>
                )}
                <th className="data-table-header px-4 py-3 text-left">{language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}</th>
                <th className="data-table-header w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={isPostLeadStage ? (showDEColumn ? 12 : 11) : (showDEColumn ? 10 : 9)} className="px-4 py-12 text-center text-muted-foreground">
                    No leads found for this stage
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
                    <tr 
                      className={cn(
                        'data-table-row',
                        lead.reworkRequired && 'bg-warning/5'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {/* Expand/Collapse chevron for post-lead stages only (insurer quotes hidden for now) */}
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
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm">{lead.leadNumber}</span>
                            <div className="flex items-center gap-1">
                              <CreatedByBadge createdBy={lead.createdBy} />
                              {lead.policyType && (
                                <>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    VMI
                                  </span>
                                  {lead.policyType === 'vmi_cmi' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                      CMI
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
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
                      <td className="px-4 py-3 text-sm">{lead.createdOn}</td>
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
                          <td className="px-4 py-3 text-sm">{getPremiumDisplay(lead)}</td>
                          <td className="px-4 py-3 text-sm">{getPaymentMethodLabel(lead)}</td>
                          <td className="px-4 py-3">
                            {(() => {
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
                                      {paymentStatusLabels[currentStatus][language]}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="invoice_issued">
                                      {paymentStatusLabels.invoice_issued[language]}
                                    </SelectItem>
                                    <SelectItem value="verified">
                                      {paymentStatusLabels.verified[language]}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              );
                            })()}
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
                      {!isPostLeadStage && (
                        <td className="px-4 py-3">
                          {hasActiveRework ? (
                            <InlineReworkActions
                              lead={lead}
                              latestEntry={latestReworkEntry}
                              reworkConfigs={stageReworkConfigs}
                              onResolve={handleResolveRework}
                              onReassign={handleReassignRework}
                            />
                          ) : (
                          <Select 
                              value={lead.saleStatus || defaultStatusByStage[stage]}
                              onValueChange={(value) => handleStatusChange(lead, value)}
                            >
                              <SelectTrigger 
                                className="w-[200px] h-8 text-xs"
                                style={getStatusStyles(lead.saleStatus || defaultStatusByStage[stage], leadStatusColors)}
                              >
                                <SelectValue placeholder={language === 'th' ? 'เลือกสถานะ' : 'Select status'} />
                              </SelectTrigger>
                              <SelectContent>
                                {(stage === 'to_convert' && lead.leadType 
                                  ? statusOptionsByLeadType[lead.leadType] || statusOptionsByStage[stage]
                                  : statusOptionsByStage[stage]
                                ).map((statusValue) => (
                                  <SelectItem key={statusValue} value={statusValue}>
                                    {getStatusLabel(statusValue, language)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      )}
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
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              {language === 'th' ? 'ดูรายละเอียด' : 'View Details'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenHistoryLog(lead)}>
                              <History className="w-4 h-4 mr-2" />
                              {language === 'th' ? 'ประวัติการทำงาน' : 'History Log'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    
                    {/* Expanded Insurer Rows for Leads Stage (New Leads / COA) - Hidden for now
                    {stage === 'to_convert' && isExpanded && (lead.leadType === 'new_leads' || lead.leadType === 'coa') && lead.insurerQuotes && lead.insurerQuotes.length > 0 && (
                      <tr>
                        <td colSpan={showDEColumn ? 11 : 10} className="p-0">
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
                      <tr>
                        <td colSpan={showDEColumn ? 10 : 9} className="p-0">
                          <div className="mx-4 my-2 rounded-lg border border-border overflow-hidden bg-card shadow-sm">
                            {/* Policy Sub-Table Header */}
                            <div className="grid grid-cols-9 gap-3 px-4 py-2.5 bg-muted/60 border-b border-border">
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'th' ? 'ประเภท' : 'Type'}
                              </div>
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'th' ? 'อัปเดตล่าสุด' : 'Updated On'}
                              </div>
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Policy Uploaded'}
                              </div>
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'th' ? 'รูปแบบการพิมพ์' : 'Printing Pref.'}
                              </div>
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'th' ? 'วันเริ่มคุ้มครอง' : 'Start Date'}
                              </div>
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'th' ? 'เลขกรมธรรม์' : 'Policy No.'}
                              </div>
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'th' ? 'ไฟล์กรมธรรม์' : 'Policy File'}
                              </div>
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'th' ? 'หมายเหตุ' : 'Remarks'}
                              </div>
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'th' ? 'สถานะ' : 'Status'}
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
                                    const date = new Date(dateStr);
                                    return date.toLocaleString(language === 'th' ? 'th-TH' : 'en-US', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    });
                                  };
                                  
                                  const formatDateOnly = (dateStr?: string) => {
                                    if (!dateStr) return '-';
                                    const date = new Date(dateStr);
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const year = date.getFullYear();
                                    return `${day}/${month}/${year}`;
                                  };
                                  
                                  const getPrintingPreferenceLabel = (method?: string) => {
                                    if (!method) return '-';
                                    if (method === 'e_policy') return 'E-Policy';
                                    if (method === 'print_by_myself') return language === 'th' ? 'พิมพ์เอง' : 'Print by Myself';
                                    if (method === 'print_by_fairdee') return language === 'th' ? 'พิมพ์โดย FairDee' : 'Print by FairDee';
                                    return '-';
                                  };
                                  
                                  const remarkCount = policy.remarks?.length || 0;
                                  
                                  return (
                                    <div 
                                      key={policy.id}
                                      className="grid grid-cols-9 gap-3 px-4 py-3 items-center transition-colors bg-card hover:bg-muted/30"
                                    >
                                      {/* Policy Kind Badge */}
                                      <div>
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
                                      <div className="text-xs text-muted-foreground">
                                        {formatDate(policy.updatedOn)}
                                      </div>
                                      
                                      {/* Policy Uploaded On */}
                                      <div className="text-xs text-muted-foreground">
                                        {policy.policyUploadedOn ? (
                                          <span className="text-success">{formatDate(policy.policyUploadedOn)}</span>
                                        ) : (
                                          <span className="text-muted-foreground/50">-</span>
                                        )}
                                      </div>
                                      
                                      {/* Printing Preference */}
                                      <div className="text-xs text-muted-foreground">
                                        {getPrintingPreferenceLabel(policy.shippingMethod)}
                                      </div>
                                      
                                      {/* Policy Start Date */}
                                      <div className="text-xs text-foreground font-medium">
                                        {formatDateOnly(policy.policyStartDate)}
                                      </div>
                                      
                                      {/* Policy Number */}
                                      <div className="text-xs text-foreground font-mono">
                                        {policy.policyNumber || <span className="text-muted-foreground/50">-</span>}
                                      </div>
                                      
                                      {/* Policy File */}
                                      <div>
                                        {policy.policyFileUrl ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs gap-1.5"
                                            onClick={() => window.open(policy.policyFileUrl, '_blank')}
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            {language === 'th' ? 'ดูกรมธรรม์' : 'View Policy'}
                                          </Button>
                                        ) : (
                                          <span className="text-xs text-muted-foreground/50">-</span>
                                        )}
                                      </div>
                                      
                                      {/* Remarks */}
                                      <div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          {remarkCount > 0 ? (
                                            <span className="bg-primary/15 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                                              {remarkCount}
                                            </span>
                                          ) : (
                                            <span>{language === 'th' ? 'เพิ่ม' : 'Add'}</span>
                                          )}
                                        </Button>
                                      </div>
                                      
                                      {/* Status */}
                                      <div>
                                        <PolicyStatusCell
                                          policy={policy}
                                          stage={stage}
                                          isEditable={isEditable}
                                          reworkConfigs={stageReworkConfigs}
                                          onStatusChange={(policyId, newStatus) => handlePolicyStatusChange(lead, policyId, newStatus)}
                                          onReworkResolve={(policyId) => handlePolicyReworkResolve(lead, policyId)}
                                          onReworkReassign={(policyId, reasonId, details, attachments) => handlePolicyReworkReassign(lead, policyId, reasonId, details, attachments)}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
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

      {/* Rework Dialog */}
      <ReworkDialog
        open={reworkDialogOpen}
        onOpenChange={(open) => {
          setReworkDialogOpen(open);
          if (!open) {
            setSelectedLead(null);
          }
        }}
        reworkConfigs={stageReworkConfigs}
        onConfirm={handleReworkConfirm}
      />

      {/* History Log Dialog */}
      <HistoryLogDialog
        open={historyLogDialogOpen}
        onOpenChange={(open) => {
          setHistoryLogDialogOpen(open);
          if (!open) {
            setSelectedLead(null);
          }
        }}
        leadNumber={selectedLead?.leadNumber || ''}
        historyLog={selectedLead?.historyLog || []}
      />
    </>
  );
}
