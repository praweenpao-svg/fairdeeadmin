import React from 'react';
import { format } from 'date-fns';
import { th as thLocale } from 'date-fns/locale';
import { CalendarIcon, Lock, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import type { SaleDetail } from '@/data/mockSaleDetail';
import { useOpsLogic } from './OpsLogicContext';

const VEHICLE_CODES: Record<string, { th: string; en: string }> = {
  'E11': { th: 'รถยนต์ไฟฟ้า-ส่วนบุคคล', en: 'Electric Vehicle - Personal' },
  '110': { th: 'รถยนต์ส่วนบุคคล-ส่วนบุคคล', en: 'Passenger Car - Personal' },
  '120': { th: 'รถยนต์ส่วนบุคคล-เชิงพาณิชย์', en: 'Passenger Car - Commercial' },
  '210': { th: 'รถกระบะ-ส่วนบุคคล', en: 'Pickup Truck - Personal' },
};

const PAYMENT_METHODS = [
  { value: 'bank_account_full', th: 'บัญชีธนาคาร (จ่ายเต็ม)', en: 'Bank Transfer (Full)' },
  { value: 'qr_code_full', th: 'QR โค้ด (จ่ายเต็ม)', en: 'QR Code (Full)' },
  { value: 'credit_card_full', th: 'บัตรเครดิตออนไลน์ (จ่ายเต็ม)', en: 'Credit Card (Full)' },
  { value: 'bank_account_installment', th: 'บัญชีธนาคาร (ผ่อนชำระ)', en: 'Bank Transfer (Instalment)' },
  { value: 'qr_code_installment', th: 'QR โค้ด (ผ่อนชำระ)', en: 'QR Code (Instalment)' },
  { value: 'credit_card_installment', th: 'บัตรเครดิตออนไลน์ (ผ่อนชำระ)', en: 'Credit Card (Instalment)' },
  { value: 'insurer_cc', th: 'บัตรเครดิตผ่านบริษัทประกัน', en: 'Credit Card via Insurer' },
  { value: 'insurer_transfer', th: 'โอนเงินผ่านบริษัทประกัน', en: 'Transfer via Insurer' },
];

const POLICY_ADDRESS_SOURCES = [
  { value: 'nid', th: 'บัตรประชาชน', en: 'NID (ID Card)' },
  { value: 'passport', th: 'หนังสือเดินทาง', en: 'Passport' },
  { value: 'new', th: 'เพิ่มที่อยู่ใหม่', en: 'Add New Address' },
];

const SHIPPING_ADDRESS_SOURCES = [
  { value: 'national_id', th: 'ผู้เอาประกันภัย', en: 'Insured (from NID)' },
  { value: 'agent', th: 'ตัวแทน', en: 'Agent' },
  { value: 'car_reg', th: 'ทะเบียนรถ', en: 'Car Registration' },
  { value: 'new', th: 'เพิ่มที่อยู่ใหม่', en: 'Add New Address' },
];

function MondayTag({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 ml-1.5 align-middle">
      <span className="w-1.5 h-1.5 rounded-sm bg-purple-700" />
      Monday: {type}
    </span>
  );
}

function FormRow({ label, required, monday, children, hint }: { label: string; required?: boolean; monday?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground flex items-center flex-wrap">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
        {monday && <MondayTag type={monday} />}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DatePickerField({ value, onChange, placeholder, lang }: { value: string; onChange: (v: string) => void; placeholder?: string; lang: string }) {
  const dateValue = value ? new Date(value + 'T00:00:00') : undefined;
  const locale = lang === 'th' ? thLocale : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('w-full justify-between font-normal h-10', !value && 'text-muted-foreground')}
        >
          <span>{dateValue ? format(dateValue, 'dd MMM yyyy', { locale }) : (placeholder || (lang === 'th' ? 'เลือกวันที่' : 'Pick a date'))}</span>
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(d) => { if (d) onChange(format(d, 'yyyy-MM-dd')); }}
          initialFocus
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );
}

interface PillOption { value: string; label: string }
function PillToggle({ options, value, onChange }: { options: PillOption[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex border border-input rounded-md overflow-hidden">
      {options.map((opt, i) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-6 py-2 text-sm transition-colors border-r border-input last:border-r-0',
              selected ? 'bg-primary text-primary-foreground font-medium' : 'bg-background text-foreground hover:bg-muted'
            )}
          >
            {opt.label} {selected && '✓'}
          </button>
        );
      })}
    </div>
  );
}

export function Step1FormSection({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();
  const t = (th: string, en: string) => (language === 'th' ? th : en);
  const {
    logic, setLogic,
    coverageStartDate, setCoverageStartDate,
    coverageEndDate, setCoverageEndDate,
    phone, setPhone,
    addCompulsory, setAddCompulsory,
    compulsoryStartDate, setCompulsoryStartDate,
    compulsoryEndDate, setCompulsoryEndDate,
    shippingAddressSource, setShippingAddressSource,
    policyAddressSource, setPolicyAddressSource,
  } = useOpsLogic();

  const vehicleCode = sale.vehicle.vehicleCode.split(' ')[0] || '110';
  const vcDef = VEHICLE_CODES[vehicleCode] ?? VEHICLE_CODES['110'];
  const vehicleCodeLabel = `${vehicleCode} - ${language === 'th' ? vcDef.th : vcDef.en}`;

  const isInstallment = logic.paymentType === 'Instalment';
  const showInspection = logic.insuranceClass === 'Type1';

  const setLogicField = <K extends keyof typeof logic>(key: K, v: (typeof logic)[K]) => {
    setLogic(prev => ({ ...prev, [key]: v }));
  };

  return (
    <Card className="border-border">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-bold">{t('ข้อมูลพื้นฐาน', 'Basic Information')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('ระบบจะใช้ข้อมูลนี้กำหนดเอกสารที่ต้องแนบ', 'These fields drive the required document list below.')}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {t('ขั้นตอนที่ 1: เชื่อมโยงเอกสาร', 'Step 1: Link Documents')}
          </Badge>
        </div>

        {/* Voluntary dates */}
        <FormRow label={t('วันเริ่มความคุ้มครอง', 'Voluntary Start Date')} required monday="date picker">
          <DatePickerField value={coverageStartDate} onChange={setCoverageStartDate} lang={language} />
        </FormRow>

        <FormRow
          label={t('วันสิ้นสุดความคุ้มครอง', 'Voluntary End Date')}
          hint={t('ค่าเริ่มต้น: 1 ปีหลังจากวันเริ่มต้น (แก้ไขได้)', 'Defaults to 1 year after start date (editable)')}
        >
          <DatePickerField value={coverageEndDate} onChange={setCoverageEndDate} lang={language} />
        </FormRow>

        <FormRow label={t('เบอร์โทรศัพท์ลูกค้า', 'Customer Phone Number')} required monday="text">
          <Input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={10}
            placeholder="0812345678"
          />
        </FormRow>

        <FormRow label={t('รหัสประเภทรถ', 'Vehicle Code')} required>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  role="textbox"
                  aria-readonly="true"
                  tabIndex={0}
                  className="w-full flex items-center justify-between gap-2 border border-input rounded-md px-3 py-2.5 text-sm bg-muted/40 text-foreground cursor-not-allowed"
                >
                  <span className="truncate">{vehicleCodeLabel}</span>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                <div className="flex gap-1.5 items-start">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{t('รหัสประเภทรถถูกล็อคจากการเลือกแพ็คเกจ', 'Vehicle code is locked based on selected package.')}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </FormRow>

        <FormRow label={t('ประเภทลูกค้า', 'Customer Type')}>
          <PillToggle
            value={logic.customerType}
            onChange={(v) => setLogicField('customerType', v as 'individual' | 'corporation')}
            options={[
              { value: 'individual', label: t('บุคคลธรรมดา', 'Individual') },
              { value: 'corporation', label: t('นิติบุคคล', 'Corporation') },
            ]}
          />
        </FormRow>

        <FormRow label={t('เป็นรถเชิงพาณิชย์', 'Commercial Vehicle')}>
          <PillToggle
            value={logic.carType === 'Special' ? 'yes' : (sale.forCommercialVehicle ? 'yes' : 'no')}
            onChange={(v) => {
              // Toggle reflects intent; doesn't override carType but flips Vehicle Code semantics.
              if (v === 'yes' && logic.carType === 'Normally') setLogicField('carType', 'Special');
              if (v === 'no' && logic.carType === 'Special') setLogicField('carType', 'Normally');
            }}
            options={[
              { value: 'yes', label: t('ใช่', 'Yes') },
              { value: 'no', label: t('ไม่ใช่', 'No') },
            ]}
          />
        </FormRow>

        <FormRow label={t('ต้องการระบุผู้ขับขี่หรือไม่?', 'Driver License Required?')}>
          <Select
            value={String(logic.driverLicenseCount)}
            onValueChange={(v) => setLogicField('driverLicenseCount', Number(v))}
          >
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('ไม่จำเป็น', 'Not required')}</SelectItem>
              {[1, 2, 3, 4, 5].map(n => (
                <SelectItem key={n} value={String(n)}>{n} {t('ใบ', n === 1 ? 'license' : 'licenses')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {logic.driverLicenseCount > 0 && (
            <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-800 font-medium dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200">
              {t(
                `ต้องแนบใบอนุญาตขับขี่ ${logic.driverLicenseCount} ใบ ในส่วนแนบเอกสาร`,
                `${logic.driverLicenseCount} driver license(s) required in the attachment section below.`
              )}
            </div>
          )}
        </FormRow>

        <FormRow label={t('ซื้อ พ.ร.บ. เพิ่ม?', 'Add Compulsory Insurance?')} monday="tick box">
          <PillToggle
            value={addCompulsory ? 'yes' : 'no'}
            onChange={(v) => setAddCompulsory(v === 'yes')}
            options={[
              { value: 'yes', label: t('ใช่', 'Yes') },
              { value: 'no', label: t('ไม่ใช่', 'No') },
            ]}
          />
        </FormRow>

        {addCompulsory && (
          <>
            <FormRow label={t('วันเริ่มต้น พ.ร.บ.', 'Compulsory Start Date')} monday="date picker">
              <DatePickerField value={compulsoryStartDate} onChange={setCompulsoryStartDate} lang={language} />
            </FormRow>
            <FormRow
              label={t('วันสิ้นสุด พ.ร.บ.', 'Compulsory End Date')}
              hint={t('ค่าเริ่มต้น: 1 ปีหลังจากวันเริ่มต้น (แก้ไขได้)', 'Defaults to 1 year after start date (editable)')}
            >
              <DatePickerField value={compulsoryEndDate} onChange={setCompulsoryEndDate} lang={language} />
            </FormRow>
          </>
        )}

        <FormRow label={t('วิธีการชำระเงิน', 'Payment Method')} required monday="dropdown">
          <Select
            value={logic.paymentMethodValue}
            onValueChange={(v) => {
              const isInst = v.endsWith('_installment');
              setLogic(prev => ({
                ...prev,
                paymentMethodValue: v,
                paymentType: isInst ? 'Instalment' : 'Non-Instalment',
              }));
            }}
          >
            <SelectTrigger className="h-10"><SelectValue placeholder={t('เลือก...', 'Select...')} /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(o => (
                <SelectItem key={o.value} value={o.value}>{language === 'th' ? o.th : o.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isInstallment && (
            <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 font-medium dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200">
              {t('ผ่อนชำระ — ระบบจะขอเอกสารเพิ่มเติมในส่วนแนบเอกสาร', 'Instalment selected — additional documents will be required below.')}
            </div>
          )}
        </FormRow>

        {showInspection && (
          <FormRow label={t('วิธีตรวจสภาพรถ', 'Car Inspection Method')} hint={t('สำหรับประกันชั้น 1 เท่านั้น', 'Required for Type 1 only')}>
            <PillToggle
              value={logic.carInspectionMethod || 'none'}
              onChange={(v) => setLogicField('carInspectionMethod', (v === 'none' ? '' : v) as typeof logic.carInspectionMethod)}
              options={[
                { value: 'upload_photos', label: t('อัปโหลดรูป', 'Upload Photos') },
                { value: 'inspection_appointment', label: t('นัดตรวจ', 'Appointment') },
                { value: 'none', label: t('ไม่ตรวจ', 'None') },
              ]}
            />
          </FormRow>
        )}

        <FormRow label={t('ที่อยู่ในกรมธรรม์ (มาจาก)', 'Policy Address Source')} monday="dropdown">
          <Select value={policyAddressSource} onValueChange={setPolicyAddressSource}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {POLICY_ADDRESS_SOURCES.map(o => (
                <SelectItem key={o.value} value={o.value}>{language === 'th' ? o.th : o.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <FormRow label={t('ที่อยู่จัดส่งกรมธรรม์', 'Policy Shipping Address')} monday="dropdown">
          <Select value={shippingAddressSource} onValueChange={setShippingAddressSource}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SHIPPING_ADDRESS_SOURCES.map(o => (
                <SelectItem key={o.value} value={o.value}>{language === 'th' ? o.th : o.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
      </CardContent>
    </Card>
  );
}
