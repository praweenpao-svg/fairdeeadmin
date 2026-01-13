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

export type CasesView = 'my_cases' | 'all_cases';

interface PipelineTabsProps {
  activeStage: PipelineStage;
  onStageChange: (stage: PipelineStage) => void;
  leads: Lead[];
  casesView: CasesView;
  onCasesViewChange: (view: CasesView) => void;
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

// Get owner field based on stage
function getOwnerField(stage: PipelineStage): keyof Lead | null {
  switch (stage) {
    case 'to_pay':
      return 'rfAssignee'; // RF handles To Pay
    case 'to_report':
    case 'to_issue':
    case 'to_deliver':
    case 'completed':
      return 'deAssignee'; // DE handles these stages
    default:
      return null;
  }
}

// Get leads owned by current user for a stage
export function getLeadsOwnedByUser(leads: Lead[], stage: PipelineStage, user: string): Lead[] {
  const stageLeads = getLeadsForStage(leads, stage);
  const ownerField = getOwnerField(stage);
  if (!ownerField) return stageLeads;
  return stageLeads.filter(lead => lead[ownerField] === user);
}

export function PipelineTabs({
  activeStage,
  onStageChange,
  leads,
  casesView,
  onCasesViewChange,
}: PipelineTabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-1">
        {stageConfig.map((stage) => {
          const stageLeads = getLeadsForStage(leads, stage.id);
          const count = casesView === 'my_cases' 
            ? getLeadsOwnedByUser(leads, stage.id, CURRENT_USER).length
            : stageLeads.length;
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
      
      {/* Cases View Toggle */}
      <div className="flex items-center gap-1 py-2">
        <button
          onClick={() => onCasesViewChange('my_cases')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            casesView === 'my_cases'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          My Cases
        </button>
        <button
          onClick={() => onCasesViewChange('all_cases')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            casesView === 'all_cases'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          All Cases
        </button>
      </div>
    </div>
  );
}
