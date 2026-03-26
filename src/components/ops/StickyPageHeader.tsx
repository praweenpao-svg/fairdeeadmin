import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { cn } from '@/lib/utils';

interface StickyPageHeaderProps {
  sale: SaleDetail;
}

function StatusBadge({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-semibold',
        color
      )}
    >
      {label}: {status}
    </Badge>
  );
}

const stageLabels: Record<string, { en: string; th: string }> = {
  to_pay: { en: 'To Pay Premium', th: 'รอชำระเบี้ย' },
  to_report: { en: 'To Report Sale', th: 'รอแจ้งงาน' },
  to_issue: { en: 'To Issue Policy', th: 'รอออกกรมธรรม์' },
  to_deliver: { en: 'To Deliver Policy', th: 'รอจัดส่ง' },
  completed: { en: 'Completed', th: 'เสร็จสิ้น' },
};

const policyStatusLabels: Record<string, string> = {
  pending_payment: 'Pending Payment',
  pending_review: 'Pending Review',
  pending_issuance: 'Pending Issuance',
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
  pending_payment: 'border-blue-500 text-blue-600',
  pending_review: 'border-blue-500 text-blue-600',
  pending_issuance: 'border-blue-500 text-blue-600',
  policy_issued: 'border-green-500 text-green-600',
  policy_shipped: 'border-green-500 text-green-600',
  policy_delivered: 'border-green-500 text-green-600',
  policy_cancelled: 'border-red-500 text-red-600',
  rework_required: 'border-amber-500 text-amber-600',
};

export function StickyPageHeader({ sale }: StickyPageHeaderProps) {
  const navigate = useNavigate();
  const { language } = useLanguageStore();

  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');
  const cmiPolicy = sale.policies.find(p => p.kind === 'cmi');
  const currentStage = 'to_issue'; // Mock: derive from sale state
  const stageLabel = stageLabels[currentStage] || stageLabels.to_issue;

  return (
    <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
      {/* Row 1: Navigation & Identity */}
      <div className="flex items-center gap-3 px-6 py-2.5">
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <Badge className="bg-primary text-primary-foreground text-sm px-3 py-0.5 font-bold">
          #{sale.qqId}
        </Badge>

        <span className="text-sm font-semibold">
          {sale.customer.firstName} {sale.customer.lastName}
        </span>

        <Badge variant="outline" className="border-primary text-primary text-[10px] font-semibold">
          {language === 'th' ? stageLabel.th : stageLabel.en}
        </Badge>

        {/* VMI Status */}
        {vmiPolicy && (
          <StatusBadge
            label="VMI"
            status={policyStatusLabels[vmiPolicy.status] || vmiPolicy.status}
            color={policyStatusColorMap[vmiPolicy.status] || ''}
          />
        )}

        {/* CMI Status — only for VMI+CMI */}
        {cmiPolicy && (
          <StatusBadge
            label="CMI"
            status={policyStatusLabels[cmiPolicy.status] || cmiPolicy.status}
            color={policyStatusColorMap[cmiPolicy.status] || ''}
          />
        )}
      </div>

      {/* Row 2: Sale Summary */}
      <div className="flex items-center gap-4 px-6 pb-2.5 text-xs text-muted-foreground">
        <span>{vmiPolicy?.insurer || '—'}</span>
        <span className="text-foreground font-medium">
          {language === 'th' ? 'ชั้น' : 'Class'} {vmiPolicy?.coverage.insuranceClass || '—'}
        </span>
        <span className="text-foreground font-semibold">
          {sale.policies.reduce((sum, p) => sum + p.premiumAfterTax, 0).toLocaleString()} ฿
        </span>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-semibold',
            paymentStatusColors[sale.paymentStatus] || ''
          )}
        >
          {sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1)}
        </Badge>
      </div>
    </div>
  );
}
