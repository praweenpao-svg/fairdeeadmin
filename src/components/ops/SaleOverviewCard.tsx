import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, Pencil, X, FileText, Download, History, DollarSign, Shield, Info } from 'lucide-react';
import insurerGenericLogo from '@/assets/insurer-generic.png';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useHistoryStore } from '@/stores/historyStore';
import { useOpsLogic } from './OpsLogicContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SaleOverviewCardProps {
  sale: SaleDetail;
}

const saleTypeOptions = [
  'CBC to Fairdee',
  'CBC to Insurer',
  'Credit',
  'Credit Exceeded',
];

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <p className="text-xs font-medium truncate">{value || '—'}</p>
    </div>
  );
}

function EditableField({ label, value, onSave, type = 'text', options }: {
  label: string;
  value: string;
  onSave: (val: string) => void;
  type?: 'text' | 'date' | 'select';
  options?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-0.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1">
          {type === 'select' && options ? (
            <Select value={draft} onValueChange={setDraft}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {options.map(o => (
                  <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={type === 'date' ? 'date' : 'text'}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="h-7 text-xs flex-1"
              autoFocus
            />
          )}
          <button onClick={handleSave} className="p-0.5 hover:bg-muted rounded shrink-0">
            <Check className="w-3.5 h-3.5 text-green-600" />
          </button>
          <button onClick={handleCancel} className="p-0.5 hover:bg-muted rounded shrink-0">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 group cursor-pointer" onClick={() => setEditing(true)}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <p className="text-xs font-medium flex items-center gap-1">
        {value || '—'}
        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
      </p>
    </div>
  );
}

// Exact match with motor policy page (PolicyStatusCell.tsx)
const policyStatuses = [
  { value: 'pending_payment', en: 'Pending', th: 'รอดำเนินการ' },
  { value: 'pending_review', en: 'Pending Review', th: 'รอตรวจเอกสาร' },
  { value: 'pending_issuance', en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  { value: 'policy_issued', en: 'Policy Uploaded', th: 'กรมธรรม์ออกแล้ว' },
  { value: 'policy_shipped', en: 'Policy Shipped', th: 'กรมธรรม์ถูกจัดส่ง' },
  { value: 'policy_delivered', en: 'Policy Delivered', th: 'กรมธรรม์จัดส่งสำเร็จ' },
  { value: 'policy_cancelled', en: 'Policy Cancelled', th: 'กรมธรรม์ยกเลิก' },
  { value: 'rework_required', en: 'Rework Required', th: 'งานติดปัญหา' },
];

const paymentStatuses = [
  { value: 'payment_verified', en: 'Payment Verified', th: 'ยืนยันการชำระเงินแล้ว' },
  { value: 'insurer_notified', en: 'Insurer Notified', th: 'แจ้งบริษัทประกันแล้ว' },
  { value: 'credit_approved', en: 'Credit Approved', th: 'อนุมัติเครดิตแล้ว' },
];

function StatusDropdown({ label, options, defaultValue, language, onChange, allowedValues, lockedReason }: {
  label: string;
  options: { value: string; en: string; th: string }[];
  defaultValue: string;
  language: string;
  onChange?: (val: string) => void;
  /** When provided, only these values are selectable; others render disabled. */
  allowedValues?: string[];
  /** When set, the dropdown is fully disabled and a tooltip-style hint is shown. */
  lockedReason?: string;
}) {
  const [status, setStatus] = useState(defaultValue);

  // Sync with external default if it changes
  React.useEffect(() => {
    setStatus(defaultValue);
  }, [defaultValue]);

  const handleChange = (val: string) => {
    if (allowedValues && !allowedValues.includes(val) && val !== status) {
      toast.error(language === 'th' ? 'ไม่สามารถเปลี่ยนสถานะนี้ได้' : 'Status transition not allowed', {
        description: language === 'th'
          ? 'สถานะต้องดำเนินตามลำดับ หรือเปลี่ยนผ่านระบบ/Rework'
          : 'Status must follow the lifecycle or be driven by system / rework actions.',
      });
      return;
    }
    setStatus(val);
    onChange?.(val);
    const opt = options.find(s => s.value === val);
    toast.success(language === 'th' ? 'อัปเดตสถานะแล้ว' : 'Status updated', {
      description: `${label}: ${opt ? (language === 'th' ? opt.th : opt.en) : val}`,
    });
  };

  return (
    <div className="space-y-0.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <Select value={status} onValueChange={handleChange} disabled={!!lockedReason}>
        <SelectTrigger className="h-7 text-xs" title={lockedReason}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {options.map(s => {
            const disabled = allowedValues ? !allowedValues.includes(s.value) && s.value !== status : false;
            return (
              <SelectItem
                key={s.value}
                value={s.value}
                disabled={disabled}
                className="text-xs"
              >
                {language === 'th' ? s.th : s.en}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

// Strict policy status lifecycle order. Manual jumps are blocked; only the
// next sequential step is permitted from the dropdown. rework_required and
// policy_cancelled are always selectable as escape hatches.
const POLICY_LIFECYCLE_ORDER = [
  'pending_payment',
  'pending_review',
  'pending_issuance',
  'policy_issued',
  'policy_shipped',
  'policy_delivered',
] as const;

const TERMINAL_POLICY_STATUSES = new Set(['policy_delivered', 'policy_cancelled']);

function getAllowedPolicyTransitions(current: string): string[] {
  if (TERMINAL_POLICY_STATUSES.has(current)) return [current];
  const idx = POLICY_LIFECYCLE_ORDER.indexOf(current as typeof POLICY_LIFECYCLE_ORDER[number]);
  const allowed: string[] = [current];
  if (idx >= 0 && idx < POLICY_LIFECYCLE_ORDER.length - 1) {
    allowed.push(POLICY_LIFECYCLE_ORDER[idx + 1]);
  }
  // Always allow rework + cancel as escape hatches from any non-terminal state.
  allowed.push('rework_required', 'policy_cancelled');
  return allowed;
}

export function SaleOverviewCard({ sale }: SaleOverviewCardProps) {
  const { language } = useLanguageStore();

  const handleFieldSave = (field: string, value: string) => {
    toast.success(language === 'th' ? 'บันทึกแล้ว' : 'Saved', {
      description: `${field}: ${value}`,
    });
  };

  const totalPremium = sale.policies.reduce((s, p) => s + p.premiumAfterTax, 0);
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');

  const paymentStatusLabel = sale.paymentStatus === 'paid' ? (language === 'th' ? 'ยืนยันการชำระเงินแล้ว' : 'Payment Verified') :
    sale.paymentStatus === 'pending' ? (language === 'th' ? 'รอชำระ' : 'Pending') :
    sale.paymentStatus === 'partial' ? (language === 'th' ? 'ชำระบางส่วน' : 'Partial') :
    (language === 'th' ? 'ยังไม่ชำระ' : 'Unpaid');

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'สรุปงาน' : 'Sale Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2.5">
          <SummaryRow label={language === 'th' ? 'เลขงาน' : 'Sale ID'} value={sale.qqId} />
          <SummaryRow label={language === 'th' ? 'ทะเบียนรถ' : 'Vehicle Number'} value={sale.vehicle.licensePlate} />
          <SummaryRow label={language === 'th' ? 'บริษัทประกัน' : 'Insurer'} value={vmiPolicy?.coverage.insurer || '—'} />
          <SummaryRow label={language === 'th' ? 'เบี้ยรวม' : 'Total Premium'} value={`${totalPremium.toLocaleString()} ${language === 'th' ? 'บาท' : 'THB'}`} />
          <SummaryRow label={language === 'th' ? 'ประเภทการขาย' : 'Sale Type'} value={sale.typeOfSale} />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-3 py-1 border-b border-border/30 last:border-0">
      <span className={`text-xs ${emphasize ? 'font-semibold text-foreground' : 'text-muted-foreground'} leading-tight`}>{label}</span>
      <span className={`text-xs ${emphasize ? 'font-semibold' : 'font-medium'} text-right whitespace-nowrap tabular-nums min-w-[88px]`}>{value || '—'}</span>
    </div>
  );
}

export function AgentDetailsCard({ sale }: SaleOverviewCardProps) {
  const { language } = useLanguageStore();

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Info className="w-4 h-4" />
          {language === 'th' ? 'ข้อมูลใบเสนอราคา' : 'Quotation Info'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2.5">
          <SummaryRow label={language === 'th' ? 'ชื่อตัวแทน' : 'Agent Name'} value="Agent Name" />
          <SummaryRow label={language === 'th' ? 'รหัสตัวแทน' : 'Agent Code'} value="FX-XXXXX" />
          <SummaryRow label={language === 'th' ? 'เบอร์โทรศัพท์' : 'Agent Phone'} value="0XX-XXX-XXXX" />
          <SummaryRow label={language === 'th' ? 'ระดับ' : 'Level'} value={String(sale.agent.level)} />
          <SummaryRow label={language === 'th' ? 'ประเภทงาน' : 'Type of Sale'} value={(() => {
            const v = sale.saleType || sale.typeOfSale;
            if (language !== 'th') return v;
            const map: Record<string, string> = { New: 'งานใหม่', Renewable: 'ต่ออายุ', COA: 'COA' };
            return map[v] || v;
          })()} />
          
        </div>
      </CardContent>
    </Card>
  );
}

export function InsurerDetailsCard({ sale }: SaleOverviewCardProps) {
  const { language } = useLanguageStore();
  const { logic } = useOpsLogic();
  const vmi = sale.policies.find(p => p.kind === 'vmi');
  if (!vmi) return null;
  const garageType = logic.garageType || vmi.garageType;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {language === 'th' ? 'รายละเอียดบริษัทประกัน' : 'Insurer Details'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2.5">
          <SummaryRow label={language === 'th' ? 'ชื่อบริษัทประกัน' : 'Insurer Name'} value={language === 'th' ? 'ชื่อบริษัทประกัน' : 'Insurer Name'} />
          <SummaryRow label={language === 'th' ? 'ชื่อแพ็กเกจ' : 'Package Name'} value={language === 'th' ? 'ชื่อแพ็กเกจ' : 'Package Name'} />
          <SummaryRow label={language === 'th' ? 'ชั้น' : 'Insurance Class'} value={(() => {
            const raw = (logic.insuranceClass || '').replace(/^Type\s*/, '').trim();
            return raw || '—';
          })()} />
          <SummaryRow label={language === 'th' ? 'ทุนประกัน' : 'Sum Insured'} value={vmi.sumInsured ? `${vmi.sumInsured.toLocaleString()} Baht` : '—'} />
          <SummaryRow label={language === 'th' ? 'ประเภท' : 'Garage Type'} value={(() => {
            if (!garageType) return '—';
            if (language !== 'th') return garageType;
            if (garageType === 'Dealership') return 'ซ่อมห้าง';
            if (garageType === 'Garage') return 'ซ่อมอู่';
            return garageType;
          })()} />
        </div>
      </CardContent>
    </Card>
  );
}

export function PriceDetailsCard({ sale }: SaleOverviewCardProps) {
  const { language } = useLanguageStore();
  const vmi = sale.policies.find(p => p.kind === 'vmi');
  const cmi = sale.policies.find(p => p.kind === 'cmi');

  const vmiTotal = vmi?.premiumAfterTax || 0;
  const vmiTax = vmi ? Math.round(vmiTotal * 0.0697 * 100) / 100 : 0;
  const vmiNet = vmi ? Math.round((vmiTotal - vmiTax) * 100) / 100 : 0;

  const cmiTotal = cmi?.premiumAfterTax || 0;
  const cmiTax = cmi ? Math.round(cmiTotal * 0.0697 * 100) / 100 : 0;
  const cmiNet = cmi ? Math.round((cmiTotal - cmiTax) * 100) / 100 : 0;

  const grandTotal = vmiTotal + cmiTotal;
  const vmiCommission = vmi?.affiliateCommission || 0;
  const cmiCommission = cmi?.affiliateCommission || 0;
  const totalCommission = vmiCommission + cmiCommission;
  const withholdingTax = Math.round(totalCommission * 0.03 * 100) / 100;
  const commissionAfterTax = Math.round((totalCommission - withholdingTax) * 100) / 100;
  const vmiCommissionRate = vmi && vmiNet ? `${((vmiCommission / vmiNet) * 100).toFixed(2)}%` : '—';

  const fmt = (n: number) => `${Math.round(n).toLocaleString()} Baht`;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          {language === 'th' ? 'รายละเอียดราคา' : 'Price Details'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2.5">
          {vmi && <>
            <SummaryRow label={language === 'th' ? 'เบี้ยสุทธิ (VMI)' : 'Net Premium (VMI)'} value={fmt(vmiNet)} />
            <SummaryRow label={language === 'th' ? 'ภาษีและอากร (VMI)' : 'Tax and Duty (VMI)'} value={fmt(vmiTax)} />
            <SummaryRow label={language === 'th' ? 'เบี้ยรวม (VMI)' : 'Total Premium (VMI)'} value={fmt(vmiTotal)} emphasize />
          </>}
          {cmi && <>
            <div className="h-2" />
            <SummaryRow label={language === 'th' ? 'เบี้ยสุทธิ (CMI)' : 'Net Premium (CMI)'} value={fmt(cmiNet)} />
            <SummaryRow label={language === 'th' ? 'ภาษีและอากร (CMI)' : 'Tax and Duty (CMI)'} value={fmt(cmiTax)} />
            <SummaryRow label={language === 'th' ? 'เบี้ยรวม (CMI)' : 'Total Premium (CMI)'} value={fmt(cmiTotal)} emphasize />
          </>}
          <div className="h-2" />
          <SummaryRow label={language === 'th' ? 'เบี้ยรวมทั้งหมด (VMI + CMI)' : 'Total Premium (VMI + CMI)'} value={fmt(grandTotal)} emphasize />
          <SummaryRow label={language === 'th' ? 'ส่วนลดจากตัวแทน' : 'Discount from agent'} value="—" />
          <SummaryRow label={language === 'th' ? 'ยอดโอนให้ FairDee' : 'Transfer amount to FairDee'} value={fmt(grandTotal)} emphasize />
          <div className="h-2" />
          <SummaryRow label={language === 'th' ? "ค่าคอมประกันสมัครใจ" : "Agent's voluntary insurance Commission"} value={fmt(vmiCommission)} />
          <SummaryRow label={language === 'th' ? 'อัตราค่าคอม VMI' : 'VMI Commission Rate'} value={vmiCommissionRate} />
          <SummaryRow label={language === 'th' ? "ค่าคอมประกันภาคบังคับ" : "Agent's compulsory insurance Commission"} value={fmt(cmiCommission)} />
          <SummaryRow label={language === 'th' ? 'หัก 0% ค่าคอมจาก Admin' : 'Deduct 0% Commission from Admin support'} value={fmt(0)} />
          <SummaryRow label={language === 'th' ? 'ค่าคอมรวม' : 'Total Commission'} value={fmt(totalCommission)} emphasize />
          <SummaryRow label={language === 'th' ? 'ภาษีหัก ณ ที่จ่าย' : 'Withholding Tax'} value={fmt(withholdingTax)} />
          <SummaryRow label={language === 'th' ? 'ค่าคอมหลังหักภาษี' : 'Commission after withholding tax'} value={fmt(commissionAfterTax)} emphasize />
          <div className="h-2" />
          <SummaryRow label={language === 'th' ? 'ส่วนลดจากตัวแทน' : 'Discount from agent'} value="—" />
          <SummaryRow label={language === 'th' ? 'ยอดที่คาดว่าจะได้รับจาก FairDee' : 'Expected transfer from FairDee'} value={fmt(commissionAfterTax)} emphasize />
        </div>
      </CardContent>
    </Card>
  );
}

export function PolicyStatusCard({ sale, onPolicyStatusChange }: SaleOverviewCardProps & { onPolicyStatusChange?: (kind: 'vmi' | 'cmi', status: string) => void }) {
  const { language } = useLanguageStore();

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'สถานะกรมธรรม์' : 'Policy Status'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">

          {/* VMI and CMI rows: status + owner */}
          {[...sale.policies]
            .sort((a, b) => (a.kind === 'vmi' ? -1 : b.kind === 'vmi' ? 1 : 0))
            .map((policy) => (
            <div key={policy.kind} className="grid grid-cols-3 gap-x-3 items-end">
              <div className="col-span-2">
                <StatusDropdown
                  label={`${policy.kind.toUpperCase()} ${language === 'th' ? 'สถานะ' : 'Status'}`}
                  options={policyStatuses}
                  defaultValue={policy.status}
                  language={language}
                  allowedValues={getAllowedPolicyTransitions(policy.status)}
                  onChange={(val) => {
                    onPolicyStatusChange?.(policy.kind, val);
                    const opt = policyStatuses.find(s => s.value === val);
                    useHistoryStore.getState().add({
                      type: 'status_change',
                      policyKind: policy.kind,
                      description: `${policy.kind.toUpperCase()} → ${opt ? (language === 'th' ? opt.th : opt.en) : val}`,
                    });
                  }}
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {policy.kind.toUpperCase()} {language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}
                </span>
                <p className="text-xs font-medium h-7 flex items-center">
                  {['policy_issued', 'policy_delivered', 'policy_cancelled'].includes(policy.status)
                    ? <span className="text-muted-foreground italic">{language === 'th' ? 'ไม่มี' : '—'}</span>
                    : 'Pao'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Payment statuses
const pmtStatuses = [
  { value: 'payment_verified', en: 'Payment Verified', th: 'ยืนยันการชำระเงินแล้ว' },
  { value: 'insurer_notified', en: 'Insurer Notified', th: 'แจ้งบริษัทประกันแล้ว' },
  { value: 'credit_approved', en: 'Credit Approved', th: 'อนุมัติเครดิตแล้ว' },
];

// KYC statuses — only relevant for instalment sales (used by Manual KYC Approval dialog)
export const kycStatuses = [
  { value: 'pending_verification', en: 'EKYC Pending Verification', th: 'กำลังตัวสอบการยืนยันตัวตน' },
  { value: 'verified', en: 'EKYC Verified', th: 'ยืนยันตัวตนแล้ว' },
  { value: 'verification_rejected', en: 'EKYC Rejected', th: 'การยืนยันตัวตนถูกปฏิเสธ' },
  { value: 'not_verified', en: 'EKYC Pending', th: 'ยังไม่ยืนยันตัวตน' },
  { value: 'instalment_signed', en: 'Loan Contract Signed', th: 'ผู้เอาประกันลงนามสัญญาเงินผ่อนเรียบร้อยแล้ว' },
];

export function ActionStatusCard({ sale, onPolicyStatusChange }: SaleOverviewCardProps & { onPolicyStatusChange?: (kind: 'vmi' | 'cmi', status: string) => void }) {
  const { language } = useLanguageStore();

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'สถานะการดำเนินการ' : 'Action Status'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Policy statuses (VMI / CMI) with owner */}
        {[...sale.policies]
          .sort((a, b) => (a.kind === 'vmi' ? -1 : b.kind === 'vmi' ? 1 : 0))
          .map((policy) => (
            <div key={policy.kind} className="grid grid-cols-3 gap-x-3 items-end">
              <div className="col-span-2">
                <StatusDropdown
                  label={`${policy.kind.toUpperCase()} ${language === 'th' ? 'สถานะ' : 'Status'}`}
                  options={policyStatuses}
                  defaultValue={policy.status}
                  language={language}
                  allowedValues={getAllowedPolicyTransitions(policy.status)}
                  onChange={(val) => {
                    onPolicyStatusChange?.(policy.kind, val);
                    const opt = policyStatuses.find(s => s.value === val);
                    useHistoryStore.getState().add({
                      type: 'status_change',
                      policyKind: policy.kind,
                      description: `${policy.kind.toUpperCase()} → ${opt ? (language === 'th' ? opt.th : opt.en) : val}`,
                    });
                  }}
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {policy.kind.toUpperCase()} {language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}
                </span>
                <p className="text-xs font-medium h-7 flex items-center">
                  {['policy_issued', 'policy_delivered', 'policy_cancelled'].includes(policy.status)
                    ? <span className="text-muted-foreground italic">{language === 'th' ? 'ไม่มี' : '—'}</span>
                    : 'Pao'}
                </p>
              </div>
            </div>
          ))}

        <StatusDropdown
          label={language === 'th' ? 'สถานะการชำระเงิน' : 'Payment Status'}
          options={pmtStatuses}
          defaultValue="payment_verified"
          language={language}
        />

        <StatusDropdown
          label={language === 'th' ? 'สถานะ KYC' : 'KYC Status'}
          options={kycStatuses}
          defaultValue="not_verified"
          language={language}
        />
      </CardContent>
    </Card>
  );
}

// Deprecated — kept as thin wrappers for backward compatibility
export function PaymentStatusCard({ sale }: SaleOverviewCardProps) {
  return <ActionStatusCard sale={sale} />;
}
export function KycCard(_: SaleOverviewCardProps) {
  return null;
}

// Downloads Section
const downloadItems = [
  { en: 'Cover Note', th: 'ใบคุ้มครอง' },
  { en: 'Invoice', th: 'ใบแจ้งหนี้' },
  { en: 'Corporate', th: 'องค์กร' },
  { en: 'Receipt', th: 'ใบเสร็จ' },
];

export function DownloadsCard() {
  const { language } = useLanguageStore();

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Download className="w-4 h-4" />
          {language === 'th' ? 'ดาวน์โหลด' : 'Downloads'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {downloadItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toast.success(language === 'th' ? `กำลังดาวน์โหลด ${item.th}` : `Downloading ${item.en}`)}
              className="flex items-center justify-center px-3 py-2.5 rounded-md border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-center"
            >
              <span className="text-xs font-medium truncate">{language === 'th' ? item.th : item.en}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// History Section
const historyItems = [
  { en: 'Created By', th: 'สร้างโดย' },
  { en: 'Lead', th: 'ลีด' },
  { en: 'Quotation', th: 'ใบเสนอราคา' },
  { en: 'Sale', th: 'การขาย' },
];

const mockCreationDetails = [
  { type: 'quotation', id: 'UO6872', recordedBy: 'Jennifer Haines, vijay+Jennifer42@qoala.id', date: '23/01/2569 13:46' },
  { type: 'sale', id: '', recordedBy: 'Unknown User', date: '23/01/2569 13:50' },
];

const mockHistoricalChanges = [
  { changedBy: 'System', changedOn: '23/01/2569 13:50', key: 'Policy Start Date', oldValue: '2026-01-23', newValue: '2025-01-25', reason: 'vouch.mixins.save' },
  { changedBy: 'vijay+jennifer42@qoala.id', changedOn: '23/01/2569 13:49', key: 'Policy Start Date', oldValue: 'None', newValue: '2026-01-23', reason: 'PATCH /utils/fairdee-quotation/10167' },
  { changedBy: 'vijay+jennifer42@qoala.id', changedOn: '23/01/2569 13:46', key: 'Is Lead Generated', oldValue: 'False', newValue: 'True', reason: 'POST /utils/fairdee-quotation' },
  { changedBy: 'vijay+jennifer42@qoala.id', changedOn: '23/01/2569 13:46', key: 'Valid Till Expiry', oldValue: 'None', newValue: '2026-02-22 16:59:59+00.00', reason: 'POST /utils/fairdee-quotation-query' },
];

function CreationByDetailsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { language } = useLanguageStore();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" />
            Created By Details
          </DialogTitle>
          <p className="text-xs text-muted-foreground">View timeline of who created or modified components</p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {mockCreationDetails.map((item, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {item.type === 'quotation' ? <FileText className="w-4 h-4 text-muted-foreground" /> : <span className="text-xs font-bold text-muted-foreground">$</span>}
                </div>
                <div>
                  <p className="text-xs font-semibold">{item.type === 'quotation' ? `Quotation (${item.id})` : 'Sale'}</p>
                  <p className="text-[10px] text-muted-foreground">{item.type === 'quotation' ? `Recorded by ${item.recordedBy}` : `Created by ${item.recordedBy}`}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">🕐 {item.date}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 px-3 py-2 bg-primary/5 rounded-md border border-primary/20">
          <span className="text-xs text-primary font-medium">Total {mockCreationDetails.length} activities</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoricalDataDialog({ open, onOpenChange, title }: { open: boolean; onOpenChange: (v: boolean) => void; title: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Changed By</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Changed On</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Key Changed</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Old Value</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">New Value</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Change Reason</th>
              </tr>
            </thead>
            <tbody>
              {mockHistoricalChanges.map((row, idx) => (
                <tr key={idx} className="border-b border-border/50">
                  <td className="py-3 px-2 align-top text-muted-foreground">{row.changedBy}</td>
                  <td className="py-3 px-2 align-top text-muted-foreground whitespace-nowrap">{row.changedOn}</td>
                  <td className="py-3 px-2">{row.key}</td>
                  <td className="py-3 px-2">
                    {row.oldValue === 'None' ? <span className="text-muted-foreground">None</span> :
                      <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-[10px]">{row.oldValue}</span>}
                  </td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{row.newValue}</span>
                  </td>
                  <td className="py-3 px-2 align-top text-muted-foreground text-[10px]">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HistoryCard() {
  const { language } = useLanguageStore();
  const [creationOpen, setCreationOpen] = useState(false);
  const [activeHistoryDialog, setActiveHistoryDialog] = useState<string | null>(null);

  return (
    <>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="w-4 h-4" />
            {language === 'th' ? 'ประวัติ' : 'History'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {historyItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => idx === 0 ? setCreationOpen(true) : setActiveHistoryDialog(item.en)}
                className="flex items-center justify-center px-3 py-2.5 rounded-md border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-center"
              >
                <span className="text-xs font-medium truncate">{language === 'th' ? item.th : item.en}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <CreationByDetailsDialog open={creationOpen} onOpenChange={setCreationOpen} />
      <HistoricalDataDialog
        open={activeHistoryDialog !== null}
        onOpenChange={(v) => !v && setActiveHistoryDialog(null)}
        title={activeHistoryDialog ? `${activeHistoryDialog} Historical Data` : ''}
      />
    </>
  );
}
