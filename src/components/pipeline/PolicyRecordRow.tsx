import { ChevronDown, ChevronRight } from 'lucide-react';
import { PolicyRecord, PolicyStatus, PolicyKind } from '@/types/pipeline';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface PolicyRecordRowProps {
  policy: PolicyRecord;
  isStageRelevant?: boolean; // Whether this policy is relevant to the current stage
  isEditable?: boolean; // Whether this policy status can be edited in this stage
  onStatusChange?: (policyId: string, newStatus: PolicyStatus) => void;
}

// Policy status translations
const policyStatusTranslations: Record<PolicyStatus, { en: string; th: string }> = {
  pending_payment: { en: 'Pending Payment', th: 'รอชำระเงิน' },
  pending_review: { en: 'Pending Review', th: 'รอตรวจเอกสาร' },
  pending_issuance: { en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  policy_issued: { en: 'Policy Uploaded', th: 'กรมธรรม์ออกแล้ว' },
  policy_shipped: { en: 'Policy Shipped', th: 'กรมธรรม์ถูกจัดส่ง' },
  policy_delivered: { en: 'Policy Delivered', th: 'กรมธรรม์จัดส่งสำเร็จ' },
  policy_cancelled: { en: 'Policy Cancelled', th: 'กรมธรรม์ยกเลิก' },
};

// Policy kind translations
const policyKindLabels: Record<PolicyKind, { en: string; th: string }> = {
  vmi: { en: 'VMI Policy', th: 'กรมธรรม์ภาคสมัครใจ' },
  cmi: { en: 'CMI Policy', th: 'กรมธรรม์ภาคบังคับ' },
};

// Status options available for each stage context
const policyStatusOptions: PolicyStatus[] = [
  'pending_payment',
  'pending_review',
  'pending_issuance',
  'policy_issued',
  'policy_shipped',
  'policy_delivered',
  'policy_cancelled',
];

// Get badge color based on policy kind
function getPolicyKindColor(kind: PolicyKind): string {
  return kind === 'vmi' 
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
}

// Get status badge color
function getStatusBadgeColor(status: PolicyStatus): string {
  switch (status) {
    case 'pending_payment':
    case 'pending_review':
    case 'pending_issuance':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    case 'policy_issued':
    case 'policy_shipped':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'policy_delivered':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'policy_cancelled':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function PolicyRecordRow({ policy, isStageRelevant = true, isEditable = true, onStatusChange }: PolicyRecordRowProps) {
  const { language } = useLanguageStore();

  return (
    <div className={cn(
      'flex items-center gap-4 py-2 px-4 border-l-2',
      isStageRelevant 
        ? 'bg-muted/30 border-primary/50' 
        : 'bg-muted/10 border-muted-foreground/20 opacity-60'
    )}>
      {/* Policy Kind Badge */}
      <Badge 
        variant="secondary" 
        className={cn('text-xs font-medium', getPolicyKindColor(policy.kind))}
      >
        {policyKindLabels[policy.kind][language]}
      </Badge>

      {/* Status Selector - editable only if in correct stage */}
      <div className="flex-1">
        {isEditable ? (
          <Select
            value={policy.status}
            onValueChange={(value) => onStatusChange?.(policy.id, value as PolicyStatus)}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {policyStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {policyStatusTranslations[status][language]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge 
            variant="secondary" 
            className={cn('text-xs font-medium cursor-not-allowed', getStatusBadgeColor(policy.status))}
          >
            {policyStatusTranslations[policy.status][language]}
          </Badge>
        )}
      </div>

      {/* Shipping Method if applicable */}
      {policy.shippingMethod && (
        <span className="text-xs text-muted-foreground">
          {policy.shippingMethod === 'e_policy' && (language === 'th' ? 'E-Policy' : 'E-Policy')}
          {policy.shippingMethod === 'print_by_myself' && (language === 'th' ? 'พิมพ์เอง' : 'Print By Myself')}
          {policy.shippingMethod === 'print_by_fairdee' && (language === 'th' ? 'พิมพ์โดย Fairdee' : 'Print By Fairdee')}
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
  stagePolicies?: PolicyRecord[]; // Policies relevant to current stage (for highlighting and editing)
  isExpanded: boolean;
  onToggle: () => void;
  onPolicyStatusChange?: (policyId: string, newStatus: PolicyStatus) => void;
}

export function ExpandablePolicyRows({ 
  policyRecords, 
  stagePolicies,
  isExpanded, 
  onToggle,
  onPolicyStatusChange,
}: ExpandablePolicyRowsProps) {
  const { language } = useLanguageStore();
  
  // IDs of stage-relevant policies for quick lookup
  const stagePolicyIds = new Set(stagePolicies?.map(p => p.id) || policyRecords.map(p => p.id));
  
  if (!policyRecords || policyRecords.length === 0) {
    return null;
  }

  const policyCount = policyRecords.length;
  const policyLabel = policyCount === 1 
    ? (language === 'th' ? '1 กรมธรรม์' : '1 Policy')
    : (language === 'th' ? `${policyCount} กรมธรรม์` : `${policyCount} Policies`);

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
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
          {policyRecords
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
                  isEditable={isRelevant} // Only editable if in correct stage
                  onStatusChange={onPolicyStatusChange}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
