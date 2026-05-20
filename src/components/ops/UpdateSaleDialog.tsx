/**
 * UpdateSaleDialog — Pass 3 of OPS Dashboard
 *
 * Post-Sale-ID corrections for the locked Steps 1 & 2. 17 collapsible sections,
 * each row shows "Current: <value>" and an editable input. On Review, dirty
 * fields are surfaced as a before/after diff; on Apply, changes are written back
 * to OpsLogicContext (live state) and to the parent sale object (via
 * onSaleChange), then logged to historyStore.
 *
 * Opens via window event "ops:openUpdateSale" (dispatched from SaleDetailBar /
 * OpsDashboard wiring).
 */
import React from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useLanguageStore } from '@/stores/languageStore';
import { useHistoryStore } from '@/stores/historyStore';
import type { SaleDetail } from '@/data/mockSaleDetail';
import { useOpsLogic } from './OpsLogicContext';

type Lang = 'en' | 'th';

interface UpdateSaleDialogProps {
  sale: SaleDetail;
  onSaleChange: (next: SaleDetail) => void;
}

/* ============== helpers ============== */

const fmt = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? '✓' : '✗';
  return String(v);
};

const sameVal = (a: unknown, b: unknown) =>
  (a ?? '') === (b ?? '') || JSON.stringify(a ?? '') === JSON.stringify(b ?? '');

/* ============== generic row primitives ============== */

interface FieldRowProps {
  label: string;
  current: unknown;
  children: React.ReactNode;
  dirty?: boolean;
}
function FieldRow({ label, current, children, dirty }: FieldRowProps) {
  return (
    <div className={`grid grid-cols-12 gap-3 items-start py-2 px-2 rounded ${dirty ? 'bg-amber-50/60 border border-amber-200' : ''}`}>
      <div className="col-span-4">
        <Label className="text-[11px] font-medium text-foreground">{label}</Label>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={fmt(current)}>
          Current: <span className="font-medium text-foreground/80">{fmt(current)}</span>
        </p>
      </div>
      <div className="col-span-8">{children}</div>
    </div>
  );
}

interface SectionProps {
  id: string;
  title: { en: string; th: string };
  language: Lang;
  open: boolean;
  onToggle: () => void;
  dirtyCount: number;
  children: React.ReactNode;
}
function Section({ title, language, open, onToggle, dirtyCount, children }: SectionProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span className="text-xs font-semibold">{language === 'th' ? title.th : title.en}</span>
          {dirtyCount > 0 && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-700 border-amber-200">
              {dirtyCount} {language === 'th' ? 'แก้ไข' : 'edited'}
            </Badge>
          )}
        </div>
      </button>
      {open && <div className="p-3 space-y-1 bg-card">{children}</div>}
    </div>
  );
}

/* ============== main dialog ============== */

export function UpdateSaleDialog({ sale, onSaleChange }: UpdateSaleDialogProps) {
  const { language } = useLanguageStore();
  const lang: Lang = language === 'th' ? 'th' : 'en';
  const ctx = useOpsLogic();

  const [open, setOpen] = React.useState(false);
  const [reviewing, setReviewing] = React.useState(false);
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({ customer_identity: true });

  // Draft mirrors editable sale + context values; updated on each input.
  const buildDraft = React.useCallback(() => ({
    sale: JSON.parse(JSON.stringify(sale)) as SaleDetail,
    ctx: {
      phone: ctx.phone,
      coverageStartDate: ctx.coverageStartDate,
      coverageEndDate: ctx.coverageEndDate,
      addCompulsory: ctx.addCompulsory,
      compulsoryStartDate: ctx.compulsoryStartDate,
      compulsoryEndDate: ctx.compulsoryEndDate,
      shippingAddressSource: ctx.shippingAddressSource,
      cmiShippingAddressSource: ctx.cmiShippingAddressSource,
      cmiShippingSameAsVmi: ctx.cmiShippingSameAsVmi,
      policyAddressSource: ctx.policyAddressSource,
      addOns: ctx.addOns,
      kycMode: ctx.kycMode,
      installmentPlan: ctx.installmentPlan,
      installmentCount: ctx.installmentCount,
      voluntaryShippingFormat: ctx.voluntaryShippingFormat,
      compulsoryShippingFormat: ctx.compulsoryShippingFormat,
      inspectionAppointmentDate: ctx.inspectionAppointmentDate,
      logic: { ...ctx.logic },
    },
  }), [sale, ctx]);

  const [draft, setDraft] = React.useState(buildDraft);

  // Reset draft when dialog opens
  React.useEffect(() => {
    const handler = () => {
      setDraft(buildDraft());
      setReviewing(false);
      setOpen(true);
    };
    window.addEventListener('ops:openUpdateSale', handler);
    return () => window.removeEventListener('ops:openUpdateSale', handler);
  }, [buildDraft]);

  const baseline = React.useMemo(buildDraft, [open]); // snapshot at open time

  // Mutators -------------------------------------------------
  const setSaleField = <K extends keyof SaleDetail>(key: K, value: SaleDetail[K]) =>
    setDraft(d => ({ ...d, sale: { ...d.sale, [key]: value } }));
  const setCustomer = (key: keyof SaleDetail['customer'], value: string) =>
    setDraft(d => ({ ...d, sale: { ...d.sale, customer: { ...d.sale.customer, [key]: value } } }));
  const setVehicle = (key: keyof SaleDetail['vehicle'], value: string | number) =>
    setDraft(d => ({ ...d, sale: { ...d.sale, vehicle: { ...d.sale.vehicle, [key]: value as never } } }));
  const setShipping = (key: keyof SaleDetail['shipping'], value: string) =>
    setDraft(d => ({ ...d, sale: { ...d.sale, shipping: { ...d.sale.shipping, [key]: value as never } } }));
  const setAssignment = (key: keyof SaleDetail['assignment'], value: string) =>
    setDraft(d => ({ ...d, sale: { ...d.sale, assignment: { ...d.sale.assignment, [key]: value } } }));
  const setAgent = (key: keyof SaleDetail['agent'], value: string | number | boolean) =>
    setDraft(d => ({ ...d, sale: { ...d.sale, agent: { ...d.sale.agent, [key]: value as never } } }));
  const setPolicy = (kind: 'vmi' | 'cmi', patch: Partial<SaleDetail['policies'][number]>) =>
    setDraft(d => ({
      ...d,
      sale: { ...d.sale, policies: d.sale.policies.map(p => p.kind === kind ? { ...p, ...patch } : p) },
    }));
  const setCtx = <K extends keyof typeof draft.ctx>(key: K, value: (typeof draft.ctx)[K]) =>
    setDraft(d => ({ ...d, ctx: { ...d.ctx, [key]: value } }));
  const setLogicField = <K extends keyof typeof draft.ctx.logic>(key: K, value: (typeof draft.ctx.logic)[K]) =>
    setDraft(d => ({ ...d, ctx: { ...d.ctx, logic: { ...d.ctx.logic, [key]: value } } }));

  const vmi = draft.sale.policies.find(p => p.kind === 'vmi');
  const cmi = draft.sale.policies.find(p => p.kind === 'cmi');
  const vmiBase = baseline.sale.policies.find(p => p.kind === 'vmi');
  const cmiBase = baseline.sale.policies.find(p => p.kind === 'cmi');

  // Driver slot management (uses logic.driverLicenseCount as the slot count)
  const addDriver = () => setLogicField('driverLicenseCount', Math.min(10, (draft.ctx.logic.driverLicenseCount ?? 0) + 1));
  const removeDriver = () => setLogicField('driverLicenseCount', Math.max(0, (draft.ctx.logic.driverLicenseCount ?? 0) - 1));

  /* ============ diff helpers ============ */

  type Diff = { label: string; from: unknown; to: unknown; sectionId: string };
  const diffs: Diff[] = React.useMemo(() => {
    const out: Diff[] = [];
    const add = (sectionId: string, label: string, from: unknown, to: unknown) => {
      if (!sameVal(from, to)) out.push({ sectionId, label, from, to });
    };
    // Customer Identity
    add('customer_identity', 'Title', baseline.sale.customer.title, draft.sale.customer.title);
    add('customer_identity', 'First Name', baseline.sale.customer.firstName, draft.sale.customer.firstName);
    add('customer_identity', 'Last Name', baseline.sale.customer.lastName, draft.sale.customer.lastName);
    add('customer_identity', 'National ID', baseline.sale.customer.nationalId, draft.sale.customer.nationalId);
    add('customer_identity', 'Birthday', baseline.sale.customer.birthday, draft.sale.customer.birthday);
    add('customer_identity', 'Gender', baseline.sale.customer.gender, draft.sale.customer.gender);
    add('customer_identity', 'Customer Type', baseline.sale.customer.customerType, draft.sale.customer.customerType);
    // Customer Contact
    add('customer_contact', 'Phone', baseline.ctx.phone, draft.ctx.phone);
    add('customer_contact', 'Address Line', baseline.sale.customer.addressLine, draft.sale.customer.addressLine);
    add('customer_contact', 'Province', baseline.sale.customer.province, draft.sale.customer.province);
    add('customer_contact', 'District', baseline.sale.customer.district, draft.sale.customer.district);
    add('customer_contact', 'Postal Code', baseline.sale.customer.postalCode, draft.sale.customer.postalCode);
    // Vehicle Identity
    add('vehicle_identity', 'Brand', baseline.sale.vehicle.brand, draft.sale.vehicle.brand);
    add('vehicle_identity', 'Model', baseline.sale.vehicle.model, draft.sale.vehicle.model);
    add('vehicle_identity', 'Year', baseline.sale.vehicle.year, draft.sale.vehicle.year);
    add('vehicle_identity', 'Color', baseline.sale.vehicle.color, draft.sale.vehicle.color);
    // Vehicle Registration
    add('vehicle_registration', 'License Plate', baseline.sale.vehicle.licensePlate, draft.sale.vehicle.licensePlate);
    add('vehicle_registration', 'Registration Province', baseline.sale.vehicle.registrationProvince, draft.sale.vehicle.registrationProvince);
    add('vehicle_registration', 'Chassis Number', baseline.sale.vehicle.chassisNumber, draft.sale.vehicle.chassisNumber);
    add('vehicle_registration', 'Engine Number', baseline.sale.vehicle.engineNumber, draft.sale.vehicle.engineNumber);
    add('vehicle_registration', 'Vehicle Weight', baseline.sale.vehicle.vehicleWeight, draft.sale.vehicle.vehicleWeight);
    // VMI Coverage
    add('coverage_vmi', 'Insurer', vmiBase?.insurer, vmi?.insurer);
    add('coverage_vmi', 'Package Name', vmiBase?.packageName, vmi?.packageName);
    add('coverage_vmi', 'Sum Insured', vmiBase?.sumInsured, vmi?.sumInsured);
    add('coverage_vmi', 'Garage Type', vmiBase?.garageType, vmi?.garageType);
    add('coverage_vmi', 'Premium After Tax', vmiBase?.premiumAfterTax, vmi?.premiumAfterTax);
    add('coverage_vmi', 'Start Date', baseline.ctx.coverageStartDate, draft.ctx.coverageStartDate);
    add('coverage_vmi', 'End Date', baseline.ctx.coverageEndDate, draft.ctx.coverageEndDate);
    // CMI Coverage
    add('coverage_cmi', 'Has CMI', baseline.ctx.addCompulsory, draft.ctx.addCompulsory);
    add('coverage_cmi', 'CMI Insurer', cmiBase?.insurer, cmi?.insurer);
    add('coverage_cmi', 'CMI Start Date', baseline.ctx.compulsoryStartDate, draft.ctx.compulsoryStartDate);
    add('coverage_cmi', 'CMI End Date', baseline.ctx.compulsoryEndDate, draft.ctx.compulsoryEndDate);
    // Voluntary Insurance (matrix drivers)
    add('voluntary_insurance', 'Sale Type', baseline.ctx.logic.saleType, draft.ctx.logic.saleType);
    add('voluntary_insurance', 'Insurance Class', baseline.ctx.logic.insuranceClass, draft.ctx.logic.insuranceClass);
    add('voluntary_insurance', 'Car Type', baseline.ctx.logic.carType, draft.ctx.logic.carType);
    add('voluntary_insurance', 'Customer Type (matrix)', baseline.ctx.logic.customerType, draft.ctx.logic.customerType);
    // Add-Ons
    add('addons', 'Add-Ons', baseline.ctx.addOns, draft.ctx.addOns);
    // Payment Method & Plan
    add('payment_plan', 'Payment Type', baseline.ctx.logic.paymentType, draft.ctx.logic.paymentType);
    add('payment_plan', 'Payment Method', baseline.ctx.logic.paymentMethodValue, draft.ctx.logic.paymentMethodValue);
    // Instalment
    add('instalment', 'Plan', baseline.ctx.installmentPlan, draft.ctx.installmentPlan);
    add('instalment', 'Instalment Count', baseline.ctx.installmentCount, draft.ctx.installmentCount);
    // Shipping VMI
    add('shipping_vmi', 'Voluntary Format', baseline.ctx.voluntaryShippingFormat, draft.ctx.voluntaryShippingFormat);
    add('shipping_vmi', 'Address Source', baseline.ctx.shippingAddressSource, draft.ctx.shippingAddressSource);
    add('shipping_vmi', 'Receiver Name', baseline.sale.shipping.receiverName, draft.sale.shipping.receiverName);
    add('shipping_vmi', 'Receiver Phone', baseline.sale.shipping.phoneNumber, draft.sale.shipping.phoneNumber);
    // Shipping CMI
    add('shipping_cmi', 'CMI Format', baseline.ctx.compulsoryShippingFormat, draft.ctx.compulsoryShippingFormat);
    add('shipping_cmi', 'CMI Same as VMI', baseline.ctx.cmiShippingSameAsVmi, draft.ctx.cmiShippingSameAsVmi);
    add('shipping_cmi', 'CMI Address Source', baseline.ctx.cmiShippingAddressSource, draft.ctx.cmiShippingAddressSource);
    // Policy Delivery / Address
    add('policy_delivery', 'Policy Address Source', baseline.ctx.policyAddressSource, draft.ctx.policyAddressSource);
    // Drivers
    add('drivers', 'Driver Slot Count', baseline.ctx.logic.driverLicenseCount, draft.ctx.logic.driverLicenseCount);
    // Inspection
    add('inspection', 'Method', baseline.ctx.logic.carInspectionMethod, draft.ctx.logic.carInspectionMethod);
    add('inspection', 'Appointment Date', baseline.ctx.inspectionAppointmentDate, draft.ctx.inspectionAppointmentDate);
    // KYC
    add('kyc', 'KYC Mode', baseline.ctx.kycMode, draft.ctx.kycMode);
    // Agent / Assignment
    add('agent', 'Agent Code', baseline.sale.agentCode, draft.sale.agentCode);
    add('agent', 'Agent Name', baseline.sale.agent.name, draft.sale.agent.name);
    add('agent', 'Admin', baseline.sale.assignment.admin, draft.sale.assignment.admin);
    add('agent', 'Delivery Owner', baseline.sale.assignment.delivery, draft.sale.assignment.delivery);
    return out;
  }, [draft, baseline, vmi, cmi, vmiBase, cmiBase]);

  const dirtyBySection = React.useMemo(() => {
    const m: Record<string, number> = {};
    diffs.forEach(d => { m[d.sectionId] = (m[d.sectionId] ?? 0) + 1; });
    return m;
  }, [diffs]);

  /* ============ apply ============ */

  const handleApply = () => {
    // Push sale-shape changes
    onSaleChange(draft.sale);
    // Push context changes
    if (draft.ctx.phone !== baseline.ctx.phone) ctx.setPhone(draft.ctx.phone);
    if (draft.ctx.coverageStartDate !== baseline.ctx.coverageStartDate) ctx.setCoverageStartDate(draft.ctx.coverageStartDate);
    if (draft.ctx.coverageEndDate !== baseline.ctx.coverageEndDate) ctx.setCoverageEndDate(draft.ctx.coverageEndDate);
    if (draft.ctx.addCompulsory !== baseline.ctx.addCompulsory) ctx.setAddCompulsory(draft.ctx.addCompulsory);
    if (draft.ctx.compulsoryStartDate !== baseline.ctx.compulsoryStartDate) ctx.setCompulsoryStartDate(draft.ctx.compulsoryStartDate);
    if (draft.ctx.compulsoryEndDate !== baseline.ctx.compulsoryEndDate) ctx.setCompulsoryEndDate(draft.ctx.compulsoryEndDate);
    if (draft.ctx.shippingAddressSource !== baseline.ctx.shippingAddressSource) ctx.setShippingAddressSource(draft.ctx.shippingAddressSource);
    if (draft.ctx.cmiShippingAddressSource !== baseline.ctx.cmiShippingAddressSource) ctx.setCmiShippingAddressSource(draft.ctx.cmiShippingAddressSource);
    if (draft.ctx.cmiShippingSameAsVmi !== baseline.ctx.cmiShippingSameAsVmi) ctx.setCmiShippingSameAsVmi(draft.ctx.cmiShippingSameAsVmi);
    if (draft.ctx.policyAddressSource !== baseline.ctx.policyAddressSource) ctx.setPolicyAddressSource(draft.ctx.policyAddressSource);
    if (draft.ctx.addOns !== baseline.ctx.addOns) ctx.setAddOns(draft.ctx.addOns);
    if (draft.ctx.kycMode !== baseline.ctx.kycMode) ctx.setKycMode(draft.ctx.kycMode);
    if (draft.ctx.installmentPlan !== baseline.ctx.installmentPlan) ctx.setInstallmentPlan(draft.ctx.installmentPlan);
    if (draft.ctx.installmentCount !== baseline.ctx.installmentCount) ctx.setInstallmentCount(draft.ctx.installmentCount);
    if (draft.ctx.voluntaryShippingFormat !== baseline.ctx.voluntaryShippingFormat) ctx.setVoluntaryShippingFormat(draft.ctx.voluntaryShippingFormat);
    if (draft.ctx.compulsoryShippingFormat !== baseline.ctx.compulsoryShippingFormat) ctx.setCompulsoryShippingFormat(draft.ctx.compulsoryShippingFormat);
    if (draft.ctx.inspectionAppointmentDate !== baseline.ctx.inspectionAppointmentDate) ctx.setInspectionAppointmentDate(draft.ctx.inspectionAppointmentDate);
    if (JSON.stringify(draft.ctx.logic) !== JSON.stringify(baseline.ctx.logic)) ctx.setLogic(draft.ctx.logic);

    // Log to history (one entry per change)
    diffs.forEach(d => {
      useHistoryStore.getState().add({
        type: 'field_update',
        description: `${d.label}: ${fmt(d.from)} → ${fmt(d.to)}`,
      });
    });

    toast.success(lang === 'th' ? 'อัปเดตการขายเรียบร้อย' : 'Sale updated', {
      description: `${diffs.length} ${lang === 'th' ? 'การเปลี่ยนแปลง' : 'change' + (diffs.length === 1 ? '' : 's')}`,
    });
    setOpen(false);
    setReviewing(false);
  };

  /* ============ section configs ============ */
  const sections: { id: string; title: { en: string; th: string }; body: React.ReactNode }[] = [
    {
      id: 'customer_identity',
      title: { en: '1. Customer Identity', th: '1. ข้อมูลผู้เอาประกัน' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'คำนำหน้า' : 'Title'} current={baseline.sale.customer.title} dirty={!sameVal(baseline.sale.customer.title, draft.sale.customer.title)}>
            <Input value={draft.sale.customer.title} onChange={e => setCustomer('title', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ชื่อ' : 'First Name'} current={baseline.sale.customer.firstName} dirty={!sameVal(baseline.sale.customer.firstName, draft.sale.customer.firstName)}>
            <Input value={draft.sale.customer.firstName} onChange={e => setCustomer('firstName', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'นามสกุล' : 'Last Name'} current={baseline.sale.customer.lastName} dirty={!sameVal(baseline.sale.customer.lastName, draft.sale.customer.lastName)}>
            <Input value={draft.sale.customer.lastName} onChange={e => setCustomer('lastName', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'เลขประจำตัว' : 'National ID'} current={baseline.sale.customer.nationalId} dirty={!sameVal(baseline.sale.customer.nationalId, draft.sale.customer.nationalId)}>
            <Input value={draft.sale.customer.nationalId} onChange={e => setCustomer('nationalId', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'วันเกิด' : 'Birthday'} current={baseline.sale.customer.birthday} dirty={!sameVal(baseline.sale.customer.birthday, draft.sale.customer.birthday)}>
            <Input value={draft.sale.customer.birthday} onChange={e => setCustomer('birthday', e.target.value)} placeholder="DD/MM/YYYY" className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'เพศ' : 'Gender'} current={baseline.sale.customer.gender} dirty={!sameVal(baseline.sale.customer.gender, draft.sale.customer.gender)}>
            <Select value={draft.sale.customer.gender} onValueChange={v => setCustomer('gender', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ประเภทลูกค้า' : 'Customer Type'} current={baseline.sale.customer.customerType} dirty={!sameVal(baseline.sale.customer.customerType, draft.sale.customer.customerType)}>
            <Select value={draft.sale.customer.customerType} onValueChange={(v: 'individual' | 'corporation') => { setCustomer('customerType', v); setLogicField('customerType', v); }}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </>
      ),
    },
    {
      id: 'customer_contact',
      title: { en: '2. Customer Address & Contact', th: '2. ที่อยู่และช่องทางติดต่อ' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'โทรศัพท์' : 'Phone'} current={baseline.ctx.phone} dirty={!sameVal(baseline.ctx.phone, draft.ctx.phone)}>
            <Input value={draft.ctx.phone} onChange={e => setCtx('phone', e.target.value.replace(/\D/g, ''))} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ที่อยู่' : 'Address Line'} current={baseline.sale.customer.addressLine} dirty={!sameVal(baseline.sale.customer.addressLine, draft.sale.customer.addressLine)}>
            <Textarea value={draft.sale.customer.addressLine} onChange={e => setCustomer('addressLine', e.target.value)} className="text-xs min-h-[44px]" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'จังหวัด' : 'Province'} current={baseline.sale.customer.province} dirty={!sameVal(baseline.sale.customer.province, draft.sale.customer.province)}>
            <Input value={draft.sale.customer.province} onChange={e => setCustomer('province', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'อำเภอ' : 'District'} current={baseline.sale.customer.district} dirty={!sameVal(baseline.sale.customer.district, draft.sale.customer.district)}>
            <Input value={draft.sale.customer.district} onChange={e => setCustomer('district', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'รหัสไปรษณีย์' : 'Postal Code'} current={baseline.sale.customer.postalCode} dirty={!sameVal(baseline.sale.customer.postalCode, draft.sale.customer.postalCode)}>
            <Input value={draft.sale.customer.postalCode} onChange={e => setCustomer('postalCode', e.target.value)} className="h-7 text-xs w-32" />
          </FieldRow>
        </>
      ),
    },
    {
      id: 'vehicle_identity',
      title: { en: '3. Vehicle Identity', th: '3. ข้อมูลรถยนต์' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'ยี่ห้อ' : 'Brand'} current={baseline.sale.vehicle.brand} dirty={!sameVal(baseline.sale.vehicle.brand, draft.sale.vehicle.brand)}>
            <Input value={draft.sale.vehicle.brand} onChange={e => setVehicle('brand', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'รุ่น' : 'Model'} current={baseline.sale.vehicle.model} dirty={!sameVal(baseline.sale.vehicle.model, draft.sale.vehicle.model)}>
            <Input value={draft.sale.vehicle.model} onChange={e => setVehicle('model', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ปี' : 'Year'} current={baseline.sale.vehicle.year} dirty={!sameVal(baseline.sale.vehicle.year, draft.sale.vehicle.year)}>
            <Input type="number" value={draft.sale.vehicle.year} onChange={e => setVehicle('year', Number(e.target.value))} className="h-7 text-xs w-28" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'สี' : 'Color'} current={baseline.sale.vehicle.color} dirty={!sameVal(baseline.sale.vehicle.color, draft.sale.vehicle.color)}>
            <Input value={draft.sale.vehicle.color} onChange={e => setVehicle('color', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
        </>
      ),
    },
    {
      id: 'vehicle_registration',
      title: { en: '4. Vehicle Registration', th: '4. การจดทะเบียน' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'ทะเบียน' : 'License Plate'} current={baseline.sale.vehicle.licensePlate} dirty={!sameVal(baseline.sale.vehicle.licensePlate, draft.sale.vehicle.licensePlate)}>
            <Input value={draft.sale.vehicle.licensePlate} onChange={e => setVehicle('licensePlate', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'จังหวัดจดทะเบียน' : 'Registration Province'} current={baseline.sale.vehicle.registrationProvince} dirty={!sameVal(baseline.sale.vehicle.registrationProvince, draft.sale.vehicle.registrationProvince)}>
            <Input value={draft.sale.vehicle.registrationProvince} onChange={e => setVehicle('registrationProvince', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'เลขตัวถัง' : 'Chassis Number'} current={baseline.sale.vehicle.chassisNumber} dirty={!sameVal(baseline.sale.vehicle.chassisNumber, draft.sale.vehicle.chassisNumber)}>
            <Input value={draft.sale.vehicle.chassisNumber} onChange={e => setVehicle('chassisNumber', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'เลขเครื่อง' : 'Engine Number'} current={baseline.sale.vehicle.engineNumber} dirty={!sameVal(baseline.sale.vehicle.engineNumber, draft.sale.vehicle.engineNumber)}>
            <Input value={draft.sale.vehicle.engineNumber} onChange={e => setVehicle('engineNumber', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'น้ำหนัก' : 'Vehicle Weight'} current={baseline.sale.vehicle.vehicleWeight} dirty={!sameVal(baseline.sale.vehicle.vehicleWeight, draft.sale.vehicle.vehicleWeight)}>
            <Input value={draft.sale.vehicle.vehicleWeight} onChange={e => setVehicle('vehicleWeight', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
        </>
      ),
    },
    {
      id: 'coverage_vmi',
      title: { en: '5. Coverage — VMI', th: '5. ความคุ้มครอง VMI' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'บริษัทประกัน' : 'Insurer'} current={vmiBase?.insurer} dirty={!sameVal(vmiBase?.insurer, vmi?.insurer)}>
            <Input value={vmi?.insurer ?? ''} onChange={e => setPolicy('vmi', { insurer: e.target.value })} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'แพ็คเกจ' : 'Package Name'} current={vmiBase?.packageName} dirty={!sameVal(vmiBase?.packageName, vmi?.packageName)}>
            <Input value={vmi?.packageName ?? ''} onChange={e => setPolicy('vmi', { packageName: e.target.value })} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ทุนประกัน (Baht)' : 'Sum Insured (Baht)'} current={vmiBase?.sumInsured} dirty={!sameVal(vmiBase?.sumInsured, vmi?.sumInsured)}>
            <Input type="number" value={vmi?.sumInsured ?? 0} onChange={e => setPolicy('vmi', { sumInsured: Number(e.target.value) })} className="h-7 text-xs w-40" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ประเภทอู่' : 'Garage Type'} current={vmiBase?.garageType} dirty={!sameVal(vmiBase?.garageType, vmi?.garageType)}>
            <Select value={vmi?.garageType ?? 'Dealership'} onValueChange={(v) => { setPolicy('vmi', { garageType: v }); setLogicField('garageType', v as 'Dealership' | 'Garage'); }}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Dealership">Dealership</SelectItem>
                <SelectItem value="Garage">Approved Garage</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'เบี้ยรวม (Baht)' : 'Premium After Tax (Baht)'} current={vmiBase?.premiumAfterTax} dirty={!sameVal(vmiBase?.premiumAfterTax, vmi?.premiumAfterTax)}>
            <Input type="number" value={vmi?.premiumAfterTax ?? 0} onChange={e => setPolicy('vmi', { premiumAfterTax: Number(e.target.value) })} className="h-7 text-xs w-40" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'วันเริ่ม' : 'Start Date'} current={baseline.ctx.coverageStartDate} dirty={!sameVal(baseline.ctx.coverageStartDate, draft.ctx.coverageStartDate)}>
            <Input type="date" value={draft.ctx.coverageStartDate} onChange={e => setCtx('coverageStartDate', e.target.value)} className="h-7 text-xs w-44" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'วันสิ้นสุด' : 'End Date'} current={baseline.ctx.coverageEndDate} dirty={!sameVal(baseline.ctx.coverageEndDate, draft.ctx.coverageEndDate)}>
            <Input type="date" value={draft.ctx.coverageEndDate} onChange={e => setCtx('coverageEndDate', e.target.value)} className="h-7 text-xs w-44" />
          </FieldRow>
        </>
      ),
    },
    {
      id: 'coverage_cmi',
      title: { en: '6. Coverage — CMI (พ.ร.บ.)', th: '6. ความคุ้มครอง พ.ร.บ.' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'เพิ่ม พ.ร.บ.' : 'Add Compulsory'} current={baseline.ctx.addCompulsory} dirty={!sameVal(baseline.ctx.addCompulsory, draft.ctx.addCompulsory)}>
            <Select value={String(draft.ctx.addCompulsory)} onValueChange={(v) => setCtx('addCompulsory', v === 'true')}>
              <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          {cmi && (
            <FieldRow label={lang === 'th' ? 'บริษัท พ.ร.บ.' : 'CMI Insurer'} current={cmiBase?.insurer} dirty={!sameVal(cmiBase?.insurer, cmi?.insurer)}>
              <Input value={cmi?.insurer ?? ''} onChange={e => setPolicy('cmi', { insurer: e.target.value })} className="h-7 text-xs" />
            </FieldRow>
          )}
          <FieldRow label={lang === 'th' ? 'วันเริ่ม พ.ร.บ.' : 'CMI Start Date'} current={baseline.ctx.compulsoryStartDate} dirty={!sameVal(baseline.ctx.compulsoryStartDate, draft.ctx.compulsoryStartDate)}>
            <Input type="date" value={draft.ctx.compulsoryStartDate} onChange={e => setCtx('compulsoryStartDate', e.target.value)} className="h-7 text-xs w-44" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'วันสิ้นสุด พ.ร.บ.' : 'CMI End Date'} current={baseline.ctx.compulsoryEndDate} dirty={!sameVal(baseline.ctx.compulsoryEndDate, draft.ctx.compulsoryEndDate)}>
            <Input type="date" value={draft.ctx.compulsoryEndDate} onChange={e => setCtx('compulsoryEndDate', e.target.value)} className="h-7 text-xs w-44" />
          </FieldRow>
        </>
      ),
    },
    {
      id: 'voluntary_insurance',
      title: { en: '7. Voluntary Insurance Matrix', th: '7. เมทริกซ์ประกันสมัครใจ' },
      body: (
        <>
          <FieldRow label="Sale Type" current={baseline.ctx.logic.saleType} dirty={!sameVal(baseline.ctx.logic.saleType, draft.ctx.logic.saleType)}>
            <Select value={draft.ctx.logic.saleType} onValueChange={(v: 'New' | 'Renewable' | 'COA') => setLogicField('saleType', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Renewable">Renewable</SelectItem>
                <SelectItem value="COA">COA</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Insurance Class" current={baseline.ctx.logic.insuranceClass} dirty={!sameVal(baseline.ctx.logic.insuranceClass, draft.ctx.logic.insuranceClass)}>
            <Select value={draft.ctx.logic.insuranceClass} onValueChange={(v) => setLogicField('insuranceClass', v as typeof draft.ctx.logic.insuranceClass)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Type1', 'Type2', 'Type3', 'Type2+', 'Type3+'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Car Type" current={baseline.ctx.logic.carType} dirty={!sameVal(baseline.ctx.logic.carType, draft.ctx.logic.carType)}>
            <Select value={draft.ctx.logic.carType} onValueChange={(v) => setLogicField('carType', v as typeof draft.ctx.logic.carType)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Normally">Normally</SelectItem>
                <SelectItem value="EV">EV</SelectItem>
                <SelectItem value="Special">Special</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </>
      ),
    },
    {
      id: 'addons',
      title: { en: '8. Add-Ons', th: '8. อุปกรณ์เสริม' },
      body: (
        <FieldRow label={lang === 'th' ? 'ประเภท Add-On' : 'Add-On Type'} current={baseline.ctx.addOns} dirty={!sameVal(baseline.ctx.addOns, draft.ctx.addOns)}>
          <Select value={draft.ctx.addOns} onValueChange={(v) => setCtx('addOns', v as typeof draft.ctx.addOns)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="alloy">Alloy Wheels</SelectItem>
              <SelectItem value="bodykit">Body Kit</SelectItem>
              <SelectItem value="headlight">Headlight</SelectItem>
              <SelectItem value="taillight">Taillight</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      ),
    },
    {
      id: 'payment_plan',
      title: { en: '9. Payment Method & Plan', th: '9. วิธีและแผนการชำระเงิน' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'ประเภทการชำระ' : 'Payment Type'} current={baseline.ctx.logic.paymentType} dirty={!sameVal(baseline.ctx.logic.paymentType, draft.ctx.logic.paymentType)}>
            <Select value={draft.ctx.logic.paymentType} onValueChange={(v) => setLogicField('paymentType', v as typeof draft.ctx.logic.paymentType)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Non-Instalment">Non-Instalment</SelectItem>
                <SelectItem value="Instalment">Instalment</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ช่องทางชำระ' : 'Payment Method'} current={baseline.ctx.logic.paymentMethodValue} dirty={!sameVal(baseline.ctx.logic.paymentMethodValue, draft.ctx.logic.paymentMethodValue)}>
            <Select value={draft.ctx.logic.paymentMethodValue} onValueChange={(v) => setLogicField('paymentMethodValue', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card_full">Credit Card (Full)</SelectItem>
                <SelectItem value="insurer_cc">Credit Card via Insurer</SelectItem>
                <SelectItem value="insurer_transfer">Transfer via Insurer</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="qr_code">QR Code</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </>
      ),
    },
    {
      id: 'instalment',
      title: { en: '10. Instalment Details', th: '10. รายละเอียดการผ่อน' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'แผนการผ่อน' : 'Instalment Plan'} current={baseline.ctx.installmentPlan} dirty={!sameVal(baseline.ctx.installmentPlan, draft.ctx.installmentPlan)}>
            <Select value={draft.ctx.installmentPlan || 'none'} onValueChange={(v) => setCtx('installmentPlan', v === 'none' ? '' : v as 'equal' | 'downpayment')}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="equal">Equal Instalments</SelectItem>
                <SelectItem value="downpayment">25% Downpayment</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'จำนวนงวด' : 'Number of Instalments'} current={baseline.ctx.installmentCount} dirty={!sameVal(baseline.ctx.installmentCount, draft.ctx.installmentCount)}>
            <Input type="number" value={draft.ctx.installmentCount} onChange={e => setCtx('installmentCount', e.target.value)} className="h-7 text-xs w-28" />
          </FieldRow>
        </>
      ),
    },
    {
      id: 'shipping_vmi',
      title: { en: '11. Shipping — VMI', th: '11. การจัดส่ง VMI' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'รูปแบบจัดส่ง' : 'Voluntary Shipping Format'} current={baseline.ctx.voluntaryShippingFormat} dirty={!sameVal(baseline.ctx.voluntaryShippingFormat, draft.ctx.voluntaryShippingFormat)}>
            <Select value={draft.ctx.voluntaryShippingFormat || 'none'} onValueChange={(v) => setCtx('voluntaryShippingFormat', v === 'none' ? '' : v as 'fairdee' | 'self' | 'epolicy')}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="fairdee">FairDee Ship</SelectItem>
                <SelectItem value="self">Self-Pickup</SelectItem>
                <SelectItem value="epolicy">e-Policy</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'แหล่งที่อยู่' : 'Address Source'} current={baseline.ctx.shippingAddressSource} dirty={!sameVal(baseline.ctx.shippingAddressSource, draft.ctx.shippingAddressSource)}>
            <Select value={draft.ctx.shippingAddressSource} onValueChange={(v) => setCtx('shippingAddressSource', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="national_id">From NID</SelectItem>
                <SelectItem value="car_reg">From Car Registration</SelectItem>
                <SelectItem value="agent">Agent Address</SelectItem>
                <SelectItem value="new">New Address</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ผู้รับ' : 'Receiver Name'} current={baseline.sale.shipping.receiverName} dirty={!sameVal(baseline.sale.shipping.receiverName, draft.sale.shipping.receiverName)}>
            <Input value={draft.sale.shipping.receiverName} onChange={e => setShipping('receiverName', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'โทรผู้รับ' : 'Receiver Phone'} current={baseline.sale.shipping.phoneNumber} dirty={!sameVal(baseline.sale.shipping.phoneNumber, draft.sale.shipping.phoneNumber)}>
            <Input value={draft.sale.shipping.phoneNumber} onChange={e => setShipping('phoneNumber', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
        </>
      ),
    },
    {
      id: 'shipping_cmi',
      title: { en: '12. Shipping — CMI', th: '12. การจัดส่ง พ.ร.บ.' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'รูปแบบจัดส่ง พ.ร.บ.' : 'CMI Shipping Format'} current={baseline.ctx.compulsoryShippingFormat} dirty={!sameVal(baseline.ctx.compulsoryShippingFormat, draft.ctx.compulsoryShippingFormat)}>
            <Select value={draft.ctx.compulsoryShippingFormat || 'none'} onValueChange={(v) => setCtx('compulsoryShippingFormat', v === 'none' ? '' : v as 'fairdee' | 'self' | 'epolicy')}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="fairdee">FairDee Ship</SelectItem>
                <SelectItem value="self">Self-Pickup</SelectItem>
                <SelectItem value="epolicy">e-Policy</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ที่อยู่เดียวกับ VMI' : 'Same as VMI'} current={baseline.ctx.cmiShippingSameAsVmi} dirty={!sameVal(baseline.ctx.cmiShippingSameAsVmi, draft.ctx.cmiShippingSameAsVmi)}>
            <Select value={String(draft.ctx.cmiShippingSameAsVmi)} onValueChange={(v) => setCtx('cmiShippingSameAsVmi', v === 'true')}>
              <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'แหล่งที่อยู่ CMI' : 'CMI Address Source'} current={baseline.ctx.cmiShippingAddressSource} dirty={!sameVal(baseline.ctx.cmiShippingAddressSource, draft.ctx.cmiShippingAddressSource)}>
            <Select value={draft.ctx.cmiShippingAddressSource} onValueChange={(v) => setCtx('cmiShippingAddressSource', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="national_id">From NID</SelectItem>
                <SelectItem value="car_reg">From Car Registration</SelectItem>
                <SelectItem value="agent">Agent Address</SelectItem>
                <SelectItem value="new">New Address</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </>
      ),
    },
    {
      id: 'policy_delivery',
      title: { en: '13. Policy Address & Delivery', th: '13. ที่อยู่บนกรมธรรม์' },
      body: (
        <FieldRow label={lang === 'th' ? 'ที่อยู่บนกรมธรรม์' : 'Policy Address Source'} current={baseline.ctx.policyAddressSource} dirty={!sameVal(baseline.ctx.policyAddressSource, draft.ctx.policyAddressSource)}>
          <Select value={draft.ctx.policyAddressSource} onValueChange={(v) => setCtx('policyAddressSource', v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nid">From NID</SelectItem>
              <SelectItem value="car_reg">From Car Registration</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      ),
    },
    {
      id: 'drivers',
      title: { en: '14. Driver Slots', th: '14. ผู้ขับขี่ระบุชื่อ' },
      body: (
        <FieldRow label={lang === 'th' ? 'จำนวนผู้ขับขี่' : 'Number of Drivers'} current={baseline.ctx.logic.driverLicenseCount} dirty={!sameVal(baseline.ctx.logic.driverLicenseCount, draft.ctx.logic.driverLicenseCount)}>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={removeDriver} disabled={(draft.ctx.logic.driverLicenseCount ?? 0) <= 0}>
              <Trash2 className="w-3 h-3" />
            </Button>
            <span className="text-xs font-semibold w-8 text-center">{draft.ctx.logic.driverLicenseCount ?? 0}</span>
            <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={addDriver}>
              <Plus className="w-3 h-3" />
            </Button>
            <span className="text-[10px] text-muted-foreground">
              {lang === 'th' ? 'ช่องใบขับขี่ต่อคน' : 'driver license slots'}
            </span>
          </div>
        </FieldRow>
      ),
    },
    {
      id: 'inspection',
      title: { en: '15. Car Inspection', th: '15. การตรวจสภาพรถ' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'วิธีการ' : 'Method'} current={baseline.ctx.logic.carInspectionMethod} dirty={!sameVal(baseline.ctx.logic.carInspectionMethod, draft.ctx.logic.carInspectionMethod)}>
            <Select value={draft.ctx.logic.carInspectionMethod || 'none'} onValueChange={(v) => setLogicField('carInspectionMethod', v === 'none' ? '' : v as 'upload_photos' | 'inspection_appointment')}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="upload_photos">Upload Photos</SelectItem>
                <SelectItem value="inspection_appointment">Inspection Appointment</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'วันนัด' : 'Appointment Date'} current={baseline.ctx.inspectionAppointmentDate} dirty={!sameVal(baseline.ctx.inspectionAppointmentDate, draft.ctx.inspectionAppointmentDate)}>
            <Input type="date" value={draft.ctx.inspectionAppointmentDate} onChange={e => setCtx('inspectionAppointmentDate', e.target.value)} className="h-7 text-xs w-44" />
          </FieldRow>
        </>
      ),
    },
    {
      id: 'kyc',
      title: { en: '16. KYC Mode', th: '16. รูปแบบ KYC' },
      body: (
        <FieldRow label={lang === 'th' ? 'รูปแบบ KYC' : 'KYC Mode'} current={baseline.ctx.kycMode} dirty={!sameVal(baseline.ctx.kycMode, draft.ctx.kycMode)}>
          <Select value={draft.ctx.kycMode || 'none'} onValueChange={(v) => setCtx('kycMode', v === 'none' ? '' : v as 'manual' | 'auto')}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              <SelectItem value="auto">Auto (e-KYC)</SelectItem>
              <SelectItem value="manual">Manual (Admin Approval)</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      ),
    },
    {
      id: 'agent',
      title: { en: '17. Agent & Assignment', th: '17. ตัวแทนและผู้รับผิดชอบ' },
      body: (
        <>
          <FieldRow label={lang === 'th' ? 'รหัสตัวแทน' : 'Agent Code'} current={baseline.sale.agentCode} dirty={!sameVal(baseline.sale.agentCode, draft.sale.agentCode)}>
            <Input value={draft.sale.agentCode} onChange={e => setSaleField('agentCode', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'ชื่อตัวแทน' : 'Agent Name'} current={baseline.sale.agent.name} dirty={!sameVal(baseline.sale.agent.name, draft.sale.agent.name)}>
            <Input value={draft.sale.agent.name} onChange={e => setAgent('name', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'Admin' : 'Admin Owner'} current={baseline.sale.assignment.admin} dirty={!sameVal(baseline.sale.assignment.admin, draft.sale.assignment.admin)}>
            <Input value={draft.sale.assignment.admin ?? ''} onChange={e => setAssignment('admin', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
          <FieldRow label={lang === 'th' ? 'จัดส่ง' : 'Delivery Owner'} current={baseline.sale.assignment.delivery} dirty={!sameVal(baseline.sale.assignment.delivery, draft.sale.assignment.delivery)}>
            <Input value={draft.sale.assignment.delivery ?? ''} onChange={e => setAssignment('delivery', e.target.value)} className="h-7 text-xs" />
          </FieldRow>
        </>
      ),
    },
  ];

  /* ============ render ============ */
  const totalDirty = diffs.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl w-[92vw] p-0 gap-0 flex flex-col max-h-[88vh]">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="w-4 h-4 text-primary" />
            <span>{lang === 'th' ? 'อัปเดตการขาย' : 'Update Sale'}</span>
            <span className="text-muted-foreground">&gt;</span>
            <span>{lang === 'th' ? 'อัปเดตข้อมูลภายใน' : 'Internal Information Update'}</span>

            {totalDirty > 0 && !reviewing && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] h-5">
                {totalDirty} {lang === 'th' ? 'การเปลี่ยนแปลง' : `change${totalDirty === 1 ? '' : 's'}`}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {reviewing
              ? (lang === 'th' ? 'ตรวจสอบการเปลี่ยนแปลงก่อนยืนยัน' : 'Review the changes before applying. Apply will write back to Step 1 & Step 2.')
              : (lang === 'th' ? 'แก้ไขข้อมูลของ Step 1 และ Step 2 หลังจาก Sale ID ออกแล้ว' : 'Edit any field from Step 1 & Step 2 after Sale ID has been issued.')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 max-h-[calc(88vh-9rem)]">
          <div className="p-4 space-y-2">
            {!reviewing ? (
              <>
                <div className="flex items-center justify-end gap-2 pb-1">
                  <Button type="button" size="sm" variant="ghost" className="text-[11px] h-6" onClick={() => setOpenSections(Object.fromEntries(sections.map(s => [s.id, true])))}>
                    {lang === 'th' ? 'เปิดทั้งหมด' : 'Expand all'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="text-[11px] h-6" onClick={() => setOpenSections({})}>
                    {lang === 'th' ? 'ปิดทั้งหมด' : 'Collapse all'}
                  </Button>
                </div>
                {sections.map(s => (
                  <Section
                    key={s.id}
                    id={s.id}
                    title={s.title}
                    language={lang}
                    open={!!openSections[s.id]}
                    onToggle={() => setOpenSections(p => ({ ...p, [s.id]: !p[s.id] }))}
                    dirtyCount={dirtyBySection[s.id] ?? 0}
                  >
                    {s.body}
                  </Section>
                ))}
              </>
            ) : (
              <div className="space-y-3">
                {totalDirty === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {lang === 'th' ? 'ไม่มีการเปลี่ยนแปลง' : 'No changes to apply.'}
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'th'
                        ? `จะอัปเดต ${totalDirty} ฟิลด์กลับไปยัง Step 1 และ Step 2:`
                        : `${totalDirty} field${totalDirty === 1 ? '' : 's'} will be written back to Step 1 & Step 2:`}
                    </p>
                    <div className="border border-border rounded-lg divide-y divide-border">
                      {diffs.map((d, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] items-center">
                          <div className="col-span-3 font-medium truncate" title={d.label}>{d.label}</div>
                          <div className="col-span-4 text-muted-foreground line-through truncate" title={fmt(d.from)}>{fmt(d.from)}</div>
                          <div className="col-span-1 flex justify-center text-muted-foreground"><ArrowRight className="w-3 h-3" /></div>
                          <div className="col-span-4 font-semibold text-foreground truncate" title={fmt(d.to)}>{fmt(d.to)}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-3 border-t border-border shrink-0 flex-row items-center justify-between gap-2">
          <div className="text-[11px] text-muted-foreground">
            {totalDirty > 0
              ? `${totalDirty} ${lang === 'th' ? 'ฟิลด์ที่แก้ไข' : `change${totalDirty === 1 ? '' : 's'} pending`}`
              : (lang === 'th' ? 'ยังไม่มีการเปลี่ยนแปลง' : 'No changes yet')}
          </div>
          <div className="flex items-center gap-2">
            {reviewing ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setReviewing(false)}>
                  {lang === 'th' ? 'กลับไปแก้ไข' : 'Back to edit'}
                </Button>
                <Button type="button" size="sm" onClick={handleApply} disabled={totalDirty === 0}>
                  {lang === 'th' ? 'ยืนยันและบันทึก' : 'Apply changes'}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Button>
                <Button type="button" size="sm" onClick={() => setReviewing(true)} disabled={totalDirty === 0}>
                  {lang === 'th' ? 'ตรวจสอบ' : 'Review changes'}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
