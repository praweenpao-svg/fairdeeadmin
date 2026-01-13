import { cn } from '@/lib/utils';
import { PipelineStage, Lead } from '@/types/pipeline';
import { CURRENT_USER } from '@/data/mockLeads';
import { 
  CreditCard, 
  FileText, 
  FileCheck, 
  Truck, 
  CheckCircle2,
} from 'lucide-react';


interface PipelineTabsProps {
  activeStage: PipelineStage;
  onStageChange: (stage: PipelineStage) => void;
  leads: Lead[];
  myCasesOnly: boolean;
  onMyCasesChange: (checked: boolean) => void;
  reworkOnly: boolean;
  onReworkOnlyChange: (checked: boolean) => void;
}

const stageConfig = [
  { 
    id: 'to_pay' as const, 
    label: 'To Pay', 
    icon: CreditCard,
    description: 'Awaiting payment'
  },
  { 
    id: 'to_report' as const, 
    label: 'To Report', 
    icon: FileText,
    description: 'Pending review'
  },
  { 
    id: 'to_issue' as const, 
    label: 'To Issue', 
    icon: FileCheck,
    description: 'Ready for issuance'
  },
  { 
    id: 'to_deliver' as const, 
    label: 'To Deliver', 
    icon: Truck,
    description: 'Awaiting delivery'
  },
  { 
    id: 'completed' as const, 
    label: 'Completed', 
    icon: CheckCircle2,
    description: 'Successfully completed'
  },
];

export function getLeadsForStage(leads: Lead[], stage: PipelineStage): Lead[] {
  switch (stage) {
    case 'to_pay':
      return leads.filter(
        (lead) =>
          ['new_leads', 'coa', 'renewals'].includes(lead.leadType) &&
          lead.paymentStatus === 'unpaid'
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
    case 'to_pay':
      return lead.rfAssignee;
    case 'to_report':
    case 'to_issue':
    case 'to_deliver':
    case 'completed':
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
  onMyCasesChange,
  reworkOnly,
  onReworkOnlyChange,
}: PipelineTabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-1">
        {stageConfig.map((stage) => {
          const count = myCasesOnly 
            ? getLeadsOwnedByUser(leads, stage.id, CURRENT_USER).length
            : getLeadsForStage(leads, stage.id).length;
          const isActive = activeStage === stage.id;
          const Icon = stage.icon;

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
              <span>{stage.label}</span>
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Toggle Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onReworkOnlyChange(!reworkOnly)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            reworkOnly
              ? 'bg-destructive text-destructive-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Rework Required
        </button>
        <button
          onClick={() => onMyCasesChange(!myCasesOnly)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            myCasesOnly
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          My Cases
        </button>
      </div>
    </div>
  );
}
