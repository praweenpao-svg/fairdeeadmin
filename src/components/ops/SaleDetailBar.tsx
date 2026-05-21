import React, { useState } from 'react';
import { ChevronDown, FileUp, XCircle, Mail, Upload, History, CreditCard, FileText, Send, UserCheck, Percent, Tag, FilePen, FilePlus, ClipboardList, Wallet, ClipboardCheck, Download, Receipt, FileDown, MailCheck, ShoppingCart, RefreshCw, Pencil } from 'lucide-react';
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
  hasActiveEndorsement?: boolean;
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

// ---------------------------------------------------------------------------
// Primary CTA matrix — driven by VMI (col A) × CMI (col B) per sheet
// https://docs.google.com/spreadsheets/d/1maifFY0tLr999hGppfWsxVpMcyPzzwpudVmzjo-f2eU
//
// Override columns:
//   - Active Rework  → "History & Activity Log"
//   - Active Endorse → "Update Sale"
// Otherwise (col E) — derived from VMI/CMI status pair below.
// ---------------------------------------------------------------------------

// Action level per non-terminal status. Higher = further along.
// Pending = 1 is treated as a sale-level "shared" state — see resolver.
const STATUS_LEVEL: Record<string, number> = {
  pending_payment: 1,    // "Pending"
  pending_review: 2,     // "Pending Review"
  pending_issuance: 3,   // "Pending Issuance"
  policy_uploaded: 4,    // "Policy Uploaded"
  policy_issued: 4,      // treated as Uploaded for CTA purposes
  policy_shipped: 4,     // shipped/delivered share FairDee print-by-myself CTA
  policy_delivered: 4,
};

interface PrimaryAction {
  label: string;
  icon?: React.ElementType;
  group: string;
}

function ctaForLevel(
  level: number,
  language: string,
  isInstalment: boolean,
  shippingFormat: 'fairdee' | 'self' | 'epolicy' | string | undefined,
  driverStatus: string | undefined,
): PrimaryAction[] {
  switch (level) {
    case 1: {
      // Pending — sale-level
      const actions: PrimaryAction[] = [
        { label: language === 'th' ? 'ส่งสรุปให้ตัวแทน' : 'Send Summary to Agent', icon: MailCheck, group: 'G1' },
        { label: language === 'th' ? 'ส่งใบแจ้งหนี้' : 'Send Billing Report', icon: CreditCard, group: 'G1' },
      ];
      if (isInstalment) {
        actions.push({ label: language === 'th' ? 'อนุมัติ KYC ด้วยตนเอง' : 'Manual KYC Approval', icon: UserCheck, group: 'G1' });
      }
      return actions;
    }
    case 2:
      return [
        { label: language === 'th' ? 'ส่งอีเมลถึง บ.ประกัน' : 'Send Email to Insurer', icon: Mail, group: 'G2' },
        { label: language === 'th' ? 'ซื้อกรมธรรม์' : 'Purchase Policy', icon: ShoppingCart, group: 'G2' },
      ];
    case 3: {
      return [
        { label: language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy', icon: FileUp, group: 'G2' },
        { label: language === 'th' ? 'ดึงกรมธรรม์' : 'Fetch Policy', icon: Download, group: 'G2' },
      ];
    }
    case 4: {
      // Per spec sheet col E:
      //  - Uploaded/Shipped with Print-by-FairDee → Upload Policy
      //  - Uploaded with e-Policy → No Primary CTA
      //  - Delivered → No Primary CTA
      if (driverStatus === 'policy_delivered') return [];
      if (shippingFormat === 'epolicy') return [];
      return [{
        label: language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy',
        icon: FileUp,
        group: 'G2',
      }];
    }
    default:
      return [];
  }
}

function getPrimaryActions(
  vmiPolicy: SalePolicy | undefined,
  cmiPolicy: SalePolicy | undefined,
  language: string,
  isInstalment: boolean = false,
  hasActiveEndorsement: boolean = false,
  hasActiveRework: boolean = false,
  shippingFormat: 'fairdee' | 'self' | 'epolicy' | string | undefined = undefined,
): PrimaryAction[] {
  const vmiStatus = vmiPolicy?.status;
  const cmiStatus = cmiPolicy?.status;

  // Overrides (R-05/06/07/08): Active Rework and Active Endorsement evaluated
  // independently and combined as co-primary when both are active.
  const overrides: PrimaryAction[] = [];
  const reworkActive = hasActiveRework || vmiStatus === 'rework_required' || cmiStatus === 'rework_required';
  if (reworkActive) {
    overrides.push({ label: language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log', icon: History, group: 'G4' });
  }
  if (hasActiveEndorsement) {
    overrides.push({ label: language === 'th' ? 'อัปเดตการขาย' : 'Update Sale', icon: Pencil, group: 'G5' });
  }
  if (overrides.length > 0) return overrides;

  // Collect non-terminal levels per policy
  const vmiLevel = vmiStatus && vmiStatus !== 'policy_cancelled' ? STATUS_LEVEL[vmiStatus] : undefined;
  const cmiLevel = cmiStatus && cmiStatus !== 'policy_cancelled' ? STATUS_LEVEL[cmiStatus] : undefined;
  const activeLevels = [vmiLevel, cmiLevel].filter((l): l is number => typeof l === 'number');
  if (activeLevels.length === 0) return [];

  // If every active policy is at Pending (level 1), use sale-level Pending CTAs
  const nonPendingLevels = activeLevels.filter(l => l > 1);
  const driverLevel = nonPendingLevels.length > 0
    ? Math.min(...nonPendingLevels)          // least-progressed beyond Pending drives
    : 1;                                      // all Pending → sale-level summary CTAs

  // Find the driver policy's status (for shipping-format/no-CTA decisions)
  const driverStatus = (() => {
    const candidates: Array<[number | undefined, string | undefined]> = [
      [vmiLevel, vmiStatus],
      [cmiLevel, cmiStatus],
    ];
    const match = candidates.find(([lvl]) => lvl === driverLevel);
    return match?.[1];
  })();

  return ctaForLevel(driverLevel, language, isInstalment, shippingFormat, driverStatus);
}

export function SaleDetailBar({
  sale,
  hasActiveRework = false,
  hasActiveEndorsement = false,
  onOpenUploadPolicy,
  onOpenHistoryLog,
  onOpenEndorsement,
  onOpenUploadDoc,
  onAdvanceVmiStatus,
}: SaleDetailBarProps) {
  const { language } = useLanguageStore();
  const { logic, voluntaryShippingFormat } = useOpsLogic();
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');
  const cmiPolicy = sale.policies.find(p => p.kind === 'cmi');
  const currentStage = 'to_issue';
  const stageLabel = stageLabels[currentStage] || stageLabels.to_issue;
  const isInstalment = logic.paymentMethodValue === 'qr_code_installment';
  const primaryActions = getPrimaryActions(vmiPolicy, cmiPolicy, language, isInstalment, hasActiveEndorsement, hasActiveRework, voluntaryShippingFormat);

  // Derive display values from Logic Controller (single source of truth for prototype)
  const classDisplay = (logic.insuranceClass || '').replace(/^Type/, '').trim() || (vmiPolicy?.coverage.insuranceClass ?? '—');
  const garageEn = vmiPolicy?.garageType === 'Dealership' ? 'Dealership' : 'Approved Garage';
  const garageTh = vmiPolicy?.garageType === 'Dealership' ? 'ซ่อมห้าง' : 'ซ่อมอู่';

  const handleAction = (actionName: string) => {
    if (/Send Summary to Agent|ส่งสรุปให้ตัวแทน/.test(actionName)) {
      window.dispatchEvent(new Event('ops:openSendSummary'));
      return;
    }
    toast.success(actionName, {
      description: language === 'th' ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต' : 'This will connect to the real system.',
    });
  };

  const [kycOpen, setKycOpen] = useState(false);
  const [kycValue, setKycValue] = useState<string>('');
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingMethod, setBillingMethod] = useState<string>('');
  const [billingPayable, setBillingPayable] = useState<string>('');
  const [apiPurchased, setApiPurchased] = useState(false);
  const [summarySent, setSummarySent] = useState(false);

  React.useEffect(() => {
    const handler = () => setSummarySent(true);
    window.addEventListener('ops:summarySent', handler);
    return () => window.removeEventListener('ops:summarySent', handler);
  }, []);

  const handlePrimaryClick = (action: PrimaryAction) => {
    const label = action.label;
    if (action.group === 'G4') { onOpenHistoryLog?.(); return; }
    if (action.group === 'G5') { onOpenEndorsement?.(); return; }
    if (/^Upload Policy|^อัปโหลดกรมธรรม์/.test(label)) { onOpenUploadPolicy?.(); return; }
    if (/Manual KYC Approval|อนุมัติ KYC/.test(label)) { setKycOpen(true); return; }
    if (/Send Billing Report|ส่งใบแจ้งหนี้/.test(label)) { setBillingOpen(true); return; }
    // Map CTA → next VMI status when VMI is the driver
    const current = vmiPolicy?.status;
    let next: string | null = null;
    if (/Purchase Policy|ซื้อกรมธรรม์|Send Email to Insurer|ส่งอีเมลถึง บ.ประกัน/.test(label)) {
      if (current === 'pending_review') next = 'pending_issuance';
      if (/Purchase Policy|ซื้อกรมธรรม์/.test(label)) setApiPurchased(true);
    }
    if (/Fetch Policy|ดึงกรมธรรม์/.test(label)) { handleAction(label); return; }
    if (next && onAdvanceVmiStatus) {
      onAdvanceVmiStatus(next, label);
      return;
    }
    handleAction(label);
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
              {language === 'th' ? 'การชำระเงิน' : 'Payment'}
            </DropdownMenuLabel>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => setBillingOpen(true)}>
              <CreditCard className="w-3.5 h-3.5" />
              {language === 'th' ? 'ส่งใบแจ้งหนี้' : 'Send Billing Report'}
            </DropdownMenuItem>
            {isInstalment && (
              <DropdownMenuItem className="text-xs gap-2" onClick={() => setKycOpen(true)}>
                <UserCheck className="w-3.5 h-3.5" />
                {language === 'th' ? 'อนุมัติ KYC ด้วยตนเอง' : 'Manual KYC Approval'}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {language === 'th' ? 'ออกกรมธรรม์' : 'Policy Issuance'}
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => {
                if (apiPurchased) {
                  handleAction(language === 'th' ? 'ดึงกรมธรรม์' : 'Fetch Policy');
                  return;
                }
                if (vmiPolicy?.status === 'pending_review' && onAdvanceVmiStatus) {
                  onAdvanceVmiStatus('pending_issuance', language === 'th' ? 'ซื้อกรมธรรม์' : 'Purchase Policy');
                } else {
                  handleAction(language === 'th' ? 'ซื้อกรมธรรม์' : 'Purchase Policy');
                }
                setApiPurchased(true);
              }}
            >
              {apiPurchased ? <Download className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              {apiPurchased
                ? (language === 'th' ? 'ดึงกรมธรรม์' : 'Fetch Policy')
                : (language === 'th' ? 'ซื้อกรมธรรม์' : 'Purchase Policy')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => {
                if (vmiPolicy?.status === 'pending_review' && onAdvanceVmiStatus) {
                  onAdvanceVmiStatus('pending_issuance', language === 'th' ? 'อีเมล' : 'Email');
                } else {
                  handleAction('Send Email to Insurer');
                }
              }}
            >
              <Mail className="w-3.5 h-3.5" />
              {language === 'th' ? 'ส่งอีเมลถึง บ.ประกัน' : 'Send Email to Insurer'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => { if (onOpenUploadPolicy) onOpenUploadPolicy(); else handleAction('Upload Policy'); }}>
              <FileUp className="w-3.5 h-3.5" />
              {language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {language === 'th' ? 'เอกสารและสื่อสาร' : 'Docs & Comms'}
            </DropdownMenuLabel>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => { if (onOpenUploadDoc) onOpenUploadDoc(); else handleAction('Upload Document'); }}>
              <Upload className="w-3.5 h-3.5" />
              {language === 'th' ? 'อัปโหลดเอกสาร' : 'Upload Document'}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs gap-2">
                <Mail className="w-3.5 h-3.5" />
                {language === 'th' ? 'ส่งอีเมลถึงตัวแทน' : 'Email to Affiliate'}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-popover z-50">
                <DropdownMenuItem className="text-xs" onClick={() => handleAction('Affiliate: Docs Approved with Invoice')}>
                  {language === 'th' ? 'เอกสารถูกต้อง + ใบแจ้งหนี้' : 'Docs Approved with Invoice'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => handleAction('Affiliate: Vehicle Documents')}>
                  {language === 'th' ? 'เอกสารรถ' : 'Vehicle Documents'}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log'}
            </DropdownMenuLabel>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => { if (onOpenHistoryLog) onOpenHistoryLog(); else handleAction('History & Activity Log'); }}>
              <History className="w-3.5 h-3.5" />
              {language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {language === 'th' ? 'อัปเดตการขาย' : 'Update Sale'}
            </DropdownMenuLabel>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => { if (onOpenEndorsement) onOpenEndorsement(); else handleAction('Update Sale'); }}>
              <XCircle className="w-3.5 h-3.5" />
              {language === 'th' ? 'อัปเดตการขาย' : 'Update Sale'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {language === 'th' ? 'การเงิน' : 'Finance'}
            </DropdownMenuLabel>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Commission')}>
              <Percent className="w-3.5 h-3.5" />
              {language === 'th' ? 'ค่าคอมมิชชั่น' : 'Commission'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Discounts')}>
              <Tag className="w-3.5 h-3.5" />
              {language === 'th' ? 'ส่วนลด' : 'Discounts'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Revise Premium')}>
              <FilePen className="w-3.5 h-3.5" />
              {language === 'th' ? 'แก้ไขเบี้ย' : 'Revise Premium'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2" onClick={() => handleAction('Manual Invoice')}>
              <FilePlus className="w-3.5 h-3.5" />
              {language === 'th' ? 'ออกใบแจ้งหนี้เอง' : 'Manual Invoice'}
            </DropdownMenuItem>
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
