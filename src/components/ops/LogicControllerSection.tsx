import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import {
  TEST_SCENARIOS,
  type TestScenario,
  type LogicControllerOverrides,
} from '@/data/testScenarios';
import type {
  SaleType, InsuranceClass, PaymentType, CarType,
} from '@/data/documentRequirements';

export interface LogicControllerState {
  saleType: SaleType;
  insuranceClass: InsuranceClass;
  paymentType: PaymentType;
  carType: CarType;
  customerType: 'individual' | 'corporation';
  paymentMethodValue: string;
  driverLicenseCount: number;
  carInspectionMethod: 'upload_photos' | 'inspection_appointment' | '';
  garageType: 'Dealership' | 'Garage';
}

interface Props {
  value: LogicControllerState;
  onChange: (next: LogicControllerState) => void;
  onReset: () => void;
}

const SALE_TYPES: { value: SaleType; th: string; en: string }[] = [
  { value: 'New', th: 'งานใหม่', en: 'New' },
  { value: 'Renewable', th: 'ต่ออายุ', en: 'Renewal' },
  { value: 'COA', th: 'โอนโค้ด', en: 'COA' },
];
const CLASSES: InsuranceClass[] = ['Type1', 'Type2', 'Type2+', 'Type3', 'Type3+'];
const PAYMENT_TYPES: { value: PaymentType; th: string; en: string }[] = [
  { value: 'Non-Instalment', th: 'จ่ายเต็ม', en: 'Full Payment' },
  { value: 'Instalment', th: 'ผ่อนชำระ', en: 'Instalment' },
];
const CAR_TYPES: { value: CarType; th: string; en: string }[] = [
  { value: 'Normally', th: 'รถทั่วไป', en: 'Normal' },
  { value: 'EV', th: 'EV', en: 'EV' },
  { value: 'Special', th: 'High Sum', en: 'High Sum / Special' },
];
const CUSTOMER_TYPES: { value: 'individual' | 'corporation'; th: string; en: string }[] = [
  { value: 'individual', th: 'บุคคลธรรมดา', en: 'Individual' },
  { value: 'corporation', th: 'นิติบุคคล', en: 'Corporation' },
];
const PAYMENT_METHODS = [
  { value: 'bank_account_full', th: 'บัญชีธนาคาร (จ่ายเต็ม)', en: 'Bank Account (Full)' },
  { value: 'credit_card_full', th: 'บัตรเครดิต (จ่ายเต็ม)', en: 'Credit Card (Full)' },
  { value: 'qr_code_full', th: 'คิวอาร์โค้ด (จ่ายเต็ม)', en: 'QR Code (Full)' },
  { value: 'bank_account_installment', th: 'บัญชีธนาคาร (ผ่อน)', en: 'Bank Account (Inst.)' },
  { value: 'credit_card_installment', th: 'บัตรเครดิต (ผ่อน)', en: 'Credit Card (Inst.)' },
  { value: 'qr_code_installment', th: 'คิวอาร์โค้ด (ผ่อน)', en: 'QR Code (Inst.)' },
  { value: 'insurer_cc', th: 'บัตรเครดิตผ่านบริษัทประกัน', en: 'Credit Card via Insurer' },
  { value: 'insurer_transfer', th: 'โอนผ่านบริษัทประกัน', en: 'Transfer via Insurer' },
];
const INSPECTION_METHODS: { value: 'upload_photos' | 'inspection_appointment' | ''; th: string; en: string }[] = [
  { value: '', th: 'ไม่ต้องตรวจ', en: 'Not Required' },
  { value: 'upload_photos', th: 'อัปโหลดรูป', en: 'Upload Photos' },
  { value: 'inspection_appointment', th: 'นัดตรวจ', en: 'Inspection Appointment' },
];

export function LogicControllerSection({ value, onChange, onReset }: Props) {
  const { language } = useLanguageStore();
  const t = (th: string, en: string) => (language === 'th' ? th : en);
  const [activeScenario, setActiveScenario] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);

  const applyScenario = (scenario: TestScenario) => {
    const o: LogicControllerOverrides = scenario.data;
    onChange({
      saleType: o.saleType ?? value.saleType,
      insuranceClass: o.insuranceClass ?? value.insuranceClass,
      paymentType: o.paymentType ?? value.paymentType,
      carType: o.carType ?? value.carType,
      customerType: o.customerType ?? value.customerType,
      paymentMethodValue: o.paymentMethodValue ?? value.paymentMethodValue,
      driverLicenseCount: o.driverLicenseCount ?? value.driverLicenseCount,
      carInspectionMethod: o.carInspectionMethod ?? value.carInspectionMethod,
      garageType: value.garageType,
    });
    setActiveScenario(scenario.id);
  };

  const set = <K extends keyof LogicControllerState>(key: K, v: LogicControllerState[K]) => {
    onChange({ ...value, [key]: v });
    setActiveScenario(null);
  };

  return (
    <Card className="border-primary/30 font-sans">
      <CardContent className="p-4 space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary text-primary text-[10px] uppercase tracking-wide">
              {t('Logic Controller', 'Logic Controller')}
            </Badge>
            <span className="text-[11px] text-muted-foreground font-sans">
              {t('กำหนดเงื่อนไขเพื่อขับเคลื่อนรายการเอกสาร', 'Drives required document list')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onReset}>
              <RotateCcw className="w-3 h-3 mr-1" />
              {t('รีเซ็ต', 'Reset')}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setCollapsed(c => !c)}>
              {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Test scenario picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <Play className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {t('สถานการณ์ทดสอบ', 'Test Scenarios')}
          </span>
          {(() => {
            const selected = TEST_SCENARIOS.find(x => x.id === activeScenario);
            return (
              <Select
                value={activeScenario ?? ''}
                onValueChange={(id) => {
                  const s = TEST_SCENARIOS.find(x => x.id === id);
                  if (s) applyScenario(s);
                }}
              >
                <SelectTrigger className="h-7 text-[11px] font-sans flex-1 min-w-[260px] max-w-md [&>span]:line-clamp-1 [&>span]:truncate">
                  <SelectValue placeholder={t('เลือกสถานการณ์...', 'Select a scenario...')}>
                    {selected ? (language === 'th' ? selected.labelTh : selected.labelEn) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[360px]">
                  {TEST_SCENARIOS.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-[11px] font-sans">
                      <div className="flex flex-col gap-0.5 py-0.5">
                        <span className="font-medium">{language === 'th' ? s.labelTh : s.labelEn}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {language === 'th' ? s.descTh : s.descEn}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}
          {activeScenario && (
            <Badge variant="secondary" className="text-[10px]">
              {t('โหลดแล้ว', 'Loaded')}
            </Badge>
          )}
        </div>

        {!collapsed && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border">
            <Field label={t('ประเภทงาน', 'Sale Type')}>
              <Select value={value.saleType} onValueChange={(v) => set('saleType', v as SaleType)}>
                <SelectTrigger className="h-7 text-[11px] font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SALE_TYPES.map(o => <SelectItem key={o.value} value={o.value} className="text-[11px] font-sans">{language === 'th' ? o.th : o.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('ชั้นประกัน', 'Insurance Class')}>
              <Select value={value.insuranceClass} onValueChange={(v) => set('insuranceClass', v as InsuranceClass)}>
                <SelectTrigger className="h-7 text-[11px] font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASSES.map(c => <SelectItem key={c} value={c} className="text-[11px] font-sans">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('ประเภทการชำระ', 'Payment Type')}>
              <Select value={value.paymentType} onValueChange={(v) => set('paymentType', v as PaymentType)}>
                <SelectTrigger className="h-7 text-[11px] font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map(o => <SelectItem key={o.value} value={o.value} className="text-[11px] font-sans">{language === 'th' ? o.th : o.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('ประเภทรถ', 'Car Type')}>
              <Select value={value.carType} onValueChange={(v) => set('carType', v as CarType)}>
                <SelectTrigger className="h-7 text-[11px] font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAR_TYPES.map(o => <SelectItem key={o.value} value={o.value} className="text-[11px] font-sans">{language === 'th' ? o.th : o.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('ประเภทลูกค้า', 'Customer Type')}>
              <Select value={value.customerType} onValueChange={(v) => set('customerType', v as 'individual' | 'corporation')}>
                <SelectTrigger className="h-7 text-[11px] font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map(o => <SelectItem key={o.value} value={o.value} className="text-[11px] font-sans">{language === 'th' ? o.th : o.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('วิธีชำระ', 'Payment Method')}>
              <Select value={value.paymentMethodValue} onValueChange={(v) => set('paymentMethodValue', v)}>
                <SelectTrigger className="h-7 text-[11px] font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(o => <SelectItem key={o.value} value={o.value} className="text-[11px] font-sans">{language === 'th' ? o.th : o.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('จำนวนผู้ขับขี่ระบุชื่อ', 'Named Drivers')}>
              <Select value={String(value.driverLicenseCount)} onValueChange={(v) => set('driverLicenseCount', Number(v))}>
                <SelectTrigger className="h-7 text-[11px] font-sans">
                  <SelectValue>{String(value.driverLicenseCount)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)} className="text-[11px] font-sans">{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('การตรวจสภาพรถ', 'Inspection Method')}>
              <Select
                value={value.carInspectionMethod || '__none__'}
                onValueChange={(v) => set('carInspectionMethod', (v === '__none__' ? '' : v) as LogicControllerState['carInspectionMethod'])}
                disabled={value.insuranceClass !== 'Type1'}
              >
                <SelectTrigger className="h-7 text-[11px] font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSPECTION_METHODS.map(o => (
                    <SelectItem key={o.value || '__none__'} value={o.value || '__none__'} className="text-[11px] font-sans">
                      {language === 'th' ? o.th : o.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('ประเภทอู่', 'Garage Type')}>
              <Select value={value.garageType} onValueChange={(v) => set('garageType', v as LogicControllerState['garageType'])}>
                <SelectTrigger className="h-7 text-[11px] font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dealership" className="text-[11px] font-sans">{t('ศูนย์', 'Dealership')}</SelectItem>
                  <SelectItem value="Garage" className="text-[11px] font-sans">{t('อู่', 'Garage')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
