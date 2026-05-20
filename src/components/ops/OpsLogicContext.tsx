import React from 'react';
import type { LogicControllerState } from './LogicControllerSection';
import type { SaleDetail } from '@/data/mockSaleDetail';

export type ShippingFormat = 'fairdee' | 'self' | 'epolicy' | '';
export type KycMode = 'manual' | 'auto' | '';
export type InstallmentPlan = 'equal' | 'downpayment' | '';
export type AddOnType = 'none' | 'alloy' | 'bodykit' | 'headlight' | 'taillight';

interface OpsLogicContextValue {
  logic: LogicControllerState;
  setLogic: React.Dispatch<React.SetStateAction<LogicControllerState>>;
  reset: () => void;
  // Extra UI state driven by the form / scenarios but not part of the doc-rule engine.
  coverageStartDate: string;
  setCoverageStartDate: (v: string) => void;
  coverageEndDate: string;
  setCoverageEndDate: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  addCompulsory: boolean;
  setAddCompulsory: (v: boolean) => void;
  compulsoryStartDate: string;
  setCompulsoryStartDate: (v: string) => void;
  compulsoryEndDate: string;
  setCompulsoryEndDate: (v: string) => void;
  shippingAddressSource: string;
  setShippingAddressSource: (v: string) => void;
  cmiShippingAddressSource: string;
  setCmiShippingAddressSource: (v: string) => void;
  cmiShippingSameAsVmi: boolean;
  setCmiShippingSameAsVmi: (v: boolean) => void;
  policyAddressSource: string;
  setPolicyAddressSource: (v: string) => void;
  // New fields ported from sibling Step 1
  addOns: AddOnType;
  setAddOns: (v: AddOnType) => void;
  kycMode: KycMode;
  setKycMode: (v: KycMode) => void;
  installmentPlan: InstallmentPlan;
  setInstallmentPlan: (v: InstallmentPlan) => void;
  installmentCount: string;
  setInstallmentCount: (v: string) => void;
  voluntaryShippingFormat: ShippingFormat;
  setVoluntaryShippingFormat: (v: ShippingFormat) => void;
  compulsoryShippingFormat: ShippingFormat;
  setCompulsoryShippingFormat: (v: ShippingFormat) => void;
  inspectionAppointmentDate: string;
  setInspectionAppointmentDate: (v: string) => void;
  // Uploaded docs map (fieldId -> count) — shared so Verify tab can flag missing items
  fieldDocCounts: Record<string, number>;
  setFieldDocCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  // Read-only lock applied once Step 2 is completed (Sale ID issued)
  locked: boolean;
  setLocked: (v: boolean) => void;
}

const OpsLogicContext = React.createContext<OpsLogicContextValue | null>(null);

const seedFromSale = (sale: SaleDetail): LogicControllerState => ({
  saleType: sale.saleType ?? 'New',
  insuranceClass: sale.insuranceClass ?? 'Type3+',
  paymentType: sale.paymentType ?? 'Non-Instalment',
  carType: sale.carType ?? 'Normally',
  customerType: sale.customer.customerType,
  paymentMethodValue: sale.paymentMethodValue ?? '',
  driverLicenseCount: sale.driverLicenseCount ?? 0,
  carInspectionMethod: sale.carInspectionMethod ?? '',
  garageType: (sale.policies.find(p => p.kind === 'vmi')?.garageType as 'Dealership' | 'Garage') || 'Dealership',
});

const addOneYear = (yyyyMmDd: string): string => {
  if (!yyyyMmDd) return '';
  const d = new Date(yyyyMmDd + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export function OpsLogicProvider({ sale, children }: { sale: SaleDetail; children: React.ReactNode }) {
  const initial = React.useMemo(() => seedFromSale(sale), [sale]);
  const [logic, setLogic] = React.useState<LogicControllerState>(initial);

  // Derive a default ISO date from sale.policies[0].policyStartDate (DD/MM/YYYY → YYYY-MM-DD)
  const initialStart = React.useMemo(() => {
    const raw = sale.policies[0]?.policyStartDate;
    if (!raw) return '';
    const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
  }, [sale]);

  const [coverageStartDate, setCoverageStartDate] = React.useState(initialStart);
  const [coverageEndDate, setCoverageEndDateRaw] = React.useState(addOneYear(initialStart));
  const [phone, setPhone] = React.useState(sale.customer.phoneNumber.replace(/\D/g, ''));
  const [addCompulsory, setAddCompulsory] = React.useState(sale.hasCompulsoryInsurance);
  const [compulsoryStartDate, setCompulsoryStartDateRaw] = React.useState(initialStart);
  const [compulsoryEndDate, setCompulsoryEndDateRaw] = React.useState(addOneYear(initialStart));
  const [shippingAddressSource, setShippingAddressSource] = React.useState('national_id');
  const [cmiShippingAddressSource, setCmiShippingAddressSource] = React.useState('national_id');
  const [cmiShippingSameAsVmi, setCmiShippingSameAsVmi] = React.useState(true);
  const [policyAddressSource, setPolicyAddressSource] = React.useState('nid');

  // Newly ported state
  const [addOns, setAddOns] = React.useState<AddOnType>('none');
  const [kycMode, setKycMode] = React.useState<KycMode>('');
  const [installmentPlan, setInstallmentPlan] = React.useState<InstallmentPlan>('');
  const [installmentCount, setInstallmentCount] = React.useState<string>('');
  const [voluntaryShippingFormat, setVoluntaryShippingFormat] = React.useState<ShippingFormat>('');
  const [compulsoryShippingFormat, setCompulsoryShippingFormat] = React.useState<ShippingFormat>('');
  const [inspectionAppointmentDate, setInspectionAppointmentDate] = React.useState<string>('');
  const [fieldDocCounts, setFieldDocCounts] = React.useState<Record<string, number>>({});
  const [locked, setLocked] = React.useState(false);

  // Auto-extend end-dates when start changes (only if end was the prior auto-default or empty)
  const prevAutoEnd = React.useRef(addOneYear(initialStart));
  const setCoverageStartDateWithEnd = (v: string) => {
    setCoverageStartDate(v);
    setCoverageEndDateRaw(prev => (!prev || prev === prevAutoEnd.current) ? addOneYear(v) : prev);
    prevAutoEnd.current = addOneYear(v);
  };
  const setCoverageEndDate = (v: string) => setCoverageEndDateRaw(v);

  const prevAutoCmiEnd = React.useRef(addOneYear(initialStart));
  const setCompulsoryStartDate = (v: string) => {
    setCompulsoryStartDateRaw(v);
    setCompulsoryEndDateRaw(prev => (!prev || prev === prevAutoCmiEnd.current) ? addOneYear(v) : prev);
    prevAutoCmiEnd.current = addOneYear(v);
  };
  const setCompulsoryEndDate = (v: string) => setCompulsoryEndDateRaw(v);

  const reset = React.useCallback(() => setLogic(seedFromSale(sale)), [sale]);

  const value: OpsLogicContextValue = {
    logic,
    setLogic,
    reset,
    coverageStartDate,
    setCoverageStartDate: setCoverageStartDateWithEnd,
    coverageEndDate,
    setCoverageEndDate,
    phone,
    setPhone,
    addCompulsory,
    setAddCompulsory,
    compulsoryStartDate,
    setCompulsoryStartDate,
    compulsoryEndDate,
    setCompulsoryEndDate,
    shippingAddressSource,
    setShippingAddressSource,
    cmiShippingAddressSource,
    setCmiShippingAddressSource,
    cmiShippingSameAsVmi,
    setCmiShippingSameAsVmi,
    policyAddressSource,
    setPolicyAddressSource,
    addOns,
    setAddOns,
    kycMode,
    setKycMode,
    installmentPlan,
    setInstallmentPlan,
    installmentCount,
    setInstallmentCount,
    voluntaryShippingFormat,
    setVoluntaryShippingFormat,
    compulsoryShippingFormat,
    setCompulsoryShippingFormat,
    inspectionAppointmentDate,
    setInspectionAppointmentDate,
    fieldDocCounts,
    setFieldDocCounts,
  };

  return <OpsLogicContext.Provider value={value}>{children}</OpsLogicContext.Provider>;
}

export function useOpsLogic() {
  const ctx = React.useContext(OpsLogicContext);
  if (!ctx) throw new Error('useOpsLogic must be used within OpsLogicProvider');
  return ctx;
}
