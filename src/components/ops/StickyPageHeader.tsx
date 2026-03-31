import React, { useState } from 'react';
import { ChevronDown, FileUp, AlertTriangle, XCircle, MessageSquare, Mail, Upload, History, FileText, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail, SalePolicy } from '@/data/mockSaleDetail';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

interface StickyPageHeaderProps {
  sale: SaleDetail;
  mode?: 'A' | 'B';
  hasActiveRework?: boolean;
  onOpenUploadPolicy?: () => void;
  onOpenHistoryLog?: () => void;
  onOpenEndorsement?: () => void;
  onOpenUploadDoc?: () => void;
}

function StatusBadge({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold', color)}>
      {label}: {status}
    </Badge>
  );
}

const stageLabels: Record<string, { en: string; th: string }> = {
  pending_review: { en: 'Pending Review', th: 'รอตรวจสอบ' },
  pending_issuance: { en: 'Pending Issuance', th: 'รออนุมัติ' },
  pending_delivery: { en: 'Pending Delivery', th: 'รอจัดส่ง' },
  completed: { en: 'Completed', th: 'เสร็จสิ้น' },
  rework_required: { en: 'Rework Required', th: 'ต้องแก้ไข' },
  to_pay: { en: 'To Pay Premium', th: 'รอชำระเบี้ย' },
  to_report: { en: 'To Report Sale', th: 'รอแจ้งงาน' },
  to_issue: { en: 'To Issue Policy', th: 'รอออกกรมธรรม์' },
  to_deliver: { en: 'To Deliver Policy', th: 'รอจัดส่ง' },
};

const policyStatusLabels: Record<string, string> = {
  pending_payment: 'Pending Payment',
  pending_review: 'Pending Review',
  pending_issuance: 'Pending Issuance',
  policy_uploaded: 'Policy Uploaded',
  policy_issued: 'Policy Issued',
  policy_shipped: 'Shipped',
  policy_delivered: 'Delivered',
  policy_cancelled: 'Cancelled',
  rework_required: 'Rework Required',
};

const paymentStatusColors: Record<string, string> = {
  paid: 'border-green-500 text-green-600 bg-green-500/10',
  unpaid: 'border-red-500 text-red-600 bg-red-500/10',
  pending: 'border-yellow-500 text-yellow-600 bg-yellow-500/10',
  partial: 'border-orange-500 text-orange-600 bg-orange-500/10',
};

const policyStatusColorMap: Record<string, string> = {
  pending_payment: 'border-muted-foreground text-muted-foreground',
  pending_review: 'border-blue-500 text-blue-600',
  pending_issuance: 'border-amber-500 text-amber-600',
  policy_uploaded: 'border-teal-500 text-teal-600',
  policy_issued: 'border-green-500 text-green-600',
  policy_shipped: 'border-indigo-500 text-indigo-600',
  policy_delivered: 'border-green-500 text-green-600',
  policy_cancelled: 'border-red-500 text-red-600',
  rework_required: 'border-orange-500 text-orange-600',
};

const statusProgression: string[] = [
  'pending_payment', 'pending_review', 'pending_issuance',
  'policy_issued', 'policy_shipped', 'policy_delivered',
];

function getLeastProgressedStatus(vmiStatus?: string, cmiStatus?: string): string | null {
  const activeStatuses = [vmiStatus, cmiStatus].filter(
    s => s && s !== 'policy_cancelled' && s !== 'rework_required'
  ) as string[];
  if (activeStatuses.length === 0) return null;
  let least = activeStatuses[0];
  let leastIdx = statusProgression.indexOf(least);
  if (leastIdx === -1) leastIdx = 999;
  for (let i = 1; i < activeStatuses.length; i++) {
    let idx = statusProgression.indexOf(activeStatuses[i]);
    if (idx === -1) idx = 999;
    if (idx < leastIdx) { least = activeStatuses[i]; leastIdx = idx; }
  }
  return least;
}

function getPrimaryActions(
  vmiPolicy: SalePolicy | undefined,
  cmiPolicy: SalePolicy | undefined,
  language: string,
): { label: string; icon: React.ElementType; group: string }[] {
  const vmiStatus = vmiPolicy?.status;
  const cmiStatus = cmiPolicy?.status;
  if (vmiStatus === 'rework_required' || cmiStatus === 'rework_required') {
    return [{ label: language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log', icon: History, group: 'G4' }];
  }
  const vmiCancelled = !vmiPolicy || vmiStatus === 'policy_cancelled';
  const cmiCancelled = !cmiPolicy || cmiStatus === 'policy_cancelled';
  if (vmiCancelled && cmiCancelled) return [];
  const least = getLeastProgressedStatus(vmiStatus, cmiStatus);
  if (!least) return [];
  switch (least) {
    case 'pending_payment':
      return [{ label: language === 'th' ? 'ส่งใบแจ้งหนี้' : 'Send Billing Report', icon: CreditCard, group: 'G1' }];
    case 'pending_review':
      return [
        { label: 'API', group: 'G2' },
        { label: language === 'th' ? 'อีเมล' : 'Email', group: 'G2' },
      ];
    case 'pending_issuance':
    case 'policy_issued':
    case 'policy_shipped':
    case 'policy_delivered':
      return [{ label: language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy', icon: FileUp, group: 'G2' }];
    default:
      return [];
  }
}

export function StickyPageHeader({
  sale,
  mode = 'B',
  hasActiveRework = false,
  onOpenUploadPolicy,
  onOpenHistoryLog,
  onOpenEndorsement,
  onOpenUploadDoc,
}: StickyPageHeaderProps) {
  const { language } = useLanguageStore();

  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');
  const cmiPolicy = sale.policies.find(p => p.kind === 'cmi');
  const currentStage = 'to_issue'; // Mock: derive from sale state
  const stageLabel = stageLabels[currentStage] || stageLabels.to_issue;

  const primaryActions = getPrimaryActions(vmiPolicy, cmiPolicy, language);

  const handleAction = (actionName: string) => {
    toast.success(actionName, {
      description: language === 'th' ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต' : 'This will connect to the real system.',
    });
  };

  return (
    <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
      {/* Only license plate — always visible across all steps */}
      <div className="flex items-center gap-3 px-6 py-2.5">
        <Badge className="bg-foreground text-background text-sm px-3 py-0.5 font-bold tracking-wider">
          UO6872 ✓
        </Badge>
      </div>
    </div>
  );
}
