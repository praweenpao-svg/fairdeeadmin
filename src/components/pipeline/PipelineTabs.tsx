import { cn } from '@/lib/utils';
import { PipelineStage, Lead } from '@/types/pipeline';
import { CURRENT_USER } from '@/data/mockLeads';
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


interface PipelineTabsProps {
  activeStage: PipelineStage;
  onStageChange: (stage: PipelineStage) => void;
  leads: Lead[];
  myCasesOnly: boolean;
}

const stageConfig = [
  { 
    id: 'all' as const, 
    icon: LayoutGrid,
    description: 'All leads'
  },
  { 
    id: 'to_convert' as const, 
    icon: RefreshCw,
    description: 'Awaiting conversion'
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

export function getLeadsForStage(leads: Lead[], stage: PipelineStage): Lead[] {
  switch (stage) {
    case 'all':
      return leads;
    case 'to_convert':
      // To Convert: leads with conversion statuses (unpaid, awaiting conversion)
      return leads.filter(
        (lead) =>
          ['new_leads', 'coa', 'renewals'].includes(lead.leadType) &&
          lead.paymentStatus === 'unpaid' &&
          ['pending', 'docs_missing', 'waiting_for_insurer', 'partially_added', 'completed', 'quotation_shared', 'invalid'].includes(lead.saleStatus)
      );
    case 'to_pay':
      // To Pay: leads with "pending_payment" saleStatus or partial payment
      return leads.filter(
        (lead) =>
          ['new_leads', 'coa', 'renewals'].includes(lead.leadType) &&
          (lead.paymentStatus === 'partial' || lead.saleStatus === 'pending_payment')
      );
    case 'to_report':
      return leads.filter((lead) =>
        ['pending_review', 'under_review', 'de_in_progress', 'ready_for_de'].includes(
          lead.saleStatus
        )
      );
    case 'to_issue':
      return leads.filter(
        (lead) =>
          lead.saleStatus === 'pending_issuance' && !lead.policyAttached
      );
    case 'to_deliver':
      return leads.filter(
        (lead) =>
          lead.saleStatus === 'policy_issued' &&
          lead.shippingMethod === 'print_by_fairdee' &&
          !lead.trackingNumber
      );
    case 'completed':
      return leads.filter(
        (lead) =>
          lead.policyAttached &&
          (lead.shippingMethod === 'e_policy' ||
            lead.shippingMethod === 'print_by_myself' ||
            (lead.shippingMethod === 'print_by_fairdee' && lead.trackingNumber))
      );
    case 'cancelled':
      return leads.filter((lead) => lead.saleStatus === 'policy_cancelled');
    default:
      return [];
  }
}

// Get the actual owner of a lead based on rework status and stage
function getLeadOwner(lead: Lead, stage: PipelineStage): string | undefined {
  // If rework is required, the assignedTo field determines the owner
  if (lead.reworkRequired && lead.assignedTo) {
    return lead.assignedTo;
  }
  
  // Otherwise, use the stage-based owner field
  switch (stage) {
    case 'all':
      // For "All" tab, show SC/RF or DE based on what's assigned
      return lead.deAssignee || lead.scAssignee || lead.rfAssignee;
    case 'to_convert':
    case 'to_pay':
      // To Convert and To Pay: SC if available, else RF (DE not assigned yet)
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

// Get leads owned by current user for a stage
export function getLeadsOwnedByUser(leads: Lead[], stage: PipelineStage, user: string): Lead[] {
  const stageLeads = getLeadsForStage(leads, stage);
  return stageLeads.filter(lead => getLeadOwner(lead, stage) === user);
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
