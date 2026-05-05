import React, { useMemo, useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { useOpsLogic } from './OpsLogicContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, QrCode, Upload, CreditCard, CheckCircle2, MessageSquare, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  sale: SaleDetail;
}

// Status sequence — pending_review (and beyond) means OPS has accepted the payment proof.
const PAID_STATUSES = new Set([
  'pending_review',
  'pending_issuance',
  'pending_endorsement',
  'endorsement_approved',
  'issued',
  'pending_delivery',
  'delivered',
]);

const fmtBaht = (n: number) => `${Math.round(n).toLocaleString()} Baht`;

function SectionCard({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
          <h3 className="text-sm font-bold">{title}</h3>
          {badge}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ---------- Full payment (non-instalment) view ----------
function FullPaymentView({ sale, isPaid }: { sale: SaleDetail; isPaid: boolean }) {
  const { language } = useLanguageStore();
  const totalPremium = sale.policies.reduce((s, p) => s + p.premiumAfterTax, 0);

  return (
    <SectionCard title={language === 'th' ? 'วิธีชำระเงิน' : 'Payment Methods'}>
      <p className="text-xs text-muted-foreground -mt-2">
        {language === 'th' ? 'เลือกวิธีการชำระเงินที่ต้องการ' : 'Please choose your preferred method of payment'}
      </p>

      {/* Payment 1 — QR */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{language === 'th' ? 'วิธีชำระเงิน 1' : 'Payment 1'}</p>
            <Badge variant="outline" className="text-[10px]">QR Payment</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{language === 'th' ? 'วิธีชำระเงิน' : 'Payment method'}</Label>
            <Select defaultValue="qr" disabled={isPaid}>
              <SelectTrigger className="h-9 text-sm bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="qr" className="text-xs">QR payment</SelectItem>
                <SelectItem value="cc" className="text-xs">Online Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isPaid ? (
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              {language === 'th' ? 'แสดงรายละเอียด QR' : 'Show QR payment details'}
            </Button>
          ) : (
            <PaidSummaryCard
              paidAt="19/01/2569 09:28:44"
              referenceId="9716121503819"
              amountPaid={totalPremium}
            />
          )}
        </CardContent>
      </Card>

      {/* Payment 2 — Bank transfer */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{language === 'th' ? 'วิธีชำระเงิน 2' : 'Payment 2'}</p>
            <Badge variant="outline" className="text-[10px]">Bank Transfer</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === 'th'
              ? 'โอนเงินตามจำนวนที่ต้องชำระเข้าบัญชีธนาคารด้านล่าง และอัปโหลดหลักฐานเมื่อชำระเรียบร้อย'
              : 'Transfer the amount payable to following bank account and upload the payment proof once the payment is done'}
          </p>
          <div className="text-xs space-y-0.5 bg-muted/30 rounded-md p-3">
            <p>{language === 'th' ? 'ชื่อบัญชี' : 'Account Name'}: บจก. พินนาเคิล โบรกเกอร์เรจ</p>
            <p>{language === 'th' ? 'ธนาคาร' : 'Bank'}: ธนาคาร กสิกรไทย</p>
            <p>{language === 'th' ? 'เลขที่บัญชี' : 'Account No.'}: 055-3-20926-9</p>
          </div>
          {!isPaid ? (
            <div className="border border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {language === 'th' ? 'อัปโหลดหลักฐานการชำระ' : 'Upload payment proof'}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                {language === 'th'
                  ? 'เปิดไฟล์ที่อัปโหลดเพื่อกรอก/แก้ไขรายละเอียด (เลขอ้างอิง, จำนวน, วันที่)'
                  : 'Open an uploaded file to enter or edit transaction details (bank reference, amount, payment date).'}
              </p>
            </div>
          ) : (
            <div className="border border-green-200 bg-green-50/40 rounded-md p-3 text-xs text-green-800">
              {language === 'th'
                ? 'ชำระผ่าน QR เรียบร้อยแล้ว ไม่ต้องอัปโหลดหลักฐาน'
                : 'Already paid via QR. No need to upload proof.'}
            </div>
          )}
        </CardContent>
      </Card>
    </SectionCard>
  );
}

function PaidSummaryCard({
  paidAt, referenceId, amountPaid, remaining, instalment,
}: {
  paidAt: string; referenceId: string; amountPaid: number; remaining?: number; instalment?: string;
}) {
  const { language } = useLanguageStore();
  return (
    <div className="border border-orange-200 bg-orange-50/50 rounded-md p-3 text-xs space-y-1.5">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
        <Badge variant="outline" className="text-[10px] border-green-300 bg-green-50 text-green-700">QR Payment</Badge>
        {instalment && <span className="text-[10px] text-muted-foreground">{instalment}</span>}
      </div>
      <div className="grid grid-cols-[120px_1fr] gap-y-0.5">
        <span className="text-muted-foreground">{language === 'th' ? 'ชำระเมื่อ' : 'Paid At'}:</span>
        <span className="text-green-700 font-semibold">{paidAt}</span>
        <span className="text-muted-foreground">{language === 'th' ? 'เลขอ้างอิง' : 'Reference ID'}:</span>
        <span className="text-green-700 font-semibold">{referenceId}</span>
        <span className="text-muted-foreground">{language === 'th' ? 'จำนวนที่ชำระ' : 'Current Amount Paid'}:</span>
        <span className="text-green-700 font-semibold">{fmtBaht(amountPaid)}</span>
        {remaining !== undefined && remaining > 0 && (
          <>
            <span className="text-muted-foreground">{language === 'th' ? 'คงเหลือ' : 'Remaining Amount'}:</span>
            <span className="text-orange-700 font-semibold">{fmtBaht(remaining)}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Instalment view ----------
interface InstalmentRow {
  index: number;
  total: number;
  dueOn: string;
  amount: number;
  payments: { paidAt: string; ref: string; amount: number; remaining?: number }[]; // empty = unpaid
}

function buildInstalmentMock(count: number, totalPremium: number): InstalmentRow[] {
  const per = Math.round(totalPremium / count);
  const startMonth = 2;
  const rows: InstalmentRow[] = [];
  for (let i = 1; i <= count; i++) {
    const month = ((startMonth + i - 1) % 12) + 1;
    rows.push({
      index: i,
      total: count,
      dueOn: `2026-${String(month).padStart(2, '0')}-23`,
      amount: per,
      payments: i <= 3
        ? (i === 1
          ? [
            { paidAt: '19/01/2569 09:28:44', ref: '9716121503819', amount: per - 160, remaining: 160 },
            { paidAt: '23/02/2569 12:38:46', ref: '10505215611304', amount: 160 },
          ]
          : i === 2
            ? [
              { paidAt: '23/02/2569 12:38:46', ref: '10505215611304', amount: per - 1159, remaining: 1159 },
              { paidAt: '26/03/2569 09:28:50', ref: '03306215978551', amount: 1159 },
            ]
            : [{ paidAt: '31/03/2569 16:15:58', ref: '6988321597855', amount: per }])
        : [],
    });
  }
  return rows;
}

function InstalmentView({ sale, count }: { sale: SaleDetail; count: number }) {
  const { language } = useLanguageStore();
  const totalPremium = sale.policies.reduce((s, p) => s + p.premiumAfterTax, 0);
  const rows = useMemo(() => buildInstalmentMock(count, totalPremium), [count, totalPremium]);
  const [remarkOpen, setRemarkOpen] = useState<number | null>(null);

  const totalPaid = rows.reduce((s, r) => s + r.payments.reduce((ps, p) => ps + p.amount, 0), 0);
  const totalToPay = rows.reduce((s, r) => s + r.amount, 0);
  const dueFromAffiliate = Math.max(0, totalToPay - totalPaid);

  return (
    <SectionCard title={language === 'th' ? 'รายการผ่อนชำระ' : 'Instalment Schedule'}>
      <div className="space-y-3">
        {rows.map((r) => {
          const isPaid = r.payments.length > 0 && r.payments.reduce((s, p) => s + p.amount, 0) >= r.amount;
          const partial = !isPaid && r.payments.length > 0;
          return (
            <Card key={r.index} className="border-border">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {language === 'th' ? `งวดที่ ${r.index}` : `Invoice ${r.index}`} — {language === 'th' ? 'ครบกำหนด' : 'Due on'} {r.dueOn}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        isPaid ? 'border-green-300 bg-green-50 text-green-700' :
                        partial ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                        'border-orange-300 bg-orange-50 text-orange-700'
                      )}
                    >
                      {isPaid ? (language === 'th' ? 'ชำระเต็มจำนวน' : 'Fully Paid')
                       : partial ? (language === 'th' ? 'ชำระบางส่วน' : 'Partial')
                       : (language === 'th' ? 'ยังไม่ชำระ' : 'Unpaid')}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={() => setRemarkOpen(r.index)}>
                    <MessageSquare className="w-3 h-3" />
                    {r.payments.length > 0
                      ? (language === 'th' ? 'ดูหมายเหตุ' : 'View Remarks')
                      : (language === 'th' ? 'เพิ่มหมายเหตุ' : 'Add Remark')}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{language === 'th' ? 'จำนวนที่ต้องชำระ' : 'Amount to be Paid'}</span>
                  <span className="font-semibold">{fmtBaht(r.amount)}</span>
                </div>

                {r.payments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.payments.map((_, pi) => (
                      <React.Fragment key={pi}>
                        <Badge variant="outline" className="text-[10px] border-orange-300 bg-orange-50/50 text-orange-700 gap-1">
                          <Receipt className="w-3 h-3" />
                          {language === 'th' ? `ใบเสร็จงวด ${r.index}/${r.total}` : `Instalment Receipt ${r.index}/${r.total}`}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-orange-300 bg-orange-50/50 text-orange-700 gap-1">
                          <Receipt className="w-3 h-3" />
                          {language === 'th' ? `สำเนาใบเสร็จงวด ${r.index}/${r.total}` : `Copy Instalment Receipt ${r.index}/${r.total}`}
                        </Badge>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {r.payments.map((p, pi) => (
                  <PaidSummaryCard
                    key={pi}
                    paidAt={p.paidAt}
                    referenceId={p.ref}
                    amountPaid={p.amount}
                    remaining={p.remaining}
                    instalment={`${r.index}/${r.total}`}
                  />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom totals */}
      <Card className="border-orange-200 bg-orange-50/40">
        <CardContent className="p-4 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === 'th' ? 'รวมยอดที่ต้องชำระ' : 'Total Amount To Be Paid'}</span>
            <span className="font-semibold text-orange-700">{fmtBaht(totalToPay)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === 'th' ? 'รวมยอดที่ชำระแล้ว' : 'Total Amount Paid'}</span>
            <span className="font-semibold text-orange-700">{fmtBaht(totalPaid)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === 'th' ? 'ยอดค้างจาก Affiliate ถึง Fairdee' : 'Amount Due From Affiliate To Fairdee'}</span>
            <span className="font-semibold text-orange-700">{fmtBaht(dueFromAffiliate)}</span>
          </div>
          <button className="text-[11px] text-primary underline">
            {language === 'th' ? 'คลิกที่นี่เพื่อดูรายละเอียด' : 'Click here for details'}
          </button>
        </CardContent>
      </Card>

      <Dialog open={remarkOpen !== null} onOpenChange={(o) => !o && setRemarkOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {language === 'th' ? 'หมายเหตุงวดที่' : 'Instalment Remark —'} #{remarkOpen}
            </DialogTitle>
          </DialogHeader>
          <Textarea placeholder={language === 'th' ? 'พิมพ์หมายเหตุ...' : 'Enter remark...'} className="text-xs min-h-[80px]" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setRemarkOpen(null)}>
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button size="sm" className="text-xs">{language === 'th' ? 'บันทึก' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

// ---------- Main ----------
export function ProcessPaymentTab({ sale }: Props) {
  const { language } = useLanguageStore();
  const { logic, installmentCount } = useOpsLogic();

  const isInstalment = logic.paymentType === 'Instalment';
  const instalmentN = parseInt(installmentCount || '10', 10) || 10;

  // Derive paid/verified state — both VMI & CMI must be at pending_review or further.
  const isPaymentVerified = useMemo(() => {
    const policies = sale.policies;
    if (policies.length === 0) return false;
    return policies.every(p => PAID_STATUSES.has(p.status));
  }, [sale.policies]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-bold">
          {language === 'th' ? 'ดำเนินการชำระเงิน' : 'Process Payment'}
        </h3>
        {isPaymentVerified && (
          <Badge variant="outline" className="text-[10px] border-green-300 bg-green-50 text-green-700 gap-1">
            <CheckCircle2 className="w-3 h-3" /> {language === 'th' ? 'ชำระเงินแล้ว' : 'Payment Verified'}
          </Badge>
        )}
      </div>

      {/* Cover Note */}
      <SectionCard title={language === 'th' ? 'ใบรับรองชั่วคราว (Cover Note)' : 'Cover Note'}>
        <div className="space-y-1 max-w-md">
          <Label className="text-xs">{language === 'th' ? 'รหัส Cover Note' : 'Cover note code'}</Label>
          <Input className="h-9 text-sm bg-card" defaultValue={isPaymentVerified ? 'FD-VIB-701492' : ''} disabled={isPaymentVerified} />
        </div>
      </SectionCard>

      {/* Sale Info */}
      <SectionCard title={language === 'th' ? 'ข้อมูลการขาย' : 'Sale Info'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
          <div className="space-y-1">
            <Label className="text-xs">{language === 'th' ? 'วันที่ขาย' : 'Date of sale'}</Label>
            <Input type="date" className="h-9 text-sm bg-card" defaultValue="2026-04-21" disabled={isPaymentVerified} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{language === 'th' ? 'ประเภทการขาย' : 'Sale type'}</Label>
            <Select defaultValue="cbc" disabled={isPaymentVerified}>
              <SelectTrigger className="h-9 text-sm bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cbc" className="text-xs">CBC to Fairdee</SelectItem>
                <SelectItem value="direct" className="text-xs">Direct</SelectItem>
                <SelectItem value="affiliate" className="text-xs">Affiliate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Car Inspection & Quotation ID */}
      <SectionCard title={language === 'th' ? 'การตรวจสภาพรถ และ Quotation ID' : 'Car Inspection & Quotation ID'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
          <div className="space-y-1">
            <Label className="text-xs">{language === 'th' ? 'สถานะการตรวจสภาพรถ' : 'Car inspection status'}</Label>
            <Select disabled={isPaymentVerified}>
              <SelectTrigger className="h-9 text-sm bg-card"><SelectValue placeholder={language === 'th' ? 'เลือกสถานะ' : 'Select Status'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="passed" className="text-xs">Passed</SelectItem>
                <SelectItem value="failed" className="text-xs">Failed</SelectItem>
                <SelectItem value="not_required" className="text-xs">Not Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{language === 'th' ? 'วันที่ตรวจสภาพรถ' : 'Car inspection date'}</Label>
            <Input type="date" className="h-9 text-sm bg-card" disabled={isPaymentVerified} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{language === 'th' ? 'Quotation ID' : 'Quotation ID'}</Label>
            <Input className="h-9 text-sm bg-card" defaultValue="10332" disabled={isPaymentVerified} />
          </div>
        </div>
      </SectionCard>

      {/* Payment methods / instalment schedule */}
      {isInstalment
        ? <InstalmentView sale={sale} count={instalmentN} />
        : <FullPaymentView sale={sale} isPaid={isPaymentVerified} />}
    </div>
  );
}
