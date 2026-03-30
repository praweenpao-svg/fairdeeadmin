import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, FileUp, AlertTriangle, XCircle, ArrowRightLeft, MessageSquare, CheckCircle2, Hash, Truck, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
} from '@/components/ui/dropdown-menu';

interface StickyPageHeaderProps {
  sale: SaleDetail;
  mode?: 'A' | 'B';
}

function StatusBadge({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold', color)}>
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

// Determine the stage-governed primary action based on current stage
function getPrimaryAction(sale: SaleDetail, language: string): { label: string; icon: React.ElementType; action: string } {
  // Check stage progression
  if (sale.paymentStatus !== 'paid') {
    return { label: language === 'th' ? 'บันทึกการชำระ' : 'Record Payment', icon: CheckCircle2, action: 'record_payment' };
  }
  if (!sale.opsStep1Complete || !sale.opsStep2Complete) {
    return { label: language === 'th' ? 'ตรวจสอบ OPS' : 'Complete OPS Verification', icon: CheckCircle2, action: 'ops_verify' };
  }
  // Check if any policy needs issuance
  const needsIssuance = sale.policies.some(p => !p.policyNumber);
  if (needsIssuance) {
    return { label: language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy', icon: FileUp, action: 'upload_policy' };
  }
  // Check delivery
  const needsDelivery = sale.policies.some(p => !p.trackingNumber && p.deliveryMethod !== 'e_policy');
  if (needsDelivery) {
    return { label: language === 'th' ? 'จัดส่งกรมธรรม์' : 'Ship Policy', icon: Truck, action: 'ship_policy' };
  }
  return { label: language === 'th' ? 'ดำเนินการเสร็จสิ้น' : 'Mark Completed', icon: CheckCircle2, action: 'complete' };
}

export function StickyPageHeader({ sale, mode = 'B' }: StickyPageHeaderProps) {
  const navigate = useNavigate();
  const { language } = useLanguageStore();

  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');
  const cmiPolicy = sale.policies.find(p => p.kind === 'cmi');
  const currentStage = 'to_issue';
  const stageLabel = stageLabels[currentStage] || stageLabels.to_issue;
  const primaryAction = getPrimaryAction(sale, language);

  const handleAction = (actionName: string) => {
    toast.success(`${actionName}`, {
      description: language === 'th' ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต' : 'This will connect to the real system.',
    });
  };

  return (
    <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
      {/* Row 1: Navigation, Identity & Status */}
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

        {vmiPolicy && (
          <StatusBadge
            label="VMI"
            status={policyStatusLabels[vmiPolicy.status] || vmiPolicy.status}
            color={policyStatusColorMap[vmiPolicy.status] || ''}
          />
        )}
        {cmiPolicy && (
          <StatusBadge
            label="CMI"
            status={policyStatusLabels[cmiPolicy.status] || cmiPolicy.status}
            color={policyStatusColorMap[cmiPolicy.status] || ''}
          />
        )}

        {/* Spacer to push actions right */}
        <div className="flex-1" />

        {/* Mode B: Primary Button + More Actions */}
        {mode === 'B' && (
          <div className="flex items-center gap-2">
            <Button size="sm" className="text-xs gap-1.5" onClick={() => handleAction(primaryAction.label)}>
              <primaryAction.icon className="w-3.5 h-3.5" />
              {primaryAction.label}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  {language === 'th' ? 'เพิ่มเติม' : 'More Actions'}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                {/* G2 — Policy Issuance */}
                <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {language === 'th' ? 'ออกกรมธรรม์' : 'Policy Issuance'}
                </DropdownMenuLabel>
                {sale.policies.map(p => (
                  <React.Fragment key={`g2-${p.kind}`}>
                    <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction(`Notify Insurer (${p.kind.toUpperCase()})`)}>
                      <FileUp className="w-3 h-3" />
                      {p.kind.toUpperCase()} — {language === 'th' ? 'แจ้ง บ.ประกัน' : 'Notify Insurer'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction(`Upload Policy (${p.kind.toUpperCase()})`)}>
                      <FileUp className="w-3 h-3" />
                      {p.kind.toUpperCase()} — {language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction(`Policy Number (${p.kind.toUpperCase()})`)}>
                      <Hash className="w-3 h-3" />
                      {p.kind.toUpperCase()} — {language === 'th' ? 'เลขกรมธรรม์' : 'Policy Number'}
                    </DropdownMenuItem>
                  </React.Fragment>
                ))}

                <DropdownMenuSeparator />

                {/* G4 — Rework & Remarks */}
                <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {language === 'th' ? 'Rework และหมายเหตุ' : 'Rework & Remarks'}
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Log Rework')}>
                  <AlertTriangle className="w-3 h-3" />
                  {language === 'th' ? 'บันทึก Rework' : 'Log Rework'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Add Remark')}>
                  <MessageSquare className="w-3 h-3" />
                  {language === 'th' ? 'เพิ่มหมายเหตุ' : 'Add Remark'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Resolve Rework')}>
                  <CheckCircle2 className="w-3 h-3" />
                  {language === 'th' ? 'แก้ไข Rework' : 'Resolve Rework'}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* G5 — Cancellation & Transfer */}
                <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {language === 'th' ? 'ยกเลิกและโอน' : 'Cancel & Transfer'}
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Request Endorsement/Cancel')}>
                  <XCircle className="w-3 h-3" />
                  {language === 'th' ? 'ขอสลักหลัง/ยกเลิก' : 'Endorsement / Cancel'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Transfer Sale')}>
                  <ArrowRightLeft className="w-3 h-3" />
                  {language === 'th' ? 'โอนงาน' : 'Transfer Sale'}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* G8 — Docs & Comms */}
                <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {language === 'th' ? 'เอกสารและสื่อสาร' : 'Docs & Comms'}
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Send Document')}>
                  <Package className="w-3 h-3" />
                  {language === 'th' ? 'ส่งเอกสาร' : 'Send Document'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
          className={cn('text-[10px] font-semibold', paymentStatusColors[sale.paymentStatus] || '')}
        >
          {sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1)}
        </Badge>
      </div>
    </div>
  );
}
