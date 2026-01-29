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

interface PolicyStatusCellProps {
  policy: PolicyRecord | undefined;
  stage: PipelineStage;
  isEditable?: boolean;
  reworkConfigs?: ReworkConfig[];
  onStatusChange?: (policyId: string, newStatus: PolicyStatus) => void;
  onReworkResolve?: (policyId: string) => void;
  onReworkReassign?: (policyId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => void;
}

// Policy status translations
const policyStatusTranslations: Record<string, { en: string; th: string }> = {
  pending_payment: { en: 'Pending Payment', th: 'รอชำระเงิน' },
  pending_review: { en: 'Pending Review', th: 'รอตรวจเอกสาร' },
  pending_issuance: { en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  policy_issued: { en: 'Policy Uploaded', th: 'กรมธรรม์ออกแล้ว' },
  policy_shipped: { en: 'Policy Shipped', th: 'กรมธรรม์ถูกจัดส่ง' },
  policy_delivered: { en: 'Policy Delivered', th: 'กรมธรรม์จัดส่งสำเร็จ' },
  policy_cancelled: { en: 'Policy Cancelled', th: 'กรมธรรม์ยกเลิก' },
  rework_required: { en: 'Rework Required', th: 'งานติดปัญหา' },
};

// Stage-specific policy status options (mirrors statusOptionsByStage but for policies)
// rework_required is included for stages that have rework configs
const policyStatusOptionsByStage: Record<PipelineStage, PolicyStatus[]> = {
  all: [
    'pending_payment',
    'pending_review',
    'pending_issuance',
    'policy_issued',
    'policy_shipped',
    'policy_delivered',
    'policy_cancelled',
  ],
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
  ],
};

export function PolicyStatusCell({ 
  policy, 
  stage, 
  isEditable = false, 
  reworkConfigs = [],
  onStatusChange,
  onReworkResolve,
  onReworkReassign,
}: PolicyStatusCellProps) {
  const { language } = useLanguageStore();

  // No policy - show dash
  if (!policy) {
    return (
      <span className="text-muted-foreground">-</span>
    );
  }

  // If policy is in rework_required state, show rework actions
  if (policy.status === 'rework_required' && isEditable && onReworkResolve && onReworkReassign) {
    return (
      <PolicyReworkActions
        policy={policy}
        reworkConfigs={reworkConfigs}
        onResolve={onReworkResolve}
        onReassign={onReworkReassign}
      />
    );
  }

  // Get status options for the current stage
  const statusOptions = policyStatusOptionsByStage[stage] || [];

  // Editable - show dropdown
  if (isEditable && statusOptions.length > 0) {
    return (
      <Select
        value={policy.status}
        onValueChange={(value) => onStatusChange?.(policy.id, value as PolicyStatus)}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {policyStatusTranslations[status]?.[language] || status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Not editable - show greyed out box
  return (
    <div className="w-[160px] h-8 text-xs flex items-center px-3 rounded-md border border-input bg-muted/50 text-muted-foreground cursor-not-allowed">
      {policyStatusTranslations[policy.status]?.[language] || policy.status}
    </div>
  );
}
