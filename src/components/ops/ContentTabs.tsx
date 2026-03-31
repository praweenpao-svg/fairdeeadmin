import React from 'react';
import mtiLogo from '@/assets/insurer-mti.png';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { CoveragePanel } from './CoveragePanel';
import { PolicyDetailsZone } from './PolicyDetailsZone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Image, CreditCard, User, Package, Link2, Plus, X, RefreshCw } from 'lucide-react';

interface ContentTabsProps {
  sale: SaleDetail;
}

function InvoiceTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();

  return (
    <div className="space-y-4">
      {sale.policies.map((policy) => (
        <Card key={policy.kind}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  policy.kind === 'vmi' ? 'border-primary text-primary text-[10px]' : 'border-orange-500 text-orange-600 text-[10px]'
                }>
                  {policy.kind.toUpperCase()}
                </Badge>
                <span className="text-sm font-medium">{policy.packageName}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {policy.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'เบี้ยหลังภาษี' : 'Premium After Tax'}</span>
                <span className="font-semibold">{policy.premiumAfterTax.toLocaleString()} ฿</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'คอมมิชชั่น' : 'Commission'}</span>
                <span className="font-medium text-primary">{policy.affiliateCommission.toLocaleString()} ฿</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'วิธีชำระ' : 'Payment Method'}</span>
                <span className="font-medium">{sale.paymentMethod}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-4">
          <h5 className="text-xs font-semibold mb-2">{language === 'th' ? 'สรุปยอดชำระ' : 'Payment Summary'}</h5>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === 'th' ? 'รวมเบี้ยประกัน' : 'Total Premium'}</span>
              <span className="font-semibold">
                {sale.policies.reduce((s, p) => s + p.premiumAfterTax, 0).toLocaleString()} ฿
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === 'th' ? 'สถานะการชำระ' : 'Payment Status'}</span>
              <Badge variant="outline" className="text-[10px]">{sale.paymentStatus}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();

  const docs = [
    { name: language === 'th' ? 'สำเนาบัตรประชาชน' : 'National ID Copy', status: 'uploaded' },
    { name: language === 'th' ? 'สำเนาทะเบียนรถ' : 'Car Registration', status: 'uploaded' },
    { name: language === 'th' ? 'กรมธรรม์ VMI' : 'VMI Policy File', status: 'pending' },
    ...(sale.hasCompulsoryInsurance ? [
      { name: language === 'th' ? 'กรมธรรม์ พ.ร.บ.' : 'CMI Policy File', status: 'pending' },
    ] : []),
    { name: language === 'th' ? 'สลิปชำระเงิน' : 'Payment Slip', status: 'uploaded' },
  ];

  return (
    <div className="space-y-2">
      {docs.map((doc, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3">
            {doc.status === 'uploaded' ? (
              <Image className="w-4 h-4 text-green-600" />
            ) : (
              <FileText className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">{doc.name}</span>
          </div>
          <Badge
            variant="outline"
            className={doc.status === 'uploaded'
              ? 'border-green-500 text-green-600 text-[10px]'
              : 'border-muted-foreground text-muted-foreground text-[10px]'
            }
          >
            {doc.status === 'uploaded'
              ? (language === 'th' ? 'อัปโหลดแล้ว' : 'Uploaded')
              : (language === 'th' ? 'รอเอกสาร' : 'Pending')
            }
          </Badge>
        </div>
      ))}
    </div>
  );
}

interface DocCategory {
  key: string;
  en: string;
  th: string;
  required?: boolean;
  docs: { id: string; name: string }[];
}

function LinkDocumentsTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');

  const [categories, setCategories] = React.useState<DocCategory[]>([
    { key: 'car_reg', en: 'Car registration', th: 'ทะเบียนรถ', required: true, docs: [] },
    { key: 'national_id', en: 'National ID', th: 'บัตรประชาชน', required: true, docs: [] },
    { key: 'old_policy', en: 'Old policy document', th: 'เอกสารกรมธรรม์เดิม', docs: [] },
    { key: 'manual_quote', en: 'Manual quotation from insurer', th: 'ใบเสนอราคาจากบริษัทประกัน', docs: [] },
    { key: 'national_id_undertaking', en: 'National ID with undertaking', th: 'บัตรประชาชนพร้อมหนังสือมอบอำนาจ', docs: [] },
    { key: 'national_id_selfie', en: 'National ID with selfie', th: 'บัตรประชาชนพร้อมเซลฟี่', docs: [] },
    { key: 'general', en: 'General documents', th: 'เอกสารทั่วไป', docs: [] },
  ]);

  const [unlinkedDocs] = React.useState<{ id: string; name: string }[]>([]);

  const handleAddDoc = (categoryKey: string) => {
    // In real implementation, this would open a file picker or link from unlinked docs
    const newDoc = { id: `doc-${Date.now()}`, name: `Document_${Date.now().toString().slice(-4)}` };
    setCategories(prev => prev.map(cat =>
      cat.key === categoryKey ? { ...cat, docs: [...cat.docs, newDoc] } : cat
    ));
  };

  const handleRemoveDoc = (categoryKey: string, docId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.key === categoryKey ? { ...cat, docs: cat.docs.filter(d => d.id !== docId) } : cat
    ));
  };

  const packageName = language === 'th' ? 'ชั้น 1 อีซี่' : 'Easy Type 1';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: document categories */}
      <div className="lg:col-span-3 space-y-4">
        {/* Package summary bar */}
        <Card className="border-border">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">{language === 'th' ? 'ชื่อแพ็กเกจ' : 'Package Name'}: </span>
                <span className="font-medium">{packageName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{language === 'th' ? 'ทุนประกัน' : 'Sum Insured'}: </span>
                <span className="font-medium">500,000.00 ฿</span>
              </div>
              <div>
                <span className="text-muted-foreground">{language === 'th' ? 'ประเภทซ่อม' : 'Garage Type'}: </span>
                <span className="font-medium">
                  {language === 'th'
                    ? (vmiPolicy?.garageType === 'Dealership' ? 'ซ่อมห้าง' : 'ซ่อมอู่')
                    : (vmiPolicy?.garageType === 'Dealership' ? 'Dealership' : 'Approved Garage')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{language === 'th' ? 'ผ่อนชำระ' : 'Instalment Type'}: </span>
                <span className="font-medium">{language === 'th' ? '10 งวด' : '10 instalments'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <h5 className="text-xs font-semibold">
          {language === 'th' ? `เอกสารที่ต้องเชื่อมโยงสำหรับ ${packageName}` : `Link Documents Required for ${packageName}`}
        </h5>

        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.key} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium">
                    {language === 'th' ? cat.th : cat.en}
                    {cat.required && <span className="text-destructive ml-0.5">*</span>}
                  </span>
                  <p className="text-[10px] text-muted-foreground">{cat.docs.length} {language === 'th' ? 'เอกสาร' : 'Documents'}</p>
                </div>
                <button
                  onClick={() => handleAddDoc(cat.key)}
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              {cat.docs.length > 0 && (
                <div className="mt-2 space-y-1">
                  {cat.docs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded text-[10px]">
                      <span>{doc.name}</span>
                      <button onClick={() => handleRemoveDoc(cat.key, doc.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: unlinked documents */}
      <div className="lg:col-span-2">
        <Card className="border-border sticky top-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-xs font-semibold">{language === 'th' ? 'เอกสารที่ยังไม่ได้เชื่อมโยง' : 'Unlinked Documents'}</h5>
                <p className="text-[10px] text-muted-foreground">{language === 'th' ? 'ลากรูปไปยังช่องทางซ้ายเพื่อเชื่อมโยง' : 'Drag image into respective box on the left to link it'}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                </button>
                <button className="px-3 py-1.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  {language === 'th' ? 'เชื่อมโยงอัตโนมัติ' : 'Auto link'}
                </button>
              </div>
            </div>

            {unlinkedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <X className="w-8 h-8 mb-2" />
                <span className="text-xs">{language === 'th' ? 'ไม่มีเอกสารที่ยังไม่ได้เชื่อมโยง' : 'No unlinked documents'}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {unlinkedDocs.map(doc => (
                  <div key={doc.id} className="p-2 border border-border rounded text-xs">{doc.name}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PolicyBenefitsTab({ sale }: { sale: SaleDetail }) {
  return (
    <div className="space-y-3">
      {sale.policies.map((policy) => (
        <CoveragePanel
          key={policy.kind}
          coverage={policy.coverage}
          policyKind={sale.policies.length > 1 ? policy.kind : undefined}
          showLabel={sale.policies.length > 1}
        />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h5 className="text-xs font-semibold text-foreground">{children}</h5>;
}

function ToggleSelect({ label, options, value, onChange }: {
  label: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="grid grid-cols-2 gap-2" style={{ maxWidth: '280px' }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`py-1.5 rounded-md text-xs font-medium border transition-colors text-center ${
              value === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:bg-accent'
            }`}
          >
            {opt.label}{value === opt.value && ' ✓'}
          </button>
        ))}
      </div>
    </div>
  );
}

const VEHICLE_CODES = [
  'E11 - รถยนต์ไฟฟ้า-ส่วนบุคคล',
  '110 - รถยนต์ส่วนบุคคล-ส่วนบุคคล',
  '120 - รถยนต์ส่วนบุคคล-เชิงพาณิชย์',
  '210 - รถกระบะ-ส่วนบุคคล',
  '210 - รถตู้-รถตู้ส่วนบุคคล',
  '220 - รถตู้รับจ้าง รถตู้รับจ้างเชิงพาณิชย์ ไม่สาธารณะ',
  '230 - รถตู้รับจ้าง-รถตู้รับจ้างสาธารณะ',
  '320 - รถยนต์บรรทุก (รถกระบะ)',
  '320.1 - รถบรรทุก (รถใหญ่)',
  '327 - รถบรรทุกใช้ลากจูงรถพ่วง',
  '420 - รถใหญ่-รถลากจูง รถหัวลาก',
  '520 - รถใหญ่-รถพ่วงเชิงพาณิชย์',
  '540 - รถใหญ่-รถพ่วงเชิงพาณิชย์พิเศษ',
  '610 - รถมอเตอร์ไซค์-ส่วนบุคคล',
  '620 - รถมอเตอร์ไซค์-เชิงพาณิชย์',
  '630 - รถมอเตอร์ไซค์รับจ้างสาธารณะ',
  '730 - รถแท็กซี่-รถแท็กซี่รับจ้างสาธารณะ',
];

const PAYMENT_METHODS = [
  { value: 'bank_account_full', th: 'บัญชีธนาคาร (จ่ายเต็ม)', en: 'Bank Account (Full Payment)' },
  { value: 'bank_account_installment', th: 'บัญชีธนาคาร (ผ่อนชำระ)', en: 'Bank Account (Installment)' },
  { value: 'qr_code_full', th: 'QR โค้ด (จ่ายเต็ม)', en: 'QR Code (Full Payment)' },
  { value: 'qr_code_installment', th: 'QR โค้ด (ผ่อนชำระ)', en: 'QR Code (Installment)' },
  { value: 'credit_card_full', th: 'บัตรเครดิตออนไลน์ (จ่ายเต็ม)', en: 'Online Credit Card (Full Payment)' },
  { value: 'credit_card_installment', th: 'บัตรเครดิตออนไลน์ (ผ่อนชำระ)', en: 'Online Credit Card (Installment)' },
  { value: 'insurer_cc_bank', th: 'บัตรเครดิต/โอนเงินผ่านบริษัทประกัน', en: 'Insurer Credit Card / Insurer Bank Transfer' },
  { value: 'credits_full', th: 'เครดิต (จ่ายเต็ม)', en: 'Credits (Full Payment)' },
];

const EQUAL_INSTALLMENT_OPTIONS = [
  { value: '3', label: '3 (0%)', th: '3 งวด (0%) รับรายได้หลังงวดที่ 3', en: '3 installments (0%) income after 3rd installment' },
  { value: '4', label: '4 (0%)', th: '4 งวด (0%) รับรายได้หลังงวดที่ 3', en: '4 installments (0%) income after 3rd installment' },
  { value: '5', label: '5 (0%)', th: '5 งวด (0%) รับรายได้หลังงวดที่ 3', en: '5 installments (0%) income after 3rd installment' },
  { value: '6', label: '6 (0%)', th: '6 งวด (0%) รับรายได้หลังงวดที่ 3', en: '6 installments (0%) income after 3rd installment' },
  { value: '8', label: '8 (4%)', th: '8 งวด (4%) รับรายได้หลังงวดที่ 3', en: '8 installments (4%) income after 3rd installment' },
  { value: '10', label: '10 (6%)', th: '10 งวด (6%) รับรายได้หลังงวดที่ 3', en: '10 installments (6%) income after 3rd installment' },
];

const DOWNPAYMENT_INSTALLMENT_OPTIONS = [
  { value: '6', label: '6 (0%)', th: '6 งวด (0%) รับรายได้หลังงวดที่ 2', en: '6 installments (0%) income after 2nd installment' },
  { value: '8', label: '8 (4%)', th: '8 งวด (4%) รับรายได้หลังงวดที่ 2', en: '8 installments (4%) income after 2nd installment' },
  { value: '10', label: '10 (6%)', th: '10 งวด (6%) รับรายได้หลังงวดที่ 2', en: '10 installments (6%) income after 2nd installment' },
];

function PackageSelectionTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [installmentPlan, setInstallmentPlan] = React.useState('');
  const [addCmi, setAddCmi] = React.useState('');
  const [customerType, setCustomerType] = React.useState<string>('');
  const [commercialVehicle, setCommercialVehicle] = React.useState('');
  const [kycMode, setKycMode] = React.useState('');

  const isInstallment = paymentMethod === 'bank_account_installment' || paymentMethod === 'qr_code_installment' || paymentMethod === 'credit_card_installment';
  const showKyc = paymentMethod === 'bank_account_installment' || paymentMethod === 'qr_code_installment';
  const installmentOptions = installmentPlan === 'downpayment' ? DOWNPAYMENT_INSTALLMENT_OPTIONS : EQUAL_INSTALLMENT_OPTIONS;

  return (
    <div className="space-y-6">
      {/* Selected Package Card */}
      <div className="space-y-2">
        <SectionLabel>{language === 'th' ? 'แพ็กเกจที่เลือก' : 'Select a package'}</SectionLabel>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">{language === 'th' ? 'ชั้น 1 อีซี่' : 'Easy Type 1'}</p>
                <p className="text-xs text-muted-foreground">{language === 'th' ? 'เมืองไทยประกันภัย' : 'Muang Thai Insurance'}</p>
              </div>
              <img src={mtiLogo} alt="MTI" className="w-8 h-8 rounded object-cover" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'th' ? 'ค่าคอมมิชชั่น' : 'Commission'}</span>
                <span className="font-semibold text-sidebar-background">2,000 ฿</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'th' ? 'ราคาเบี้ยประกันรวม' : 'Total Premium'}</span>
                <span className="font-semibold text-sidebar-background">10,000 ฿</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'th' ? 'ทุนประกัน' : 'Sum Insured'}</span>
                <span className="font-semibold text-sidebar-background">500,000 ฿</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Customer Type */}
          <ToggleSelect
            label={language === 'th' ? 'ประเภทลูกค้า' : 'Customer Type'}
            options={[
              { value: 'individual', label: language === 'th' ? 'บุคคลธรรมดา' : 'Individual' },
              { value: 'corporation', label: language === 'th' ? 'บริษัท' : 'Corporation' },
            ]}
            value={customerType}
            onChange={setCustomerType}
          />

          {/* Commercial Vehicle */}
          <ToggleSelect
            label={language === 'th' ? 'สำหรับรถพาณิชย์' : 'For Commercial Vehicle'}
            options={[
              { value: 'yes', label: language === 'th' ? 'ใช่' : 'Yes' },
              { value: 'no', label: language === 'th' ? 'ไม่ใช่' : 'No' },
            ]}
            value={commercialVehicle}
            onChange={setCommercialVehicle}
          />

          {/* Add CMI */}
          <ToggleSelect
            label={language === 'th' ? 'ซื้อ พ.ร.บ. เพิ่ม?' : 'Add Compulsory Insurance?'}
            options={[
              { value: 'yes', label: language === 'th' ? 'ใช่' : 'Yes' },
              { value: 'no', label: language === 'th' ? 'ไม่ใช่' : 'No' },
            ]}
            value={addCmi}
            onChange={setAddCmi}
          />

          {/* CMI Start Date - only when CMI = yes */}
          {addCmi === 'yes' && (
            <div className="space-y-2">
              <SectionLabel>{language === 'th' ? 'วันเริ่มต้น พ.ร.บ.' : 'Compulsory Start Date'}</SectionLabel>
              <Input type="date" className="text-xs h-9" />
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'วิธีการชำระเงิน' : 'Payment Method'} <span className="text-destructive">*</span></SectionLabel>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={language === 'th' ? 'เลือกวิธีชำระเงิน' : 'Select payment method'} />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(pm => (
                  <SelectItem key={pm.value} value={pm.value}>{language === 'th' ? pm.th : pm.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Code */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'รหัสรถ' : 'Vehicle Code'} <span className="text-destructive">*</span></SectionLabel>
            <Select>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={language === 'th' ? 'เลือกรหัสรถ' : 'Select vehicle code'} />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_CODES.map(code => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add-Ons */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'ความคุ้มครองเพิ่มเติม' : 'Add-Ons'}</SectionLabel>
            <Select>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={language === 'th' ? 'เลือก Add-Ons' : 'Select Add-Ons'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{language === 'th' ? 'ไม่ติดตั้ง' : 'None'}</SelectItem>
                <SelectItem value="roadside">{language === 'th' ? 'ล้อแม็กซ์ สเกิร์ต ฝากระโปรง' : 'Alloy Wheels & Skirt'}</SelectItem>
                <SelectItem value="searchlight">{language === 'th' ? 'สเกิร์ตรอบคัน' : 'Full Body Kit'}</SelectItem>
                <SelectItem value="headlight">{language === 'th' ? 'ไฟหน้าแต่ง' : 'Custom Headlights'}</SelectItem>
                <SelectItem value="taillight">{language === 'th' ? 'ไฟท้ายแต่ง' : 'Custom Taillights'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right column: KYC + Installment (conditional) */}
        <div className="space-y-4">
          {showKyc && (
            <ToggleSelect
              label={language === 'th' ? 'ข้อมูล KYC' : 'KYC Information'}
              options={[
                { value: 'manual', label: 'Manual KYC' },
                { value: 'auto', label: 'Auto KYC' },
              ]}
              value={kycMode}
              onChange={setKycMode}
            />
          )}

          {isInstallment && (
            <div className="space-y-3">
              <ToggleSelect
                label={language === 'th' ? 'เลือกแผนผ่อนชำระ' : 'Installment Plan'}
                options={[
                  { value: 'equal', label: language === 'th' ? 'ผ่อนเท่ากัน' : 'Equal Installments' },
                  { value: 'downpayment', label: language === 'th' ? 'ดาวน์ 25%' : '25% Downpayment' },
                ]}
                value={installmentPlan}
                onChange={setInstallmentPlan}
              />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{language === 'th' ? 'จำนวนงวด' : 'No. of Installments'}</p>
                <Select>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder={language === 'th' ? 'เลือกจำนวนงวด' : 'Select installments'} />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{language === 'th' ? opt.th : opt.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContentTabs({ sale }: ContentTabsProps) {
  const { language } = useLanguageStore();

  return (
    <Tabs defaultValue="package" className="w-full">
      <TabsList className="w-full justify-start bg-muted/30 border border-border rounded-lg p-1">
        <TabsTrigger value="package" className="text-xs gap-1.5">
          <Package className="w-3.5 h-3.5" />
          {language === 'th' ? 'เลือกแพ็กเกจ' : 'Package Selection'}
        </TabsTrigger>
        <TabsTrigger value="link-docs" className="text-xs gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          {language === 'th' ? 'เชื่อมโยงเอกสาร' : 'Link Documents'}
        </TabsTrigger>
        <TabsTrigger value="details" className="text-xs gap-1.5">
          <User className="w-3.5 h-3.5" />
          {language === 'th' ? 'ข้อมูลลูกค้าและรถ' : 'Customer & Vehicle'}
        </TabsTrigger>
        <TabsTrigger value="invoice" className="text-xs gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          {language === 'th' ? 'ใบแจ้งหนี้และชำระเงิน' : 'Invoice & Payments'}
        </TabsTrigger>
        <TabsTrigger value="documents" className="text-xs gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {language === 'th' ? 'เอกสาร' : 'Documents'}
        </TabsTrigger>
        <TabsTrigger value="benefits" className="text-xs gap-1.5">
          <Image className="w-3.5 h-3.5" />
          {language === 'th' ? 'สิทธิประโยชน์กรมธรรม์' : 'Policy Benefits'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="package" className="mt-4">
        <PackageSelectionTab sale={sale} />
      </TabsContent>
      <TabsContent value="link-docs" className="mt-4">
        <LinkDocumentsTab sale={sale} />
      </TabsContent>
      <TabsContent value="details" className="mt-4">
        <PolicyDetailsZone sale={sale} />
      </TabsContent>
      <TabsContent value="invoice" className="mt-4">
        <InvoiceTab sale={sale} />
      </TabsContent>
      <TabsContent value="documents" className="mt-4">
        <DocumentsTab sale={sale} />
      </TabsContent>
      <TabsContent value="benefits" className="mt-4">
        <PolicyBenefitsTab sale={sale} />
      </TabsContent>
    </Tabs>
  );
}
