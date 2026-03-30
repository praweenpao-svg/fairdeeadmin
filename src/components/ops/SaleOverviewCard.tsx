import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-right">{value || '—'}</span>
    </div>
  );
}

function EditableRow({ label, value, onSave, type = 'text', options }: {
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
      <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 gap-2">
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
        <div className="flex items-center gap-1.5">
          {type === 'select' && options ? (
            <Select value={draft} onValueChange={setDraft}>
              <SelectTrigger className="h-7 text-xs w-40">
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
              className="h-7 text-xs w-40"
              autoFocus
            />
          )}
          <button onClick={handleSave} className="p-0.5 hover:bg-muted rounded">
            <Check className="w-3.5 h-3.5 text-green-600" />
          </button>
          <button onClick={handleCancel} className="p-0.5 hover:bg-muted rounded">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 group">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        className="flex items-center gap-1.5 text-xs font-medium text-right hover:text-primary transition-colors"
        onClick={() => setEditing(true)}
      >
        {value || '—'}
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
      </button>
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
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'ข้อมูลงาน' : 'Sale Overview'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <ReadOnlyRow
          label={language === 'th' ? 'เลขใบเสนอราคา' : 'Quotation ID'}
          value={sale.qqId}
        />
        <EditableRow
          label={language === 'th' ? 'ประเภทงาน' : 'Sale Type'}
          value={saleType}
          type="select"
          options={saleTypeOptions}
          onSave={(v) => { setSaleType(v); handleFieldSave('Sale Type', v); }}
        />
        <EditableRow
          label={language === 'th' ? 'วันที่ขาย' : 'Sold On'}
          value={soldOn}
          type="text"
          onSave={(v) => { setSoldOn(v); handleFieldSave('Sold On', v); }}
        />
        <EditableRow
          label={language === 'th' ? 'เลขใบเสนอราคา บ.ประกัน' : 'Insurer Quotation ID'}
          value={insurerQid}
          type="text"
          onSave={(v) => { setInsurerQid(v); handleFieldSave('Insurer QID', v); }}
        />
        <ReadOnlyRow
          label={language === 'th' ? 'สร้างโดย' : 'Created by'}
          value="—"
        />
        <ReadOnlyRow
          label={language === 'th' ? 'สร้างเมื่อ' : 'Created at'}
          value={sale.createdAt}
        />
        <ReadOnlyRow
          label="KYC Status"
          value="—"
        />
        <ReadOnlyRow label="RF" value={sale.assignment.rf || '—'} />
        <ReadOnlyRow label="SC" value={sale.assignment.sc || '—'} />
        <ReadOnlyRow label="DE" value={sale.assignment.de || '—'} />
        <ReadOnlyRow label="Admin" value={sale.assignment.admin || '—'} />
        <ReadOnlyRow label="Delivery" value={sale.assignment.delivery || '—'} />
      </CardContent>
    </Card>
  );
}
