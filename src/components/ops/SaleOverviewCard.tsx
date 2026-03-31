import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, Pencil, X, FileText, Download, History, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    { value: 'payment_verified', en: 'Payment Verified', th: 'ยืนยันการชำระเงินแล้ว' },
    { value: 'insurer_notified', en: 'Insurer Notified', th: 'แจ้งบริษัทประกันแล้ว' },
    { value: 'credit_approved', en: 'Credit Approved', th: 'อนุมัติเครดิตแล้ว' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-5">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'การชำระเงิน' : 'Payment'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <StatusDropdown
          label={language === 'th' ? 'สถานะ' : 'Status'}
          options={pmtStatuses}
          defaultValue="payment_verified"
          language={language}
        />
        <div className="mt-2">
          <SummaryRow label={language === 'th' ? 'ยอดที่ต้องชำระ' : 'Amount Payable'} value="6,500.00 Baht" />
          <SummaryRow label={language === 'th' ? 'ยอดที่ชำระแล้ว' : 'Amount Paid'} value="6,500.00 Baht" />
        </div>
      </CardContent>
    </Card>
  );
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
      <CardHeader className="pb-2 pt-3 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Download className="w-4 h-4" />
          {language === 'th' ? 'ดาวน์โหลด' : 'Downloads'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {downloadItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toast.success(language === 'th' ? `กำลังดาวน์โหลด ${item.th}` : `Downloading ${item.en}`)}
              className="flex items-center justify-center px-3 py-2.5 rounded-md border border-border hover:bg-accent/50 transition-colors text-center"
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
  { en: 'Quotation Query', th: 'Query ใบเสนอราคา' },
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
        <CardHeader className="pb-2 pt-3 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="w-4 h-4" />
            {language === 'th' ? 'ประวัติ' : 'History'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {historyItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => idx === 0 ? setCreationOpen(true) : setActiveHistoryDialog(item.en)}
                className="flex items-center justify-center px-3 py-2.5 rounded-md border border-border hover:bg-accent/50 transition-colors text-center"
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
