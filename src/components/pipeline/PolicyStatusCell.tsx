import { PolicyRecord, PolicyStatus, PipelineStage, ReworkConfig, ReworkAttachment } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PolicyReworkActions } from './PolicyReworkActions';
import { policyStatusColors, getStatusStyles } from '@/utils/statusColors';
import { getPolicyStage } from './PipelineTabs';

interface PolicyStatusCellProps {
  policy: PolicyRecord | undefined;
  stage: PipelineStage;
  isEditable?: boolean;
  reworkConfigs?: ReworkConfig[];
  onStatusChange?: (policyId: string, newStatus: PolicyStatus) => void;
  onReworkAdd?: (policyId: string, reasonId: string, details: string, attachments: ReworkAttachment[]) => void;
  onOpenRemarks?: (policyId: string) => void;
}

// Policy status translations
const policyStatusTranslations: Record<string, { en: string; th: string }> = {
  pending_payment: { en: 'Pending', th: 'รอดำเนินการ' },
  pending_review: { en: 'Pending Review', th: 'รอตรวจเอกสาร' },
  pending_issuance: { en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  policy_issued: { en: 'Policy Uploaded', th: 'กรมธรรม์ออกแล้ว' },
  policy_shipped: { en: 'Policy Shipped', th: 'กรมธรรม์ถูกจัดส่ง' },
  policy_delivered: { en: 'Policy Delivered', th: 'กรมธรรม์จัดส่งสำเร็จ' },
  policy_cancelled: { en: 'Policy Cancelled', th: 'กรมธรรม์ยกเลิก' },
  rework_required: { en: 'Rework Required', th: 'งานติดปัญหา' },
};

// Stage-specific policy status options (mirrors statusOptionsByStage but for policies)
// rework_required is included for stages that have rework configs (except cancelled)
const policyStatusOptionsByStage: Record<PipelineStage, PolicyStatus[]> = {
  all: [], // Empty - will be determined dynamically based on policy's actual stage
  to_convert: [], // No policy statuses in to_convert
  to_pay: [
    'pending_payment',
    'rework_required',
  ],
  to_report: [
    'pending_review',
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
    // No rework_required for cancelled stage
  ],
};

export function PolicyStatusCell({ 
  policy, 
  stage, 
  isEditable = false, 
  reworkConfigs = [],
  onStatusChange,
  onReworkAdd,
  onOpenRemarks,
}: PolicyStatusCellProps) {
  const { language } = useLanguageStore();

  // No policy - show dash
  if (!policy) {
    return (
      <span className="text-muted-foreground">-</span>
    );
  }

  // Determine effective stage: for 'all' tab, use the policy's actual stage
  const effectiveStage = stage === 'all' 
    ? (getPolicyStage(policy) || 'to_pay') // fallback to to_pay if null
    : stage;

  // If policy is in rework_required state, clicking opens rework dialog directly
  if (policy.status === 'rework_required' && onOpenRemarks) {
    const unresolvedCount = policy.reworkHistory?.filter(r => !r.resolved).length || 0;
    return (
      <button
        onClick={() => onOpenRemarks(policy.id)}
        className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 rounded-md border cursor-pointer transition-colors bg-warning/15 hover:bg-warning/25"
        style={{ 
          borderColor: 'hsl(var(--primary) / 0.4)', 
          color: 'hsl(var(--primary))' 
        }}
      >
        <span>{policyStatusTranslations.rework_required[language]}</span>
        {unresolvedCount > 0 && (
          <span className="text-[10px] font-medium bg-warning/20 px-1.5 py-0.5 rounded">
            {unresolvedCount}
          </span>
        )}
      </button>
    );
  }


  // Get status options for the effective stage
  const statusOptions = policyStatusOptionsByStage[effectiveStage] || [];

  // Get color styles for the status
  const statusStyles = getStatusStyles(policy.status, policyStatusColors);
  const disabledStatusStyles = getStatusStyles(policy.status, policyStatusColors, true);

  // Editable - show dropdown
  if (isEditable && statusOptions.length > 0) {
    return (
      <Select
        value={policy.status}
        onValueChange={(value) => onStatusChange?.(policy.id, value as PolicyStatus)}
      >
        <SelectTrigger 
          className="w-full h-8 text-xs"
          style={statusStyles}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {policyStatusTranslations[status]?.[language] || status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Not editable - show greyed out box with status color (reduced opacity)
  const hasCustomColor = disabledStatusStyles.backgroundColor;
  return (
    <div 
      className="w-full h-8 text-xs flex items-center px-3 rounded-md border cursor-not-allowed"
      style={hasCustomColor ? disabledStatusStyles : { backgroundColor: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--input))', color: 'hsl(var(--muted-foreground))' }}
    >
      {policyStatusTranslations[policy.status]?.[language] || policy.status}
    </div>
  );
}
