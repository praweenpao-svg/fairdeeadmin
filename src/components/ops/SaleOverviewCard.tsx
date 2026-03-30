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

const policyStatuses = [
  { value: 'pending', en: 'Pending', th: 'รอดำเนินการ' },
  { value: 'pending_review', en: 'Pending Review', th: 'รอตรวจสอบ' },
  { value: 'pending_issuance', en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  { value: 'policy_uploaded', en: 'Policy Uploaded', th: 'อัปโหลดกรมธรรม์แล้ว' },
  { value: 'policy_shipped', en: 'Policy Shipped', th: 'จัดส่งแล้ว' },
  { value: 'policy_delivered', en: 'Policy Delivered', th: 'จัดส่งถึงแล้ว' },
  { value: 'policy_cancelled', en: 'Policy Cancelled', th: 'ยกเลิกกรมธรรม์' },
  { value: 'rework_required', en: 'Rework Required', th: 'ต้องแก้ไข' },
];

function PolicyStatusDropdown({ kind, language }: { kind: string; language: string }) {
  const [status, setStatus] = useState('pending');

  const handleChange = (val: string) => {
    setStatus(val);
    const label = policyStatuses.find(s => s.value === val);
    toast.success(language === 'th' ? 'อัปเดตสถานะแล้ว' : 'Status updated', {
      description: `${kind.toUpperCase()}: ${label ? (language === 'th' ? label.th : label.en) : val}`,
    });
  };

  return (
    <div className="space-y-0.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {kind.toUpperCase()} {language === 'th' ? 'สถานะ' : 'Status'}
      </span>
      <Select value={status} onValueChange={handleChange}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {policyStatuses.map(s => (
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
  const [saleType, setSaleType] = useState(sale.typeOfSale);

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
          <SummaryRow label={language === 'th' ? 'สถานะการชำระเงิน' : 'Payment Status'} value={paymentStatusLabel} />
          <SummaryRow label={language === 'th' ? 'ทะเบียนรถ' : 'Vehicle Number'} value={sale.vehicle.licensePlate} />
          <SummaryRow label={language === 'th' ? 'บริษัทประกัน' : 'Insurer'} value={vmiPolicy?.coverage.insurer || '—'} />
          <SummaryRow label={language === 'th' ? 'เบี้ยรวม' : 'Total Premium'} value={`${totalPremium.toLocaleString()} ${language === 'th' ? 'บาท' : 'THB'}`} />
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">{language === 'th' ? 'ประเภทการขาย' : 'Sale Type'}</span>
            <div className="max-w-[140px]">
              <EditableField
                label=""
                value={saleType}
                type="select"
                options={saleTypeOptions}
                onSave={(v) => { setSaleType(v); handleFieldSave('Sale Type', v); }}
              />
            </div>
          </div>
          <SummaryRow label={language === 'th' ? 'วิธีชำระเงิน' : 'Payment Method'} value={sale.paymentMethod} />
          <SummaryRow label={language === 'th' ? 'โอนใบเสนอราคาให้' : 'Transferred Quote For'} value="—" />
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
          <SummaryRow label={language === 'th' ? 'ระยะเวลาสมาชิก' : 'Membership'} value={sale.agent.membershipDuration} />
          <SummaryRow label={language === 'th' ? 'ทุนแนะนำ' : 'Sum Insured'} value={`${sale.agent.sumInsured.toLocaleString()} ${language === 'th' ? 'บาท' : 'THB'}`} />
          <SummaryRow label={language === 'th' ? 'ค่าคอมมิชชั่น' : 'Commission'} value={sale.agent.commissionDetail} />
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
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {sale.policies.map((policy) => (
            <ReadOnlyField
              key={`owner-${policy.kind}`}
              label={`${policy.kind.toUpperCase()} ${language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}`}
              value={policy.kind === 'vmi' ? 'Pao' : 'Lisa'}
            />
          ))}
          {sale.policies.map((policy) => (
            <PolicyStatusDropdown
              key={`status-${policy.kind}`}
              kind={policy.kind}
              language={language}
            />
          ))}
          <ReadOnlyField
            label={language === 'th' ? 'สถานะการชำระเงิน' : 'Payment Status'}
            value={sale.paymentStatus === 'paid' ? (language === 'th' ? 'ชำระแล้ว' : 'Paid') :
                   sale.paymentStatus === 'pending' ? (language === 'th' ? 'รอชำระ' : 'Pending') :
                   sale.paymentStatus === 'partial' ? (language === 'th' ? 'ชำระบางส่วน' : 'Partial') :
                   (language === 'th' ? 'ยังไม่ชำระ' : 'Unpaid')}
          />
          <ReadOnlyField
            label={language === 'th' ? 'วิธีชำระเงิน' : 'Payment Method'}
            value={sale.paymentMethod}
          />
        </div>
      </CardContent>
    </Card>
  );
}
