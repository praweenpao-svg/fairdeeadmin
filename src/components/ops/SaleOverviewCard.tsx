import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
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

function StatusDropdown({ label, options, defaultValue, language }: {
  label: string;
  options: { value: string; en: string; th: string }[];
  defaultValue: string;
  language: string;
}) {
  const [status, setStatus] = useState(defaultValue);

  const handleChange = (val: string) => {
    setStatus(val);
    const opt = options.find(s => s.value === val);
    toast.success(language === 'th' ? 'อัปเดตสถานะแล้ว' : 'Status updated', {
      description: `${label}: ${opt ? (language === 'th' ? opt.th : opt.en) : val}`,
    });
  };

  return (
    <div className="space-y-0.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <Select value={status} onValueChange={handleChange}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {options.map(s => (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              {language === 'th' ? s.th : s.en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
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
      <CardHeader className="pb-2 pt-3 px-5">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'สรุปงาน' : 'Sale Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-right">{value || '—'}</span>
    </div>
  );
}

export function AgentDetailsCard({ sale }: SaleOverviewCardProps) {
  const { language } = useLanguageStore();

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-5">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'ข้อมูลตัวแทน' : 'Agent Details'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="space-y-2.5">
          <SummaryRow label={language === 'th' ? 'ชื่อตัวแทน' : 'Agent Name'} value={language === 'th' ? sale.agent.nameTh : sale.agent.name} />
          <SummaryRow label={language === 'th' ? 'ระดับ' : 'Level'} value={String(sale.agent.level)} />
          <SummaryRow label={language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'} value={sale.agent.phone} />
          <SummaryRow label={language === 'th' ? 'รหัสตัวแทน' : 'Agent Code'} value={sale.agent.code} />
        </div>
      </CardContent>
    </Card>
  );
}

export function PolicyStatusCard({ sale }: SaleOverviewCardProps) {
  const { language } = useLanguageStore();

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-5">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'สถานะกรมธรรม์' : 'Policy Status'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="space-y-3">

          {/* VMI row: status + owner */}
          {sale.policies.map((policy) => (
            <div key={policy.kind} className="grid grid-cols-3 gap-x-3 items-end">
              <div className="col-span-2">
                <StatusDropdown
                  label={`${policy.kind.toUpperCase()} ${language === 'th' ? 'สถานะ' : 'Status'}`}
                  options={policyStatuses}
                  defaultValue="pending_review"
                  language={language}
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {policy.kind.toUpperCase()} {language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}
                </span>
                <p className="text-xs font-medium h-7 flex items-center">Pao</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentStatusCard({ sale }: SaleOverviewCardProps) {
  const { language } = useLanguageStore();

  const pmtStatuses = [
    { value: 'unpaid', en: 'Unpaid', th: 'ยังไม่ชำระ' },
    { value: 'pending', en: 'Pending', th: 'รอชำระ' },
    { value: 'partial', en: 'Partial', th: 'ชำระบางส่วน' },
    { value: 'payment_verified', en: 'Payment Verified', th: 'ยืนยันการชำระเงินแล้ว' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-5">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'สถานะการชำระเงิน' : 'Payment Status'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <StatusDropdown
          label={language === 'th' ? 'สถานะ' : 'Status'}
          options={pmtStatuses}
          defaultValue="payment_verified"
          language={language}
        />
      </CardContent>
    </Card>
  );
}
