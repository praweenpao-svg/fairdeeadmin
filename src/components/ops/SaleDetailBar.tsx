import React from 'react';
import { ChevronDown, FileUp, XCircle, Mail, Upload, History, CreditCard, FileText } from 'lucide-react';
import mtiLogo from '@/assets/insurer-mti.png';
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

interface SaleDetailBarProps {
  sale: SaleDetail;
  hasActiveRework?: boolean;
  onOpenUploadPolicy?: () => void;
  onOpenHistoryLog?: () => void;
  onOpenEndorsement?: () => void;
  onOpenUploadDoc?: () => void;
}

const stageLabels: Record<string, { en: string; th: string }> = {
  to_issue: { en: 'To Issue Policy', th: 'รอออกกรมธรรม์' },
  to_report: { en: 'To Report Sale', th: 'รอแจ้งงาน' },
  to_deliver: { en: 'To Deliver Policy', th: 'รอจัดส่ง' },
  completed: { en: 'Completed', th: 'เสร็จสิ้น' },
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

const paymentStatusColors: Record<string, string> = {
  paid: 'border-green-500 text-green-600 bg-green-500/10',
  unpaid: 'border-red-500 text-red-600 bg-red-500/10',
  pending: 'border-yellow-500 text-yellow-600 bg-yellow-500/10',
  partial: 'border-orange-500 text-orange-600 bg-orange-500/10',
};

function getPrimaryAction(
  saleStage: string,
  hasActiveRework: boolean,
  language: string,
): { label: string; icon: React.ElementType; group: string } | null {
  if (hasActiveRework) {
    return { label: language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log', icon: History, group: 'G4' };
  }
  switch (saleStage) {
    case 'to_report':
      return { label: language === 'th' ? 'ส่งอีเมลถึง บ.ประกัน' : 'Send Email to Insurer', icon: Mail, group: 'G2' };
    case 'to_issue':
      return { label: language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy', icon: FileUp, group: 'G2' };
    default:
      return null;
  }
}

export function SaleDetailBar({
  sale,
  hasActiveRework = false,
  onOpenUploadPolicy,
  onOpenHistoryLog,
  onOpenEndorsement,
  onOpenUploadDoc,
}: SaleDetailBarProps) {
  const { language } = useLanguageStore();
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');
  const cmiPolicy = sale.policies.find(p => p.kind === 'cmi');
  const currentStage = 'to_issue';
  const stageLabel = stageLabels[currentStage] || stageLabels.to_issue;
  const primaryAction = getPrimaryAction(currentStage, hasActiveRework, language);

  const handleAction = (actionName: string) => {
    toast.success(actionName, {
      description: language === 'th' ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต' : 'This will connect to the real system.',
    });
  };

  const handlePrimaryClick = () => {
    if (!primaryAction) return;
    if (primaryAction.group === 'G4') { onOpenHistoryLog?.(); return; }
    if (primaryAction.group === 'G2' && currentStage === 'to_issue') { onOpenUploadPolicy?.(); return; }
    handleAction(primaryAction.label);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-4">
        {/* Insurer logo */}
        <img src={mtiLogo} alt="Muang Thai Insurance" className="w-10 h-10 rounded-lg object-cover shrink-0" />

        {/* Quotation info */}
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground">
            {language === 'th' ? 'เลขใบเสนอราคา' : 'Quotation Number'}
          </span>
          <p className="text-sm font-bold leading-tight">{sale.qqId}</p>
          <span className="text-xs text-primary">
            {language === 'th' ? 'เมืองไทยประกันภัย' : 'Muang Thai Insurance'} · {language === 'th' ? `ชั้น ${vmiPolicy?.coverage.insuranceClass || '—'}` : `Type ${vmiPolicy?.coverage.insuranceClass || '—'}`} · {language === 'th' ? (vmiPolicy?.garageType === 'Dealership' ? 'ซ่อมห้าง' : 'ซ่อมอู่') : (vmiPolicy?.garageType === 'Dealership' ? 'Dealership' : 'Approved Garage')}
          </span>
        </div>

        <div className="flex-1" />

        {primaryAction && (
          <Button
            size="sm"
            className={cn('text-xs gap-1.5', hasActiveRework && 'bg-orange-500 hover:bg-orange-600 text-white')}
            onClick={handlePrimaryClick}
          >
            <primaryAction.icon className="w-3.5 h-3.5" />
            {primaryAction.label}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              {language === 'th' ? 'เพิ่มเติม' : 'More Actions'}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-popover z-50">
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              G2 · {language === 'th' ? 'ออกกรมธรรม์' : 'Policy Issuance'}
            </DropdownMenuLabel>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Send Email to Insurer')}>
              <Mail className="w-3.5 h-3.5" />
              {language === 'th' ? 'ส่งอีเมลถึง บ.ประกัน' : 'Send Email to Insurer'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => { if (onOpenUploadPolicy) onOpenUploadPolicy(); else handleAction('Upload Policy'); }}>
              <FileUp className="w-3.5 h-3.5" />
              {language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              G4 · {language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log'}
            </DropdownMenuLabel>
            <DropdownMenuItem className={cn('text-xs gap-2', hasActiveRework && 'text-orange-600')} onClick={() => { if (onOpenHistoryLog) onOpenHistoryLog(); else handleAction('History & Activity Log'); }}>
              <History className={cn('w-3.5 h-3.5', hasActiveRework && 'text-orange-500')} />
              {language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              G5 · {language === 'th' ? 'สลักหลัง' : 'Endorsement'}
            </DropdownMenuLabel>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => { if (onOpenEndorsement) onOpenEndorsement(); else handleAction('Record Endorsement'); }}>
              <XCircle className="w-3.5 h-3.5" />
              {language === 'th' ? 'บันทึกสลักหลัง' : 'Record Endorsement'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              G8 · {language === 'th' ? 'เอกสารและสื่อสาร' : 'Docs & Comms'}
            </DropdownMenuLabel>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => { if (onOpenUploadDoc) onOpenUploadDoc(); else handleAction('Upload Document'); }}>
              <Upload className="w-3.5 h-3.5" />
              {language === 'th' ? 'อัปโหลดเอกสาร' : 'Upload Document'}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs gap-2">
                <Mail className="w-3.5 h-3.5" />
                {language === 'th' ? 'ส่งอีเมล' : 'Send Email'}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-popover z-50">
                <DropdownMenuItem className="text-xs" onClick={() => handleAction('Send: Docs Rejection')}>
                  {language === 'th' ? 'แจ้งเอกสารไม่ถูกต้อง' : 'Docs Rejection'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => handleAction('Send: Docs Approved + Invoice')}>
                  {language === 'th' ? 'เอกสารถูกต้อง + ใบแจ้งหนี้' : 'Docs Approved with Invoice'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => handleAction('Send: Vehicle Docs to Affiliate')}>
                  {language === 'th' ? 'ส่งเอกสารรถให้ตัวแทน' : 'Vehicle Docs to Affiliate'}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
