import { PolicyRecord, PolicyStatus } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PolicyStatusCellProps {
  policy: PolicyRecord | undefined;
  isEditable?: boolean;
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

export function PolicyStatusCell({ policy, isEditable = false, onStatusChange }: PolicyStatusCellProps) {
  const { language } = useLanguageStore();

  // No policy - show dash
  if (!policy) {
    return (
      <span className="text-muted-foreground">-</span>
    );
  }

  // Editable - show dropdown
  if (isEditable) {
    return (
      <Select
        value={policy.status}
        onValueChange={(value) => onStatusChange?.(policy.id, value as PolicyStatus)}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
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
    );
  }

  // Not editable - show greyed out box
  return (
    <div className="w-[160px] h-8 text-xs flex items-center px-3 rounded-md border border-input bg-muted/50 text-muted-foreground cursor-not-allowed">
      {policyStatusTranslations[policy.status][language]}
    </div>
  );
}
