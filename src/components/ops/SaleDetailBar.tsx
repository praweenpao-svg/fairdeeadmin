import React, { useState } from 'react';
import { ChevronDown, FileUp, XCircle, Mail, Upload, History, CreditCard, FileText, Send, UserCheck } from 'lucide-react';
import insurerLogo from '@/assets/insurer-generic.png';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail, SalePolicy } from '@/data/mockSaleDetail';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useOpsLogic } from './OpsLogicContext';
import { kycStatuses } from './SaleOverviewCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  onAdvanceVmiStatus?: (next: string, actionLabel: string) => void;
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

// Status progression order (lower index = less progressed)
const statusProgression: string[] = [
  'pending_payment',
  'pending_review',
  'pending_issuance',
  'policy_issued',    // aka "Policy Uploaded"
  'policy_shipped',
  'policy_delivered',
];

function getLeastProgressedStatus(vmiStatus?: string, cmiStatus?: string): string | null {
  const vmi = vmiStatus || null;
  const cmi = cmiStatus || null;

  // Filter out cancelled and rework — treat as "ignore"
  const activeStatuses = [vmi, cmi].filter(
    s => s && s !== 'policy_cancelled' && s !== 'rework_required'
  ) as string[];

  if (activeStatuses.length === 0) return null;

  // Return the one with the lowest progression index
  let least = activeStatuses[0];
  let leastIdx = statusProgression.indexOf(least);
  if (leastIdx === -1) leastIdx = 999;

  for (let i = 1; i < activeStatuses.length; i++) {
    let idx = statusProgression.indexOf(activeStatuses[i]);
    if (idx === -1) idx = 999;
    if (idx < leastIdx) {
      least = activeStatuses[i];
      leastIdx = idx;
    }
  }
  return least;
}

interface PrimaryAction {
  label: string;
  icon?: React.ElementType;
  group: string;
}

function getPrimaryActions(
  vmiPolicy: SalePolicy | undefined,
  cmiPolicy: SalePolicy | undefined,
  language: string,
  isInstalment: boolean = false,
): PrimaryAction[] {
  const vmiStatus = vmiPolicy?.status;
  const cmiStatus = cmiPolicy?.status;

  // Priority override: either policy in rework_required
  if (vmiStatus === 'rework_required' || cmiStatus === 'rework_required') {
    return [{ label: language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log', icon: History, group: 'G4' }];
  }

  // Both cancelled → no primary
  const vmiCancelled = !vmiPolicy || vmiStatus === 'policy_cancelled';
  const cmiCancelled = !cmiPolicy || cmiStatus === 'policy_cancelled';
  if (vmiCancelled && cmiCancelled) return [];

  const least = getLeastProgressedStatus(vmiStatus, cmiStatus);
  if (!least) return [];

  switch (least) {
    case 'pending_payment': {
      const actions: PrimaryAction[] = [
        { label: language === 'th' ? 'ส่งใบแจ้งหนี้' : 'Send Billing Report', icon: CreditCard, group: 'G1' },
      ];
      if (isInstalment) {
        actions.push({ label: language === 'th' ? 'อนุมัติ KYC ด้วยตนเอง' : 'Manual KYC Approval', icon: UserCheck, group: 'G1' });
      }
      return actions;
    }
    case 'pending_review':
      return [
        { label: 'API', icon: Send, group: 'G2' },
        { label: language === 'th' ? 'อีเมล' : 'Email', icon: Mail, group: 'G2' },
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

export function SaleDetailBar({
  sale,
  hasActiveRework = false,
  onOpenUploadPolicy,
  onOpenHistoryLog,
  onOpenEndorsement,
  onOpenUploadDoc,
  onAdvanceVmiStatus,
}: SaleDetailBarProps) {
  const { language } = useLanguageStore();
  const { logic } = useOpsLogic();
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');
  const cmiPolicy = sale.policies.find(p => p.kind === 'cmi');
  const currentStage = 'to_issue';
  const stageLabel = stageLabels[currentStage] || stageLabels.to_issue;
  const isInstalment = logic.paymentType === 'Instalment' || /install?ment|ผ่อน/i.test(sale.paymentMethod || '');
  const primaryActions = getPrimaryActions(vmiPolicy, cmiPolicy, language, isInstalment);

  // Derive display values from Logic Controller (single source of truth for prototype)
  const classDisplay = (logic.insuranceClass || '').replace(/^Type/, '').trim() || (vmiPolicy?.coverage.insuranceClass ?? '—');
  const garageEn = vmiPolicy?.garageType === 'Dealership' ? 'Dealership' : 'Approved Garage';
  const garageTh = vmiPolicy?.garageType === 'Dealership' ? 'ซ่อมห้าง' : 'ซ่อมอู่';

  const handleAction = (actionName: string) => {
    toast.success(actionName, {
      description: language === 'th' ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต' : 'This will connect to the real system.',
    });
  };

  const [kycOpen, setKycOpen] = useState(false);
  const [kycValue, setKycValue] = useState<string>('');
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingMethod, setBillingMethod] = useState<string>('');
  const [billingPayable, setBillingPayable] = useState<string>('');

  const handlePrimaryClick = (action: PrimaryAction) => {
    if (action.group === 'G4') { onOpenHistoryLog?.(); return; }
    if (action.label === 'Upload Policy' || action.label === 'อัปโหลดกรมธรรม์') { onOpenUploadPolicy?.(); return; }
    if (action.label === 'Manual KYC Approval' || action.label === 'อนุมัติ KYC ด้วยตนเอง') { setKycOpen(true); return; }
    if (action.label === 'Send Billing Report' || action.label === 'ส่งใบแจ้งหนี้') { setBillingOpen(true); return; }
    // Map CTA → next VMI status (only when VMI is the bottleneck)
    const current = vmiPolicy?.status;
    let next: string | null = null;
    if (action.label === 'API' || action.label === 'Email' || action.label === 'อีเมล') {
      if (current === 'pending_review') next = 'pending_issuance';
    }
    if (next && onAdvanceVmiStatus) {
      onAdvanceVmiStatus(next, action.label);
      return;
    }
    handleAction(action.label);
  };

  const confirmBillingReport = () => {
    if (vmiPolicy?.status === 'pending_payment' && onAdvanceVmiStatus) {
      onAdvanceVmiStatus('pending_review', 'Send Billing Report');
    } else {
      handleAction('Send Billing Report');
    }
    setBillingOpen(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        {/* Insurer logo */}
        <div className="w-10 h-10 border border-border rounded-sm bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img src={insurerLogo} alt="Insurer" className="w-full h-full object-contain p-1" />
        </div>

        {/* Quotation info */}
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground">
            {language === 'th' ? 'เลขใบเสนอราคา' : 'Quotation Number'}
          </span>
          <p className="text-sm font-bold leading-tight">{sale.qqId}</p>
        </div>

        <div className="flex-1" />

        {primaryActions.map((action, idx) => (
          <Button
            key={idx}
            size="sm"
            className={cn('text-xs gap-1.5', action.group === 'G4' && 'bg-orange-500 hover:bg-orange-600 text-white')}
            onClick={() => handlePrimaryClick(action)}
          >
            {action.icon && <action.icon className="w-3.5 h-3.5" />}
            {action.label}
          </Button>
        ))}

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
              G5 · {language === 'th' ? 'อัปเดตการขาย' : 'Update Sale'}
            </DropdownMenuLabel>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => { if (onOpenEndorsement) onOpenEndorsement(); else handleAction('Update Sale'); }}>
              <XCircle className="w-3.5 h-3.5" />
              {language === 'th' ? 'อัปเดตการขาย' : 'Update Sale'}
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

      <Dialog open={kycOpen} onOpenChange={setKycOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'th' ? 'อนุมัติ KYC ด้วยตนเอง' : 'Manual KYC Approval'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs text-muted-foreground">
              {language === 'th' ? 'สถานะ' : 'Status'}
            </label>
            <Select value={kycValue} onValueChange={setKycValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={language === 'th' ? 'เลือกสถานะ EKYC' : 'Select EKYC Status'} />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {kycStatuses.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {language === 'th' ? opt.th : opt.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setKycOpen(false)}>
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              disabled={!kycValue}
              onClick={() => {
                const opt = kycStatuses.find(s => s.value === kycValue);
                handleAction(`KYC: ${opt ? (language === 'th' ? opt.th : opt.en) : kycValue}`);
                setKycOpen(false);
              }}
            >
              {language === 'th' ? 'บันทึก' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={billingOpen} onOpenChange={setBillingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'th' ? 'ข้อมูลเพิ่มเติม' : 'Additional Details'}</DialogTitle>
            <p className="text-xs text-muted-foreground pt-1">
              {language === 'th' ? 'โปรดระบุข้อมูลเพื่อดำเนินการต่อ' : 'Please provide the following details to proceed.'}
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                {language === 'th' ? 'วิธีการชำระเงิน' : 'Payment Methods'}
              </label>
              <Select value={billingMethod} onValueChange={setBillingMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={language === 'th' ? 'กรุณาเลือกตัวเลือก' : 'Select an option'} />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="qr_bill">{language === 'th' ? 'ชำระผ่าน QR / จ่ายบิล' : 'QR Code / Bill Payment'}</SelectItem>
                  <SelectItem value="credit_card">{language === 'th' ? 'ชำระเงินผ่านบัตรเครดิต' : 'Credit Card Payment'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                {language === 'th' ? 'ยอดจ่าย' : 'Payable'}
              </label>
              <Select value={billingPayable} onValueChange={setBillingPayable}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={language === 'th' ? 'กรุณาเลือกตัวเลือก' : 'Select an option'} />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="with_commission">{language === 'th' ? 'จ่ายเบี้ยเต็ม' : 'With Commission'}</SelectItem>
                  <SelectItem value="without_commission">{language === 'th' ? 'จ่ายเบี้ย หักค่าการตลาด' : 'Without Commission'}</SelectItem>
                  <SelectItem value="specific">{language === 'th' ? 'จ่ายหักส่วนลด' : 'Specific'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBillingOpen(false)}>
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              disabled={!billingMethod || !billingPayable}
              onClick={confirmBillingReport}
            >
              {language === 'th' ? 'ตกลง' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
