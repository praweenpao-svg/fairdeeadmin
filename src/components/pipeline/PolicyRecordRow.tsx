import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PolicyRecord, PolicyStatus, PolicyKind, PipelineStage, ReworkConfig, ReworkAttachment } from '@/types/pipeline';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { Badge } from '@/components/ui/badge';
import { PolicyStatusCell } from './PolicyStatusCell';

// Policy kind translations
const policyKindLabels: Record<PolicyKind, { en: string; th: string }> = {
  vmi: { en: 'VMI', th: 'ภาคสมัครใจ' },
  cmi: { en: 'CMI', th: 'ภาคบังคับ' },
};

// Get badge color based on policy kind
function getPolicyKindColor(kind: PolicyKind): string {
  return kind === 'vmi' 
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
}

interface PolicyRecordRowProps {
  policy: PolicyRecord;
  isStageRelevant?: boolean;
  isEditable?: boolean;
  stage: PipelineStage;
  reworkConfigs: ReworkConfig[];
  onStatusChange?: (policyId: string, newStatus: PolicyStatus) => void;
  onReworkResolve?: (policyId: string) => void;
  onReworkReassign?: (policyId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => void;
}

export function PolicyRecordRow({ 
  policy, 
  isStageRelevant = true, 
  isEditable = true, 
  stage,
  reworkConfigs,
  onStatusChange,
  onReworkResolve,
  onReworkReassign,
}: PolicyRecordRowProps) {
  const { language } = useLanguageStore();

  return (
    <div className={cn(
      'flex items-center gap-4 py-2 px-4 border-l-2',
      isStageRelevant 
        ? 'bg-muted/30 border-primary/50' 
        : 'bg-muted/10 border-muted-foreground/20'
    )}>
      {/* Policy Kind Badge */}
      <Badge 
        variant="secondary" 
        className={cn('text-xs font-medium min-w-[60px] justify-center', getPolicyKindColor(policy.kind))}
      >
        {policyKindLabels[policy.kind][language]}
      </Badge>

      {/* Status Cell - uses PolicyStatusCell for consistent styling */}
      <div className="flex-1">
        <PolicyStatusCell
          policy={policy}
          stage={stage}
          isEditable={isEditable}
          reworkConfigs={reworkConfigs}
          onStatusChange={onStatusChange}
          onReworkResolve={onReworkResolve}
          onReworkReassign={onReworkReassign}
        />
      </div>

      {/* Shipping Method if applicable */}
      {policy.shippingMethod && (
        <span className="text-xs text-muted-foreground">
          {policy.shippingMethod === 'e_policy' && 'E-Policy'}
          {policy.shippingMethod === 'print_by_myself' && (language === 'th' ? 'พิมพ์เอง' : 'Print By Myself')}
          {policy.shippingMethod === 'print_by_fairdee' && (language === 'th' ? 'พิมพ์โดยแฟร์ดี' : 'Print By FairDee')}
        </span>
      )}

      {/* Tracking Number if applicable */}
      {policy.trackingNumber && (
        <span className="text-xs text-muted-foreground">
          {policy.trackingNumber}
        </span>
      )}
    </div>
  );
}

interface ExpandablePolicyRowsProps {
  policyRecords: PolicyRecord[];
  stagePolicies?: PolicyRecord[];
  stage: PipelineStage;
  reworkConfigs: ReworkConfig[];
  onPolicyStatusChange?: (policyId: string, newStatus: PolicyStatus) => void;
  onPolicyReworkResolve?: (policyId: string) => void;
  onPolicyReworkReassign?: (policyId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => void;
}

export function ExpandablePolicyRows({ 
  policyRecords, 
  stagePolicies,
  stage,
  reworkConfigs,
  onPolicyStatusChange,
  onPolicyReworkResolve,
  onPolicyReworkReassign,
}: ExpandablePolicyRowsProps) {
  const { language } = useLanguageStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // IDs of stage-relevant policies for quick lookup
  const stagePolicyIds = new Set(stagePolicies?.map(p => p.id) || policyRecords.map(p => p.id));
  
  if (!policyRecords || policyRecords.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const policyCount = policyRecords.length;
  const policyLabel = policyCount === 1 
    ? (language === 'th' ? '1 กรมธรรม์' : '1 Policy')
    : (language === 'th' ? `${policyCount} กรมธรรม์` : `${policyCount} Policies`);

  return (
    <div className="w-full min-w-[200px]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <span>{policyLabel}</span>
        {/* Quick status badges when collapsed */}
        {!isExpanded && (
          <div className="flex gap-1 ml-2">
            {policyRecords.map((policy) => (
              <Badge 
                key={policy.id} 
                variant="secondary" 
                className={cn('text-[10px] px-1.5 py-0', getPolicyKindColor(policy.kind))}
              >
                {policyKindLabels[policy.kind][language]}
              </Badge>
            ))}
          </div>
        )}
      </button>

      {/* Expanded Policy Records */}
      {isExpanded && (
        <div className="mt-2 space-y-1 rounded-md overflow-hidden">
          {/* Always show VMI first, then CMI - consistent order */}
          {[...policyRecords]
            .sort((a, b) => {
              // VMI always comes first, CMI second
              if (a.kind === 'vmi' && b.kind === 'cmi') return -1;
              if (a.kind === 'cmi' && b.kind === 'vmi') return 1;
              return 0;
            })
            .map((policy) => {
              const isRelevant = stagePolicyIds.has(policy.id);
              return (
                <PolicyRecordRow 
                  key={policy.id} 
                  policy={policy}
                  isStageRelevant={isRelevant}
                  isEditable={isRelevant}
                  stage={stage}
                  reworkConfigs={reworkConfigs}
                  onStatusChange={onPolicyStatusChange}
                  onReworkResolve={onPolicyReworkResolve}
                  onReworkReassign={onPolicyReworkReassign}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
