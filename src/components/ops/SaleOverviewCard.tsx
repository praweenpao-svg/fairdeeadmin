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
  const [soldOn, setSoldOn] = useState(sale.createdAt);
  const [insurerQid, setInsurerQid] = useState('');

  const handleFieldSave = (field: string, value: string) => {
    toast.success(language === 'th' ? 'บันทึกแล้ว' : 'Saved', {
      description: `${field}: ${value}`,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-5">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'ข้อมูลงาน' : 'Sale Overview'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {/* Row 1: Editable fields + key identifiers */}
        <div className="grid grid-cols-4 gap-x-6 gap-y-3 mb-3 pb-3 border-b border-border/50">
          <ReadOnlyField
            label={language === 'th' ? 'เลขใบเสนอราคา' : 'Quotation ID'}
            value={sale.qqId}
          />
          <EditableField
            label={language === 'th' ? 'ประเภทงาน' : 'Sale Type'}
            value={saleType}
            type="select"
            options={saleTypeOptions}
            onSave={(v) => { setSaleType(v); handleFieldSave('Sale Type', v); }}
          />
          <EditableField
            label={language === 'th' ? 'วันที่ขาย' : 'Sold On'}
            value={soldOn}
            type="text"
            onSave={(v) => { setSoldOn(v); handleFieldSave('Sold On', v); }}
          />
          <EditableField
            label={language === 'th' ? 'เลข QID บ.ประกัน' : 'Insurer QID'}
            value={insurerQid}
            type="text"
            onSave={(v) => { setInsurerQid(v); handleFieldSave('Insurer QID', v); }}
          />
        </div>

        {/* Row 2: Attribution + per-policy owners + statuses */}
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <ReadOnlyField label={language === 'th' ? 'สร้างโดย' : 'Created by'} value="—" />
          <ReadOnlyField label={language === 'th' ? 'สร้างเมื่อ' : 'Created at'} value={sale.createdAt} />
          <ReadOnlyField label="KYC Status" value="—" />
          {sale.policies.map((policy) => (
            <ReadOnlyField
              key={policy.kind}
              label={`${policy.kind.toUpperCase()} ${language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}`}
              value={policy.kind === 'vmi' ? 'Pao' : 'Lisa'}
            />
          ))}
        </div>

        {/* Row 3: Per-policy status dropdowns */}
        {sale.policies.length > 0 && (
          <div className="grid grid-cols-4 gap-x-6 gap-y-3 mt-3 pt-3 border-t border-border/50">
            {sale.policies.map((policy) => (
              <PolicyStatusDropdown
                key={policy.kind}
                kind={policy.kind}
                language={language}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
