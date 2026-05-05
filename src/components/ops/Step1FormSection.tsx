import React from 'react';
import { format } from 'date-fns';
import { th as thLocale } from 'date-fns/locale';
import { CalendarIcon, Lock, Info, Camera, ClipboardCheck, X, Copy } from 'lucide-react';
import { toast } from 'sonner';
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
import { useOpsLogic, type ShippingFormat } from './OpsLogicContext';

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

const ADDONS = [
  { value: 'none', th: 'ไม่มี', en: 'None' },
  { value: 'alloy', th: 'ล้อแม็กซ์', en: 'Alloy Wheels' },
  { value: 'bodykit', th: 'บอดี้คิท', en: 'Body Kit' },
  { value: 'headlight', th: 'ไฟหน้า', en: 'Headlights' },
  { value: 'taillight', th: 'ไฟท้าย', en: 'Taillights' },
];

const POLICY_ADDRESS_SOURCES = [
  { value: 'nid', th: 'บัตรประชาชน', en: 'NID (ID Card)' },
  { value: 'passport', th: 'หนังสือเดินทาง', en: 'Passport' },
  { value: 'new', th: 'เพิ่มที่อยู่ใหม่', en: 'Add New Address' },
];

const SHIPPING_ADDRESS_SOURCES = [
  { value: 'national_id', th: 'ผู้เอาประกันภัย', en: 'Insured (from NID)' },
  { value: 'agent', th: 'ตัวแทน', en: 'Agent (FairDee)' },
  { value: 'car_reg', th: 'ทะเบียนรถ', en: 'Car Registration' },
  { value: 'new', th: 'เพิ่มที่อยู่ใหม่', en: 'Add New Address' },
];

const SHIPPING_FORMATS: { value: Exclude<ShippingFormat, ''>; th: string; en: string }[] = [
  { value: 'fairdee', th: 'พิมพ์โดย FairDee', en: 'Print by FairDee' },
  { value: 'self', th: 'พิมพ์เอง', en: 'Print Self' },
  { value: 'epolicy', th: 'e-Policy', en: 'e-Policy' },
];

function MondayTag(_: { type: string }) {
  return null;
}


function FormRow({ label, required, monday, info, children, hint, span = 1 }: { label: string; required?: boolean; monday?: string; info?: React.ReactNode; children: React.ReactNode; hint?: string; span?: 1 | 2 }) {
  return (
    <div className={cn('space-y-1.5 min-w-0', span === 2 && 'md:col-span-2')}>
      <Label className="text-xs font-semibold text-foreground flex items-center flex-wrap gap-1 leading-tight min-h-[18px]">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
        {info}
        {hint && <InfoBanner tone="info">{hint}</InfoBanner>}
        {monday && <MondayTag type={monday} />}
      </Label>
      {children}
    </div>
  );
}

function SectionCard({ title, subtitle, badge, info, children }: { title: string; subtitle?: string; badge?: React.ReactNode; info?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              {title}
              {info}
            </h3>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {badge}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          {children}
        </div>
      </CardContent>
    </Card>
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
          className={cn('w-full justify-between font-normal h-9 text-sm bg-card hover:bg-card', !value && 'text-muted-foreground')}
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
    <div className="inline-flex border border-input rounded-md overflow-hidden h-9 w-full">
      {options.map(opt => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 px-3 text-xs transition-colors border-r border-input last:border-r-0 flex items-center justify-center gap-1',
              selected ? 'bg-primary text-primary-foreground font-semibold' : 'bg-card text-foreground hover:bg-muted'
            )}
          >
            {opt.label} {selected && '✓'}
          </button>
        );
      })}
    </div>
  );
}

/** Pill-style chip used for source selectors (policy/shipping address). */
function ChipPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-foreground border-input hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}

function InfoBanner({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warn' }) {
  const cls =
    tone === 'warn'
      ? 'text-amber-600 hover:text-amber-700'
      : 'text-blue-600 hover:text-blue-700';
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More info"
            className={cn('inline-flex items-center justify-center cursor-help', cls)}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-xs text-[11px] leading-relaxed">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** 3-card inspection picker (Type 1 only). */
function InspectionPicker({
  value,
  onChange,
  locked,
  lang,
}: {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  lang: string;
}) {
  const t = (th: string, en: string) => (lang === 'th' ? th : en);
  const opts = [
    {
      value: 'not_required',
      icon: <X className="h-4 w-4" />,
      label: t('ไม่จำเป็น', 'Not Required'),
      desc: t('ไม่ต้องตรวจสภาพรถ', 'No inspection needed'),
    },
    {
      value: 'upload_photos',
      icon: <Camera className="h-4 w-4" />,
      label: t('อัปโหลดรูป', 'Upload Photos'),
      desc: t('อัปโหลดภาพถ่ายรถ 8 มุม', 'Upload 8-angle car photos'),
    },
    {
      value: 'inspection_appointment',
      icon: <ClipboardCheck className="h-4 w-4" />,
      label: t('นัดตรวจ', 'Appointment'),
      desc: t('นัดหมายเข้าตรวจสภาพ', 'Schedule an inspection visit'),
    },
  ];
  const current = value || 'not_required';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {opts.map(opt => {
        const isLocked = locked && opt.value !== 'upload_photos';
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && onChange(opt.value === 'not_required' ? '' : opt.value)}
            title={isLocked ? t('การต่ออายุใช้วิธีเดียวกับปีก่อน', 'Renewal uses last year\'s method') : undefined}
            className={cn(
              'text-left p-3 rounded-lg border transition-colors',
              active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input bg-card hover:bg-muted',
              isLocked && 'opacity-50 cursor-not-allowed',
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(active ? 'text-primary' : 'text-muted-foreground')}>{opt.icon}</span>
              <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-foreground')}>{opt.label}</span>
              {locked && opt.value === 'upload_photos' && <Lock className="h-3 w-3 text-primary" />}
            </div>
            <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

export function Step1FormSection({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();
  const lang = language;
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
    cmiShippingAddressSource, setCmiShippingAddressSource,
    cmiShippingSameAsVmi, setCmiShippingSameAsVmi,
    policyAddressSource, setPolicyAddressSource,
    addOns, setAddOns,
    kycMode, setKycMode,
    installmentPlan, setInstallmentPlan,
    installmentCount, setInstallmentCount,
    voluntaryShippingFormat, setVoluntaryShippingFormat,
    compulsoryShippingFormat, setCompulsoryShippingFormat,
    inspectionAppointmentDate, setInspectionAppointmentDate,
  } = useOpsLogic();

  const vehicleCode = sale.vehicle.vehicleCode.split(' ')[0] || '110';
  const vcDef = VEHICLE_CODES[vehicleCode] ?? VEHICLE_CODES['110'];
  const vehicleCodeLabel = `${vehicleCode} - ${language === 'th' ? vcDef.th : vcDef.en}`;

  const isInstallment = logic.paymentType === 'Instalment';
  const showInspection = logic.insuranceClass === 'Type1';
  const isRenewalInspectionLocked = logic.saleType === 'Renewable' && showInspection;

  // KYC visible for instalment via bank/QR (sibling rule)
  const showKyc = isInstallment && (
    logic.paymentMethodValue === 'bank_account_installment' ||
    logic.paymentMethodValue === 'qr_code_installment'
  );

  const installmentCountOptions =
    installmentPlan === 'downpayment'
      ? ['6', '8', '10']
      : ['3', '4', '5', '6', '8', '10'];

  const setLogicField = <K extends keyof typeof logic>(key: K, v: (typeof logic)[K]) => {
    setLogic(prev => ({ ...prev, [key]: v }));
  };

  const needsShippingAddress = !!shippingAddressSource;

  return (
    <div className="space-y-4">
      {/* ════════ Card 1: Basic Information ════════ */}
      <SectionCard
        title={t('ข้อมูลพื้นฐาน', 'Basic Information')}
        subtitle={t('ข้อมูลกรมธรรม์, ลูกค้า, รถ และตัวเลือกที่ขับเคลื่อนรายการเอกสาร', 'Policy, customer, vehicle and choices that drive the required document list.')}
        badge={
          <Badge variant="outline" className="text-[10px]">
            {t('ขั้นตอนที่ 1', 'Step 1')}
          </Badge>
        }
      >
        <FormRow label={t('วันเริ่มความคุ้มครอง', 'Voluntary Start Date')} required monday="date picker">
          <DatePickerField value={coverageStartDate} onChange={setCoverageStartDate} lang={lang} />
        </FormRow>

        <FormRow
          label={t('วันสิ้นสุดความคุ้มครอง', 'Voluntary End Date')}
          hint={t('ค่าเริ่มต้น: 1 ปีหลังจากวันเริ่มต้น (แก้ไขได้)', 'Defaults to 1 year after start date (editable)')}
        >
          <DatePickerField value={coverageEndDate} onChange={setCoverageEndDate} lang={lang} />
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
            className="h-9 text-sm bg-card"
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
                  className="w-full h-9 flex items-center justify-between gap-2 border border-input rounded-md px-3 text-sm bg-card text-foreground cursor-not-allowed"
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
              if (v === 'yes' && logic.carType === 'Normally') setLogicField('carType', 'Special');
              if (v === 'no' && logic.carType === 'Special') setLogicField('carType', 'Normally');
            }}
            options={[
              { value: 'yes', label: t('ใช่', 'Yes') },
              { value: 'no', label: t('ไม่ใช่', 'No') },
            ]}
          />
        </FormRow>

        <FormRow
          label={t('ต้องการระบุผู้ขับขี่หรือไม่?', 'Driver License Required?')}
          span={1}
          info={logic.driverLicenseCount > 0 ? (
            <InfoBanner>
              {t(
                `ต้องแนบใบอนุญาตขับขี่ ${logic.driverLicenseCount} ใบ ในส่วนแนบเอกสาร`,
                `${logic.driverLicenseCount} driver license(s) required in the attachment section below.`
              )}
            </InfoBanner>
          ) : undefined}
        >
          <Select
            value={String(logic.driverLicenseCount)}
            onValueChange={(v) => setLogicField('driverLicenseCount', Number(v))}
          >
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 — {t('ไม่จำเป็น', 'Not required')}</SelectItem>
              {[1, 2, 3, 4, 5].map(n => (
                <SelectItem key={n} value={String(n)}>{n} {t('ใบ', n === 1 ? 'license' : 'licenses')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <DatePickerField value={compulsoryStartDate} onChange={setCompulsoryStartDate} lang={lang} />
            </FormRow>
            <FormRow
              label={t('วันสิ้นสุด พ.ร.บ.', 'Compulsory End Date')}
              hint={t('ค่าเริ่มต้น: 1 ปีหลังจากวันเริ่มต้น (แก้ไขได้)', 'Defaults to 1 year after start date (editable)')}
            >
              <DatePickerField value={compulsoryEndDate} onChange={setCompulsoryEndDate} lang={lang} />
            </FormRow>
          </>
        )}

        <FormRow label={t('ความคุ้มครองเพิ่มเติม', 'Additional Coverage')} monday="dropdown">
          <Select value={addOns} onValueChange={(v) => setAddOns(v as typeof addOns)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ADDONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{lang === 'th' ? o.th : o.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        {showInspection && (
          <FormRow
            span={2}
            label={t('วิธีตรวจสภาพรถ', 'Car Inspection Method')}
            hint={t('สำหรับประกันชั้น 1 เท่านั้น', 'Required for Type 1 only')}
            info={
              isRenewalInspectionLocked ? (
                <InfoBanner tone="warn">
                  {t(
                    'งานต่ออายุ: วิธีตรวจสภาพรถจะใช้แบบเดียวกับปีก่อน (อัปโหลดภาพถ่าย 8 มุม) และเอกสารถูกแนบไว้ให้แล้ว',
                    "Renewal: car inspection method follows last year's selection (Upload 8-angle photos) and documents are pre-attached.",
                  )}
                </InfoBanner>
              ) : logic.carInspectionMethod === 'upload_photos' ? (
                <InfoBanner>
                  {t(
                    'ต้องอัปโหลดภาพถ่ายรถอย่างน้อย 8 มุม ในส่วนแนบเอกสาร',
                    'You must upload at least 8 car inspection photos in the attachment section.',
                  )}
                </InfoBanner>
              ) : undefined
            }
          >
            <InspectionPicker
              value={logic.carInspectionMethod}
              onChange={(v) => {
                setLogicField('carInspectionMethod', v as typeof logic.carInspectionMethod);
                if (v !== 'inspection_appointment') setInspectionAppointmentDate('');
              }}
              locked={isRenewalInspectionLocked}
              lang={lang}
            />
            {logic.carInspectionMethod === 'inspection_appointment' && (
              <div className="mt-3 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t('วันนัดตรวจสภาพรถ', 'Inspection Appointment Date')}
                </Label>
                <DatePickerField value={inspectionAppointmentDate} onChange={setInspectionAppointmentDate} lang={lang} />
              </div>
            )}
          </FormRow>
        )}
      </SectionCard>

      {/* ════════ Card 2: Payment ════════ */}
      <SectionCard title={t('การชำระเงิน', 'Payment')}>
        <FormRow
          span={isInstallment ? 2 : 1}
          label={t('วิธีการชำระเงิน', 'Payment Method')}
          required
          monday="dropdown"
          info={isInstallment ? (
            <InfoBanner tone="warn">
              {t('ผ่อนชำระ — ระบบจะขอเอกสารเพิ่มเติมในส่วนแนบเอกสาร', 'Instalment selected — additional documents will be required below.')}
            </InfoBanner>
          ) : undefined}
        >
          <Select
            value={logic.paymentMethodValue}
            onValueChange={(v) => {
              const isInst = v.endsWith('_installment');
              setLogic(prev => ({
                ...prev,
                paymentMethodValue: v,
                paymentType: isInst ? 'Instalment' : 'Non-Instalment',
              }));
              if (!isInst) {
                setInstallmentPlan('');
                setInstallmentCount('');
                setKycMode('');
              }
            }}
          >
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t('เลือก...', 'Select...')} /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(o => (
                <SelectItem key={o.value} value={o.value}>{lang === 'th' ? o.th : o.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        {showKyc && (
          <FormRow label={t('ข้อมูล KYC', 'KYC Information')}>
            <PillToggle
              value={kycMode || 'manual'}
              onChange={(v) => setKycMode(v as typeof kycMode)}
              options={[
                { value: 'manual', label: t('Manual KYC', 'Manual KYC') },
                { value: 'auto', label: t('Auto KYC', 'Auto KYC') },
              ]}
            />
          </FormRow>
        )}

        {isInstallment && (
          <>
            <FormRow label={t('แผนการผ่อนชำระ', 'Instalment Plan')}>
              <PillToggle
                value={installmentPlan || 'equal'}
                onChange={(v) => {
                  setInstallmentPlan(v as typeof installmentPlan);
                  setInstallmentCount('');
                }}
                options={[
                  { value: 'equal', label: t('ผ่อนเท่ากัน', 'Equal Instalment') },
                  { value: 'downpayment', label: t('ดาวน์ 25%', '25% Downpayment') },
                ]}
              />
            </FormRow>
            <FormRow label={t('จำนวนงวดผ่อน', 'Number of Instalments')}>
              <Select value={installmentCount} onValueChange={setInstallmentCount}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={t('เลือกจำนวนงวด...', 'Select instalments...')} />
                </SelectTrigger>
                <SelectContent>
                  {installmentCountOptions.map(n => (
                    <SelectItem key={n} value={n}>{n} {t('งวด', 'instalments')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
          </>
        )}
      </SectionCard>

      {/* ════════ Card 3: Policy Address ════════ */}
      <SectionCard
        title={t('ที่อยู่ในกรมธรรม์', 'Policy Address')}
        info={policyAddressSource ? (
          <InfoBanner>
            {lang === 'th' ? (
              <>คุณเลือกแหล่งที่อยู่: <strong>{POLICY_ADDRESS_SOURCES.find(s => s.value === policyAddressSource)?.th}</strong>. กรุณาแนบเอกสารที่เกี่ยวข้องในส่วน <strong>"แนบเอกสาร"</strong> ด้านล่าง — ระบบจะอ่านข้อมูลและให้คุณตรวจสอบในขั้นตอนที่ 2</>
            ) : (
              <>You selected source: <strong>{POLICY_ADDRESS_SOURCES.find(s => s.value === policyAddressSource)?.en}</strong>. Please attach the related document in the <strong>"Link Documents"</strong> section below — the system will OCR and let you verify in Step 2.</>
            )}
          </InfoBanner>
        ) : undefined}
      >
        <div className="md:col-span-2 space-y-3">
          <div className="flex flex-wrap gap-2">
            {POLICY_ADDRESS_SOURCES.map(src => (
              <ChipPill
                key={src.value}
                active={policyAddressSource === src.value}
                onClick={() => setPolicyAddressSource(src.value)}
              >
                {lang === 'th' ? src.th : src.en}
              </ChipPill>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ════════ Card 4: Shipping ════════ */}
      <SectionCard title={t('การจัดส่งกรมธรรม์', 'Shipping')}>
        <FormRow label={t('รูปแบบกรมธรรม์ภาคสมัครใจ', 'Voluntary Shipping Format')} hint="ⓘ Chat Saved">
          <Select value={voluntaryShippingFormat} onValueChange={(v) => setVoluntaryShippingFormat(v as ShippingFormat)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder={t('เลือกรูปแบบ...', 'Select format...')} />
            </SelectTrigger>
            <SelectContent>
              {SHIPPING_FORMATS.map(o => (
                <SelectItem key={o.value} value={o.value}>{lang === 'th' ? o.th : o.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        {addCompulsory && (
          <FormRow label={t('รูปแบบกรมธรรม์ พ.ร.บ.', 'Compulsory Shipping Format')} hint="ⓘ Chat Saved">
            <Select value={compulsoryShippingFormat} onValueChange={(v) => setCompulsoryShippingFormat(v as ShippingFormat)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t('เลือกรูปแบบ...', 'Select format...')} />
              </SelectTrigger>
              <SelectContent>
                {SHIPPING_FORMATS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{lang === 'th' ? o.th : o.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        )}

        {needsShippingAddress && (
          <ShippingAddressBlock
            title={addCompulsory ? t('ที่อยู่จัดส่ง (ภาคสมัครใจ)', 'Shipping Address (Voluntary)') : t('ที่อยู่จัดส่ง', 'Shipping Address')}
            source={shippingAddressSource}
            onSourceChange={setShippingAddressSource}
            t={t}
            lang={lang}
          />
        )}

        {addCompulsory && (
          <div className="md:col-span-2 mt-1 p-4 bg-muted/40 border border-border rounded-md space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold">{t('ที่อยู่จัดส่ง พ.ร.บ. (CMI)', 'Shipping Address (CMI)')}</div>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={cmiShippingSameAsVmi}
                  onChange={(e) => setCmiShippingSameAsVmi(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                {t('ใช้ที่อยู่เดียวกับภาคสมัครใจ', 'Same as Voluntary')}
              </label>
            </div>
            {!cmiShippingSameAsVmi && (
              <ShippingAddressBlock
                title=""
                source={cmiShippingAddressSource}
                onSourceChange={setCmiShippingAddressSource}
                t={t}
                lang={lang}
                bare
              />
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ShippingAddressBlock({
  title, source, onSourceChange, t, lang, bare = false,
}: {
  title: string;
  source: string;
  onSourceChange: (v: string) => void;
  t: (th: string, en: string) => string;
  lang: string;
  bare?: boolean;
}) {
  const hint =
    source === 'national_id'
      ? t('ที่อยู่จัดส่งจะใช้ข้อมูลเดียวกับที่อยู่บนกรมธรรม์ คุณสามารถตรวจสอบและแก้ไขได้ในขั้นตอนที่ 2', 'Shipping address will mirror the Policy Address. You can review and edit it in Step 2.')
      : source === 'agent'
        ? t('ใช้ที่อยู่ตัวแทน (FairDee). ตรวจสอบรายละเอียดในขั้นตอนที่ 2', 'Using FairDee agent address. Review details in Step 2.')
        : source === 'car_reg'
          ? t('กรุณาแนบทะเบียนรถในส่วน "แนบเอกสาร" ด้านล่าง — ระบบจะอ่านที่อยู่และให้คุณตรวจสอบในขั้นตอนที่ 2', 'Please attach the Car Registration in "Link Documents" below — OCR will populate the shipping fields for review in Step 2.')
          : t('กรอกที่อยู่จัดส่งใหม่ในขั้นตอนที่ 2', 'Enter the new shipping address in Step 2.');

  const inner = (
    <>
      {title && (
        <div className="text-sm font-bold flex items-center gap-1.5">
          {title}
          {source && <InfoBanner>{hint}</InfoBanner>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {SHIPPING_ADDRESS_SOURCES.map(src => (
          <ChipPill
            key={src.value}
            active={source === src.value}
            onClick={() => onSourceChange(src.value)}
          >
            {lang === 'th' ? src.th : src.en}
          </ChipPill>
        ))}
      </div>
      {source === 'new' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('คัดลอกจาก:', 'Copy from:')}</span>
          {[
            { copyFrom: 'insured', label: t('ผู้เอาประกันภัย', 'Insured') },
            { copyFrom: 'car_reg', label: t('ทะเบียนรถ', 'Car Reg.') },
          ].map(opt => (
            <Button
              key={opt.copyFrom}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => toast.info(t('จะคัดลอกที่อยู่ในขั้นตอนที่ 2', 'Address will be copied in Step 2.'))}
            >
              <Copy className="h-3 w-3" /> {opt.label}
            </Button>
          ))}
        </div>
      )}
    </>
  );

  if (bare) return <div className="space-y-3">{inner}</div>;
  return (
    <div className="md:col-span-2 mt-1 p-4 bg-muted/40 border border-border rounded-md space-y-3">
      {inner}
    </div>
  );
}
