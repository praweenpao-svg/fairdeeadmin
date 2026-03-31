import React, { useState } from 'react';
import { ChevronDown, FileUp, AlertTriangle, XCircle, MessageSquare, Mail, Upload, History, FileText, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
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

/**
 * Stage → Primary Button mapping per Section 13A v3 US-11 R-57
 */
function getPrimaryAction(
  saleStage: string,
  hasActiveRework: boolean,
  language: string,
): { label: string; icon: React.ElementType; group: string } | null {
  // R-58: Rework override
  if (hasActiveRework) {
    return {
      label: language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log',
      icon: History,
      group: 'G4',
    };
  }

  switch (saleStage) {
    case 'pending_review':
    case 'to_report':
      return {
        label: language === 'th' ? 'ส่งอีเมลถึง บ.ประกัน' : 'Send Email to Insurer',
        icon: Mail,
        group: 'G2',
      };
    case 'pending_issuance':
    case 'to_issue':
      return {
        label: language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy',
        icon: FileUp,
        group: 'G2',
      };
    case 'pending_delivery':
    case 'to_deliver':
    case 'completed':
      return null; // No primary — R-57
    default:
      return null;
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

  const primaryAction = getPrimaryAction(currentStage, hasActiveRework, language);

  const handleAction = (actionName: string) => {
    toast.success(actionName, {
      description: language === 'th' ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต' : 'This will connect to the real system.',
    });
  };

  const handlePrimaryClick = () => {
    if (!primaryAction) return;
    if (primaryAction.group === 'G4') {
      onOpenHistoryLog?.();
      return;
    }
    if (primaryAction.group === 'G2' && currentStage === 'to_issue') {
      onOpenUploadPolicy?.();
      return;
    }
    handleAction(primaryAction.label);
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
