import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface SaleSummaryStripProps {
  sale: SaleDetail;
}

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

function InlineStatusDropdown({ label, defaultValue, language }: {
  label: string;
  defaultValue: string;
  language: string;
}) {
  const [status, setStatus] = useState(defaultValue);

  const handleChange = (val: string) => {
    setStatus(val);
    const opt = policyStatuses.find(s => s.value === val);
    toast.success(language === 'th' ? 'อัปเดตสถานะแล้ว' : 'Status updated', {
      description: `${label}: ${opt ? (language === 'th' ? opt.th : opt.en) : val}`,
    });
  };

  return (
    <div className="space-y-0.5 min-w-0">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <Select value={status} onValueChange={handleChange}>
        <SelectTrigger className="h-6 text-[11px] w-[140px]">
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5 min-w-0">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">{label}</span>
      <p className="text-[11px] font-medium truncate">{value || '—'}</p>
    </div>
  );
}

export function SaleSummaryStrip({ sale }: SaleSummaryStripProps) {
  const { language } = useLanguageStore();
  const totalPremium = sale.policies.reduce((s, p) => s + p.premiumAfterTax, 0);
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');

  return (
    <div className="bg-card border border-border rounded-lg px-4 py-2.5 flex items-start gap-4 flex-wrap">
      {/* Agent Info */}
      <InfoItem
        label={language === 'th' ? 'ตัวแทน' : 'Agent'}
        value={language === 'th' ? sale.agent.nameTh : sale.agent.name}
      />
      <InfoItem
        label={language === 'th' ? 'ระดับ' : 'Level'}
        value={String(sale.agent.level)}
      />
      <InfoItem
        label={language === 'th' ? 'รหัสตัวแทน' : 'Agent Code'}
        value={sale.agent.code}
      />
      <InfoItem
        label={language === 'th' ? 'เบอร์โทร' : 'Phone'}
        value={sale.agent.phone}
      />

      <Separator orientation="vertical" className="h-8 self-center" />

      {/* Policy Status */}
      <InlineStatusDropdown
        label={`VMI ${language === 'th' ? 'สถานะ' : 'Status'}`}
        defaultValue="pending_payment"
        language={language}
      />
      <InfoItem
        label={`VMI ${language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}`}
        value="Pao"
      />
      <InlineStatusDropdown
        label={`CMI ${language === 'th' ? 'สถานะ' : 'Status'}`}
        defaultValue="pending_payment"
        language={language}
      />
      <InfoItem
        label={`CMI ${language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}`}
        value="Pao"
      />

      <Separator orientation="vertical" className="h-8 self-center" />

      {/* Sale Summary */}
      <InfoItem
        label={language === 'th' ? 'เลขงาน' : 'Sale ID'}
        value={sale.qqId}
      />
      <InfoItem
        label={language === 'th' ? 'ทะเบียนรถ' : 'Vehicle'}
        value={sale.vehicle.licensePlate}
      />
      <InfoItem
        label={language === 'th' ? 'เบี้ยรวม' : 'Premium'}
        value={`${totalPremium.toLocaleString()} ${language === 'th' ? '฿' : 'THB'}`}
      />
      <InfoItem
        label={language === 'th' ? 'ประเภทการขาย' : 'Sale Type'}
        value={sale.typeOfSale}
      />
    </div>
  );
}
