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
import { AlertTriangle } from 'lucide-react';

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
// All policy statuses shown in every post-lead stage dropdown
// Manual restriction is enforced in the handler (only rework_required is freely selectable)
const allPolicyStatuses: PolicyStatus[] = [
  'pending_payment',
  'pending_review',
  'pending_issuance',
  'policy_issued',
  'policy_shipped',
  'policy_delivered',
  'policy_cancelled',
  'rework_required',
];

const policyStatusOptionsByStage: Record<PipelineStage, PolicyStatus[]> = {
  all: allPolicyStatuses,
  to_convert: [], // No policy statuses in to_convert
  to_pay: allPolicyStatuses,
  to_report: allPolicyStatuses,
  to_issue: allPolicyStatuses,
  to_deliver: allPolicyStatuses,
  completed: allPolicyStatuses,
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

  // Count unresolved rework entries (both internal and external)
  const unresolvedCount = policy.reworkHistory?.filter(r => !r.resolved).length || 0;
  const hasInternalOnlyRework = unresolvedCount > 0 && policy.status !== 'rework_required';

  // If policy is in rework_required state (external rework), clicking opens rework dialog directly
  if (policy.status === 'rework_required' && onOpenRemarks) {
    const reworkColor = policyStatusColors.rework_required;
    return (
      <button
        onClick={() => onOpenRemarks(policy.id)}
        className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 rounded-md border cursor-pointer transition-colors bg-warning/10 hover:bg-warning/20 text-primary border-primary/30"
      >
        <span>{policyStatusTranslations.rework_required[language]}</span>
        {unresolvedCount > 0 && (
          <span 
            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary"
          >
            {unresolvedCount}
          </span>
        )}
      </button>
    );
  }

  // If has internal-only rework: show as a clickable button (identical layout to rework_required)
  // but using the current status color. No dropdown allowed.
  if (hasInternalOnlyRework && onOpenRemarks) {
    const statusColor = policyStatusColors[policy.status];
    const statusStyles = getStatusStyles(policy.status, policyStatusColors);
    return (
      <button
        onClick={() => onOpenRemarks(policy.id)}
        className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 rounded-md border cursor-pointer transition-colors"
        style={{ 
          backgroundColor: statusStyles.backgroundColor,
          borderColor: statusColor ? `${statusColor.text}30` : undefined,
          color: statusStyles.color,
        }}
      >
        <span>{policyStatusTranslations[policy.status]?.[language] || policy.status}</span>
        <span 
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: statusColor ? `${statusColor.text}20` : undefined,
            color: statusColor?.text,
          }}
        >
          {unresolvedCount}
        </span>
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
      style={hasCustomColor ? disabledStatusStyles : { backgroundColor: 'hsl(var(--muted) / 0.8)', borderColor: 'hsl(var(--input))', color: 'hsl(var(--muted-foreground))' }}
    >
      {policyStatusTranslations[policy.status]?.[language] || policy.status}
    </div>
  );
}
