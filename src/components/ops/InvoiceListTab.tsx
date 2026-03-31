import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronRight, DollarSign } from 'lucide-react';

interface Invoice {
  id: string;
  source: string;
  amountPayable: string;
  clawbackSubject: string;
  invoiceDetails: string;
  paymentStatus: 'Fully Paid' | 'Unpaid' | 'Partial';
  paymentInfo?: string;
  createdAt?: string;
  paidAt?: string;
  amountPaid?: number;
  reconciled?: boolean;
  files?: string;
}

interface InvoiceSection {
  title: string;
  titleTh: string;
  invoices: Invoice[];
}

const mockInvoiceSections: InvoiceSection[] = [
  {
    title: 'Premium Invoices',
    titleTh: 'ใบแจ้งหนี้เบี้ยประกัน',
    invoices: [
      {
        id: '63881',
        source: 'Customer | Fairdee',
        amountPayable: '6,500 @ 23/01/2569',
        clawbackSubject: 'Voluntary Insurance',
        invoiceDetails: 'Voluntary Insurance',
        paymentStatus: 'Fully Paid',
        paymentInfo: '6,500 @ 23/01/2569 13:50:09',
        createdAt: '23/01/2569 13:50:09',
        paidAt: '23/01/2569 13:50:09',
        amountPaid: 6500,
        reconciled: true,
        files: 'Not Available',
      },
    ],
  },
  {
    title: 'Commission Invoices',
    titleTh: 'ใบแจ้งหนี้คอมมิชชั่น',
    invoices: [
      {
        id: '63882',
        source: 'Fairdee | Affiliate',
        amountPayable: '0 @ 26/01/2569',
        clawbackSubject: 'Affiliate Commission',
        invoiceDetails: 'Affiliate Commission',
        paymentStatus: 'Unpaid',
      },
    ],
  },
  {
    title: 'Referral Bonus Invoices',
    titleTh: 'ใบแจ้งหนี้โบนัสแนะนำ',
    invoices: [
      {
        id: '63883',
        source: 'Fairdee | 1913',
        amountPayable: '117 @ 12/02/2569',
        clawbackSubject: 'Affiliate Commission',
        invoiceDetails: 'Referral Bonus',
        paymentStatus: 'Unpaid',
      },
    ],
  },
  {
    title: 'Management Fee Invoices',
    titleTh: 'ใบแจ้งหนี้ค่าบริหาร',
    invoices: [
      {
        id: '63884',
        source: 'Fairdee | 1912',
        amountPayable: '82 @ 12/02/2569',
        clawbackSubject: 'Affiliate Commission',
        invoiceDetails: 'Management Fee',
        paymentStatus: 'Unpaid',
      },
      {
        id: '63885',
        source: 'Fairdee | 1911',
        amountPayable: '23 @ 12/02/2569',
        clawbackSubject: 'Affiliate Commission',
        invoiceDetails: 'Management Fee',
        paymentStatus: 'Unpaid',
      },
    ],
  },
];

const mockHistoricalChanges = [
  {
    changedBy: 'System',
    changedOn: '23/01/2569 13:50',
    changes: [{ key: 'Payment Status', oldValue: 'unpaid', newValue: 'fully_paid' }],
    reason: 'billing.tasks.async_handle_payment_request',
  },
  {
    changedBy: 'System',
    changedOn: '23/01/2569 13:50',
    changes: [{ key: 'Payment Method', oldValue: 'None', newValue: 'thai_qr' }],
    reason: 'billing.tasks.async_handle_payment_request',
  },
  {
    changedBy: 'vijay+jennifer42@qoala.id',
    changedOn: '23/01/2569 13:47',
    changes: [
      { key: 'Invoice Number', oldValue: '-', newValue: 'INV-10167-63881' },
      { key: 'Amount Payable', oldValue: '0', newValue: '6,500' },
    ],
    reason: 'POST /utils/fairdee-quotation',
  },
  {
    changedBy: 'vijay+jennifer42@qoala.id',
    changedOn: '23/01/2569 13:47',
    changes: [
      { key: 'Amount', oldValue: '0.00', newValue: '6049.77' },
      { key: 'Tax', oldValue: '0.00', newValue: '425.23' },
      { key: 'Duty', oldValue: '0.00', newValue: '25.00' },
    ],
    reason: 'POST /utils/fairdee-quotation',
  },
];

function PaymentStatusBadge({ status }: { status: string }) {
  const colors = status === 'Fully Paid'
    ? 'bg-green-50 text-green-700 border-green-200'
    : status === 'Unpaid'
    ? 'bg-orange-50 text-orange-700 border-orange-200'
    : 'bg-yellow-50 text-yellow-700 border-yellow-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colors}`}>
      {status}
    </span>
  );
}

function ChangeBadge({ value, variant }: { value: string; variant: 'old' | 'new' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
      variant === 'old' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
    }`}>
      {value}
    </span>
  );
}

function RecordPaymentDialog({ open, onOpenChange, invoiceId }: { open: boolean; onOpenChange: (o: boolean) => void; invoiceId: string }) {
  const { language } = useLanguageStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Record Payment – Invoice #{invoiceId}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="add">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="add" className="text-xs">Add payment</TabsTrigger>
            <TabsTrigger value="list" className="text-xs">Payment list</TabsTrigger>
          </TabsList>
          <TabsContent value="add" className="space-y-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground">Amount to pay</p>
              <p className="text-sm font-bold">0.00 THB</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Bank account <span className="text-destructive">*</span></label>
              <Select>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kbank" className="text-xs">KBank</SelectItem>
                  <SelectItem value="scb" className="text-xs">SCB</SelectItem>
                  <SelectItem value="bbl" className="text-xs">BBL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Bank reference number <span className="text-destructive">*</span></label>
              <Input className="text-xs h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Amount paid <span className="text-destructive">*</span></label>
              <Input className="text-xs h-9" />
              <p className="text-[10px] text-orange-600">No amount due on this invoice</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Payment date <span className="text-destructive">*</span></label>
              <Input type="datetime-local" className="text-xs h-9" defaultValue="2026-03-31T03:44" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Payment proof <span className="text-destructive">*</span></label>
              <Input type="file" className="text-xs h-9" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button size="sm" className="text-xs bg-primary">Confirm</Button>
            </div>
          </TabsContent>
          <TabsContent value="list" className="pt-2">
            <p className="text-xs text-muted-foreground py-4 text-center">No payments recorded yet.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceRemarkDialog({ open, onOpenChange, invoiceId }: { open: boolean; onOpenChange: (o: boolean) => void; invoiceId: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Invoice Remark – #{invoiceId} (Due on 2026-01-23)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="text-xs font-medium">Add remark</label>
          <Textarea placeholder="Enter remark..." className="text-xs min-h-[80px]" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="text-xs">Previous</Button>
            <Button size="sm" className="text-xs bg-primary">Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoricalChangesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="text-muted-foreground">⏱</span> Invoice Historical Data
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-medium text-muted-foreground w-[160px]">Changed By</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground w-[140px]">Changed On</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground">Changes</th>
                <th className="py-2 font-medium text-muted-foreground">Change Reason</th>
              </tr>
            </thead>
            <tbody>
              {mockHistoricalChanges.map((entry, idx) => (
                <tr key={idx} className="border-b border-border/50 align-top">
                  <td className="py-3 pr-4 text-xs">{entry.changedBy}</td>
                  <td className="py-3 pr-4 text-xs">{entry.changedOn}</td>
                  <td className="py-3 pr-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] text-muted-foreground">
                          <th className="text-left pb-1 font-medium">Key Changed</th>
                          <th className="text-left pb-1 font-medium">Old Value</th>
                          <th className="text-left pb-1 font-medium">New Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.changes.map((c, ci) => (
                          <tr key={ci}>
                            <td className="py-0.5 text-xs">{c.key}</td>
                            <td className="py-0.5"><ChangeBadge value={c.oldValue} variant="old" /></td>
                            <td className="py-0.5"><ChangeBadge value={c.newValue} variant="new" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                  <td className="py-3 text-[10px] text-muted-foreground break-all">{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceSectionTable({ section }: { section: InvoiceSection }) {
  const { language } = useLanguageStore();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [paymentDialogId, setPaymentDialogId] = useState<string | null>(null);
  const [remarkDialogId, setRemarkDialogId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold">{language === 'th' ? section.titleTh : section.title}</h4>
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr] gap-0 bg-muted/30 border-b border-border text-[10px] font-medium text-muted-foreground">
          <div className="px-2 py-2" />
          <div className="px-2 py-2">ID</div>
          <div className="px-2 py-2">Amount Payable</div>
          <div className="px-2 py-2">Clawback Subject</div>
          <div className="px-2 py-2">Invoice Details</div>
          <div className="px-2 py-2">Payment Details</div>
          <div className="px-2 py-2">Historical Changes</div>
          <div className="px-2 py-2">Remark</div>
          <div className="px-2 py-2">Payment</div>
        </div>

        {section.invoices.map((inv) => (
          <React.Fragment key={inv.id}>
            {/* Row */}
            <div className="grid grid-cols-[40px_1fr_2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr] gap-0 border-b border-border/50 items-center bg-card hover:bg-muted/10">
              <div className="px-2 py-2">
                <button onClick={() => toggleRow(inv.id)} className="w-5 h-5 flex items-center justify-center hover:bg-muted rounded">
                  {expandedRows[inv.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="px-2 py-2">
                <p className="text-xs font-medium">{inv.id}</p>
                <p className="text-[9px] text-muted-foreground">{inv.source}</p>
              </div>
              <div className="px-2 py-2 text-xs">{inv.amountPayable}</div>
              <div className="px-2 py-2 text-xs">{inv.clawbackSubject}</div>
              <div className="px-2 py-2 text-xs">{inv.invoiceDetails}</div>
              <div className="px-2 py-2">
                <PaymentStatusBadge status={inv.paymentStatus} />
              </div>
              <div className="px-2 py-2">
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setHistoryOpen(true)}>View</Button>
              </div>
              <div className="px-2 py-2">
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setRemarkDialogId(inv.id)}>Add remark</Button>
              </div>
              <div className="px-2 py-2">
                {inv.paymentStatus !== 'Fully Paid' && (
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 border-primary text-primary hover:bg-primary/10" onClick={() => setPaymentDialogId(inv.id)}>Add Payment</Button>
                )}
              </div>
            </div>

            {/* Expanded details */}
            {expandedRows[inv.id] && inv.createdAt && (
              <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-muted/10 border-b border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Created At</span>
                  <span>{inv.createdAt}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Paid At</span>
                  <span>{inv.paidAt || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Amount Paid</span>
                  <span>{inv.amountPaid?.toLocaleString() || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Reconciled</span>
                  <span className={inv.reconciled ? 'text-green-600 font-medium' : ''}>{inv.reconciled ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Files</span>
                  <span>{inv.files || 'Not Available'}</span>
                </div>
              </div>
            )}

            {/* No payments message for non-expanded unpaid */}
            {expandedRows[inv.id] && !inv.createdAt && (
              <div className="px-6 py-3 bg-muted/10 border-b border-border/50 text-xs text-muted-foreground">
                No payments for this invoice.
              </div>
            )}
          </React.Fragment>
        ))}

      </div>

      {/* Dialogs */}
      {paymentDialogId && (
        <RecordPaymentDialog open={!!paymentDialogId} onOpenChange={() => setPaymentDialogId(null)} invoiceId={paymentDialogId} />
      )}
      {remarkDialogId && (
        <InvoiceRemarkDialog open={!!remarkDialogId} onOpenChange={() => setRemarkDialogId(null)} invoiceId={remarkDialogId} />
      )}
      <HistoricalChangesDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}

export function InvoiceListTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-bold">{language === 'th' ? 'รายการใบแจ้งหนี้' : 'Invoice List'}</h3>
      </div>
      {mockInvoiceSections.map((section, idx) => (
        <InvoiceSectionTable key={idx} section={section} />
      ))}
    </div>
  );
}
