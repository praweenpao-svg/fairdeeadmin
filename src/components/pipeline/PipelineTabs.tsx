import { cn } from '@/lib/utils';
import { PipelineStage, Lead, PolicyStatus, PolicyRecord, ReworkConfig } from '@/types/pipeline';
import { CURRENT_USER, mockReworkConfigs } from '@/data/mockLeads';
import { useLanguageStore, stageTranslations, StageKey } from '@/stores/languageStore';
import { 
  CreditCard, 
  FileText, 
  FileCheck, 
  Truck, 
  CheckCircle2,
  XCircle,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';


interface PipelineTabsProps {
  activeStage: PipelineStage;
  onStageChange: (stage: PipelineStage) => void;
  leads: Lead[];
  myCasesOnly: boolean;
}

const stageConfig = [
  {
    id: 'to_convert' as const, 
    icon: RefreshCw,
    description: 'Awaiting conversion'
  },
  { 
    id: 'all' as const, 
    icon: LayoutGrid,
    description: 'All post-lead stages'
  },
  { 
    id: 'to_pay' as const, 
    icon: CreditCard,
    description: 'Awaiting payment'
  },
  { 
    id: 'to_report' as const, 
    icon: FileText,
    description: 'Pending review'
  },
  { 
    id: 'to_issue' as const, 
    icon: FileCheck,
    description: 'Ready for issuance'
  },
  { 
    id: 'to_deliver' as const, 
    icon: Truck,
    description: 'Awaiting delivery'
  },
  { 
    id: 'completed' as const, 
    icon: CheckCircle2,
    description: 'Successfully completed'
  },
  { 
    id: 'cancelled' as const, 
    icon: XCircle,
    description: 'Policy cancelled'
  },
];

// Map policy statuses to pipeline stages (rework_required is special - uses previousStatus)
// Note: policy_issued is special - goes to to_deliver only if print_by_fairdee, otherwise completed
const policyStatusToStage: Record<PolicyStatus, PipelineStage | null> = {
  pending_payment: 'to_pay',
  pending_review: 'to_report',
  pending_issuance: 'to_issue',
  policy_issued: 'to_deliver', // Will be overridden in getPolicyStage for e_policy/print_by_myself
  policy_shipped: 'completed',
  policy_delivered: 'completed',
  policy_cancelled: 'cancelled',
  rework_required: null, // Special case - stage determined by previousStatus in rework history
};

// Import helper function to check cancellation rework reasons
import { isCancellationReworkReason } from '@/components/rework/ReworkConsoleTable';

// Get the effective stage for a policy (considering rework and shipping method)
// Uses mockReworkConfigs to check movesToCancellation property
export function getPolicyStage(policy: PolicyRecord, reworkConfigs: ReworkConfig[] = mockReworkConfigs): PipelineStage | null {
  if (policy.status === 'rework_required' && policy.reworkHistory && policy.reworkHistory.length > 0) {
    // Find the latest unresolved rework entry
    const latestRework = [...policy.reworkHistory].reverse().find(e => !e.resolved);
    if (latestRework) {
      // If the rework reason is cancellation-related, show in Cancellation tab
      if (isCancellationReworkReason(latestRework.reasonId, reworkConfigs)) {
        return 'cancelled';
      }
      // Otherwise, use the previous status to determine stage
      return policyStatusToStage[latestRework.previousStatus];
    }
  }
  
  // Special handling for policy_issued:
  // - print_by_fairdee: goes to to_deliver (needs shipping)
  // - e_policy / print_by_myself: goes directly to completed (no shipping needed)
  if (policy.status === 'policy_issued') {
    if (policy.shippingMethod === 'print_by_fairdee') {
      return 'to_deliver';
    } else {
      // e_policy or print_by_myself skip to_deliver and go directly to completed
      return 'completed';
    }
  }
  
  return policyStatusToStage[policy.status];
}

// Check if a lead has any policy in a specific stage
function hasAnyPolicyInStage(lead: Lead, stage: PipelineStage): boolean {
  if (!lead.policyRecords || lead.policyRecords.length === 0) {
    return false;
  }
  return lead.policyRecords.some(policy => getPolicyStage(policy) === stage);
}

// Get policy records that belong to a specific stage
// For 'all' stage, returns all policies that are in post-lead stages
export function getPoliciesForStage(lead: Lead, stage: PipelineStage): PolicyRecord[] {
  if (!lead.policyRecords) return [];
  if (stage === 'all') {
    // Return all policies in post-lead stages (not to_convert)
    return lead.policyRecords.filter(policy => {
      const policyStage = getPolicyStage(policy);
      return policyStage && policyStage !== 'to_convert';
    });
  }
  return lead.policyRecords.filter(policy => getPolicyStage(policy) === stage);
}

export function getLeadsForStage(leads: Lead[], stage: PipelineStage): Lead[] {
  switch (stage) {
    case 'all':
      // All: post-lead stages only (to_pay, to_report, to_issue, to_deliver, completed, cancelled)
      // Excludes leads in to_convert stage
      return leads.filter((lead) => {
        // Include if has any policy records in post-lead stages
        if (lead.policyRecords && lead.policyRecords.length > 0) {
          return lead.policyRecords.some(policy => {
            const policyStage = getPolicyStage(policy);
            return policyStage && policyStage !== 'to_convert';
          });
        }
        // Legacy: include if not in to_convert criteria
        const isInToConvert = 
          ['new_leads', 'coa', 'renewals'].includes(lead.leadType) &&
          lead.paymentStatus === 'unpaid' &&
          ['pending', 'docs_missing', 'waiting_for_insurer', 'partially_added', 'completed', 'quotation_shared', 'invalid', 'price_pending', 'revision_pending', 'renewal_rejected', 'price_ready'].includes(lead.saleStatus);
        return !isInToConvert;
      });
    case 'to_convert':
      // To Convert: leads with conversion statuses (unpaid, awaiting conversion)
      // Includes renewal-specific statuses: price_pending, revision_pending, renewal_rejected, price_ready
      return leads.filter(
        (lead) =>
          ['new_leads', 'coa', 'renewals'].includes(lead.leadType) &&
          lead.paymentStatus === 'unpaid' &&
          ['pending', 'docs_missing', 'waiting_for_insurer', 'partially_added', 'completed', 'quotation_shared', 'invalid', 'price_pending', 'revision_pending', 'renewal_rejected', 'price_ready'].includes(lead.saleStatus)
      );
    case 'to_pay':
      // To Pay: leads with policy records in pending_payment OR legacy logic
      return leads.filter((lead) => {
        // Check policy records first (for VMI/CMI leads)
        if (lead.policyRecords && lead.policyRecords.length > 0) {
          return hasAnyPolicyInStage(lead, 'to_pay');
        }
        // Legacy fallback
        return (
          ['new_leads', 'coa', 'renewals'].includes(lead.leadType) &&
          (lead.paymentStatus === 'partial' || lead.saleStatus === 'pending_payment')
        );
      });
    case 'to_report':
      // To Report: leads with policy records in pending_review OR legacy logic
      return leads.filter((lead) => {
        if (lead.policyRecords && lead.policyRecords.length > 0) {
          return hasAnyPolicyInStage(lead, 'to_report');
        }
        return ['pending_review', 'under_review', 'de_in_progress', 'ready_for_de'].includes(lead.saleStatus);
      });
    case 'to_issue':
      // To Issue: leads with policy records in pending_issuance OR legacy logic
      return leads.filter((lead) => {
        if (lead.policyRecords && lead.policyRecords.length > 0) {
          return hasAnyPolicyInStage(lead, 'to_issue');
        }
        return lead.saleStatus === 'pending_issuance' && !lead.policyAttached;
      });
    case 'to_deliver':
      // To Deliver: leads with policy records in policy_issued OR legacy logic
      return leads.filter((lead) => {
        if (lead.policyRecords && lead.policyRecords.length > 0) {
          return hasAnyPolicyInStage(lead, 'to_deliver');
        }
        return (
          lead.saleStatus === 'policy_issued' &&
          lead.shippingMethod === 'print_by_fairdee' &&
          !lead.trackingNumber
        );
      });
    case 'completed':
      // Completed: leads with policy records in policy_shipped/policy_delivered OR legacy logic
      return leads.filter((lead) => {
        if (lead.policyRecords && lead.policyRecords.length > 0) {
          return hasAnyPolicyInStage(lead, 'completed');
        }
        return (
          lead.policyAttached &&
          (lead.shippingMethod === 'e_policy' ||
            lead.shippingMethod === 'print_by_myself' ||
            (lead.shippingMethod === 'print_by_fairdee' && lead.trackingNumber))
        );
      });
    case 'cancelled':
      // Cancelled: leads with any policy cancelled OR legacy logic
      return leads.filter((lead) => {
        if (lead.policyRecords && lead.policyRecords.length > 0) {
          return hasAnyPolicyInStage(lead, 'cancelled');
        }
        return lead.saleStatus === 'policy_cancelled';
      });
    default:
      return [];
  }
}

// Check if a policy is in terminal state (owner should be cleared)
function isPolicyTerminal(policy: PolicyRecord): boolean {
  if (policy.status === 'policy_cancelled') return true;
  if (policy.status === 'policy_issued') {
    return policy.shippingMethod === 'e_policy' || policy.shippingMethod === 'print_by_myself';
  }
  return policy.status === 'policy_delivered';
}

// Get the owner(s) of a specific policy based on rework status and stage
function getPolicyOwner(policy: PolicyRecord, lead: Lead, stage: PipelineStage): string | undefined {
  // Terminal policies have no owner
  if (isPolicyTerminal(policy)) return undefined;
  
  // Check for active rework assignment on this policy
  if (policy.status === 'rework_required' && policy.reworkHistory) {
    const activeRework = policy.reworkHistory.find(e => !e.resolved);
    if (activeRework) {
      // If rework has explicit assignedTo, use it
      // If no assignedTo, this policy is considered unassigned (no owner)
      return activeRework.assignedTo || undefined;
    }
  }
  
  // Default stage-based owner (only for non-rework policies)
  switch (stage) {
    case 'all':
      return lead.deAssignee || lead.scAssignee || lead.rfAssignee;
    case 'to_convert':
    case 'to_pay':
      return lead.scAssignee || lead.rfAssignee;
    case 'to_report':
    case 'to_issue':
    case 'to_deliver':
    case 'completed':
    case 'cancelled':
      return lead.deAssignee;
    default:
      return undefined;
  }
}

// Get leads owned by current user for a stage (checks policy-level ownership)
export function getLeadsOwnedByUser(leads: Lead[], stage: PipelineStage, user: string): Lead[] {
  const stageLeads = getLeadsForStage(leads, stage);
  
  return stageLeads.filter(lead => {
    // For Leads stage (to_convert), check if user is RF or SC
    if (stage === 'to_convert') {
      return lead.rfAssignee === user || lead.scAssignee === user;
    }
    
    // For leads with policy records, check if user owns any policy in current stage
    if (lead.policyRecords && lead.policyRecords.length > 0) {
      const policiesInStage = getPoliciesForStage(lead, stage);
      
      // User owns this lead if they own ANY policy in the current stage
      return policiesInStage.some(policy => getPolicyOwner(policy, lead, stage) === user);
    }
    
    // Legacy fallback for leads without policy records
    // Check stage-based ownership
    switch (stage) {
      case 'all':
        return lead.deAssignee === user || lead.scAssignee === user || lead.rfAssignee === user;
      case 'to_pay':
        return lead.scAssignee === user || lead.rfAssignee === user;
      case 'to_report':
      case 'to_issue':
      case 'to_deliver':
      case 'completed':
      case 'cancelled':
        return lead.deAssignee === user;
      default:
        return false;
    }
  });
}

// Count policies owned by current user for a specific stage
function countPoliciesOwnedByUser(leads: Lead[], stage: PipelineStage, user: string): number {
  let count = 0;
  
  // For Leads stage, count leads where user is RF or SC
  if (stage === 'to_convert') {
    const stageLeads = getLeadsForStage(leads, stage);
    return stageLeads.filter(lead => lead.rfAssignee === user || lead.scAssignee === user).length;
  }
  
  // For other stages, count policies where user is owner
  const stageLeads = getLeadsForStage(leads, stage);
  
  stageLeads.forEach(lead => {
    if (lead.policyRecords && lead.policyRecords.length > 0) {
      const policiesInStage = getPoliciesForStage(lead, stage);
      policiesInStage.forEach(policy => {
        if (getPolicyOwner(policy, lead, stage) === user) {
          count++;
        }
      });
    } else {
      // Legacy lead without policy records - count as 1 if owned
      const isOwned = (() => {
        switch (stage) {
          case 'all':
            return lead.deAssignee === user || lead.scAssignee === user || lead.rfAssignee === user;
          case 'to_pay':
            return lead.scAssignee === user || lead.rfAssignee === user;
          case 'to_report':
          case 'to_issue':
          case 'to_deliver':
          case 'completed':
          case 'cancelled':
            return lead.deAssignee === user;
          default:
            return false;
        }
      })();
      if (isOwned) count++;
    }
  });
  
  return count;
}

export function PipelineTabs({
  activeStage,
  onStageChange,
  leads,
  myCasesOnly,
}: PipelineTabsProps) {
  const { language } = useLanguageStore();

  return (
    <div className="border-b border-border bg-card px-4">
      <div className="flex items-center gap-1">
        {stageConfig.map((stage) => {
          const isActive = activeStage === stage.id;
          const Icon = stage.icon;
          const label = stageTranslations[stage.id as StageKey][language];
          const myCount = countPoliciesOwnedByUser(leads, stage.id, CURRENT_USER);

          return (
            <button
              key={stage.id}
              onClick={() => onStageChange(stage.id)}
              className={cn(
                'pipeline-tab flex items-center gap-2 relative',
                isActive ? 'pipeline-tab-active' : 'pipeline-tab-inactive'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {myCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 min-w-5 px-1.5 text-[10px] font-semibold bg-primary/15 text-primary border-none"
                >
                  {myCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
