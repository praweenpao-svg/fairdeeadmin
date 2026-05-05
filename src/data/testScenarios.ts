// Prefilled QA test scenarios for the OPS Dashboard Logic Controller.
// Ported from sibling project "Ops dashboard" (90b06ed8) — adapted to SaleDetail keys.
import type { SaleType, InsuranceClass, PaymentType, CarType } from './documentRequirements';

export interface LogicControllerOverrides {
  saleType?: SaleType;
  insuranceClass?: InsuranceClass;
  paymentType?: PaymentType;
  carType?: CarType;
  customerType?: 'individual' | 'corporation';
  paymentMethodValue?: string;
  driverLicenseCount?: number;
  carInspectionMethod?: 'upload_photos' | 'inspection_appointment' | '';
  coverageStartDate?: string; // YYYY-MM-DD; 'today' is interpreted at runtime
  kycMode?: 'auto' | 'manual' | '';
  installmentPlan?: 'equal' | '';
  installmentCount?: string;
}

export interface TestScenario {
  id: string;
  labelTh: string;
  labelEn: string;
  descTh: string;
  descEn: string;
  data: LogicControllerOverrides;
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'new_type1_full_individual',
    labelTh: 'งานใหม่ ชั้น1 จ่ายเต็ม',
    labelEn: 'New Type1 Full Payment',
    descTh: 'บุคคลธรรมดา, อัปโหลดรูปตรวจสภาพรถ',
    descEn: 'Individual, Upload inspection photos',
    data: {
      saleType: 'New', insuranceClass: 'Type1', paymentType: 'Non-Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'bank_account_full', carInspectionMethod: 'upload_photos',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'new_type2plus_installment_cc',
    labelTh: 'งานใหม่ ชั้น2+ ผ่อน บัตรเครดิต',
    labelEn: 'New Type2+ Instalment CC',
    descTh: 'ผ่อนชำระ บัตรเครดิตออนไลน์, Auto KYC',
    descEn: 'Instalment via Credit Card, Auto KYC',
    data: {
      saleType: 'New', insuranceClass: 'Type2+', paymentType: 'Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'credit_card_installment', carInspectionMethod: '',
      kycMode: 'auto', installmentPlan: 'equal', installmentCount: '4',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'renewal_type1_full',
    labelTh: 'ต่ออายุ ชั้น1 จ่ายเต็ม',
    labelEn: 'Renewal Type1 Full',
    descTh: 'ต่ออายุ, มีใบเตือนต่ออายุ',
    descEn: 'Renewal with prior policy notice',
    data: {
      saleType: 'Renewable', insuranceClass: 'Type1', paymentType: 'Non-Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'bank_account_full', carInspectionMethod: 'upload_photos',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'coa_type1_full',
    labelTh: 'โอนโค้ด ชั้น1 จ่ายเต็ม',
    labelEn: 'COA Type1 Full',
    descTh: 'โอนโค้ด, มีแบบฟอร์ม COA',
    descEn: 'COA transfer with COA forms',
    data: {
      saleType: 'COA', insuranceClass: 'Type1', paymentType: 'Non-Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'bank_account_full', carInspectionMethod: 'upload_photos',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'new_type1_corporation',
    labelTh: 'งานใหม่ ชั้น1 นิติบุคคล',
    labelEn: 'New Type1 Corporation',
    descTh: 'นิติบุคคล, ต้องมีหนังสือรับรองบริษัท',
    descEn: 'Corporation, requires business registration',
    data: {
      saleType: 'New', insuranceClass: 'Type1', paymentType: 'Non-Instalment',
      carType: 'Normally', customerType: 'corporation',
      paymentMethodValue: 'bank_account_full', carInspectionMethod: 'upload_photos',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'new_type2plus_installment_manual_kyc',
    labelTh: 'งานใหม่ ชั้น2+ ผ่อน Manual KYC',
    labelEn: 'New Type2+ Instalment Manual KYC',
    descTh: 'ผ่อนชำระ QR Code, Manual KYC',
    descEn: 'Instalment QR Code, Manual KYC approval needed',
    data: {
      saleType: 'New', insuranceClass: 'Type2+', paymentType: 'Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'qr_code_installment', carInspectionMethod: '',
      kycMode: 'manual', installmentPlan: 'equal', installmentCount: '6',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'new_type2plus_insurer_cc',
    labelTh: 'งานใหม่ ชั้น2+ บัตรเครดิตผ่านประกัน',
    labelEn: 'New Type2+ Credit Card via Insurer',
    descTh: 'ต้องมี Payment Proof = Credit Card Form',
    descEn: 'Requires Payment Proof = Credit Card Form',
    data: {
      saleType: 'New', insuranceClass: 'Type2+', paymentType: 'Non-Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'insurer_cc', carInspectionMethod: '',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'new_type2plus_insurer_transfer',
    labelTh: 'งานใหม่ ชั้น2+ โอนผ่านประกัน',
    labelEn: 'New Type2+ Transfer via Insurer',
    descTh: 'ต้องมี Payment Proof = Payment Slip',
    descEn: 'Requires Payment Proof = Payment Slip',
    data: {
      saleType: 'New', insuranceClass: 'Type2+', paymentType: 'Non-Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'insurer_transfer', carInspectionMethod: '',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'renewal_type3_named_drivers',
    labelTh: 'ต่ออายุ ชั้น3 ระบุผู้ขับขี่ 3 คน',
    labelEn: 'Renewal Type3 + 3 Named Drivers',
    descTh: 'ต่ออายุ, มีใบขับขี่ 3 ฉบับ',
    descEn: 'Renewal with 3 driver licenses required',
    data: {
      saleType: 'Renewable', insuranceClass: 'Type3', paymentType: 'Non-Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'bank_account_full', carInspectionMethod: '',
      driverLicenseCount: 3,
    },
  },
  {
    id: 'new_type1_today_start',
    labelTh: '⚠️ งานใหม่ ชั้น1 วันนี้',
    labelEn: '⚠️ New Type1 Start Today',
    descTh: 'วันเริ่มคุ้มครองวันนี้ — เอกสารบังคับเฉพาะ บัตร/ทะเบียน',
    descEn: 'Start date today — only formal docs required',
    data: {
      saleType: 'New', insuranceClass: 'Type1', paymentType: 'Non-Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'bank_account_full', carInspectionMethod: 'upload_photos',
      coverageStartDate: 'today',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'new_type1_ev',
    labelTh: 'งานใหม่ ชั้น1 รถ EV',
    labelEn: 'New Type1 EV',
    descTh: 'รถ EV (รหัสรถ E11) — ใช้กฎเอกสารแบบรถทั่วไป',
    descEn: 'EV vehicle (vehicle code E11) — standard document rules',
    data: {
      saleType: 'New', insuranceClass: 'Type1', paymentType: 'Non-Instalment',
      carType: 'EV', customerType: 'individual',
      paymentMethodValue: 'bank_account_full', carInspectionMethod: 'upload_photos',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'new_type1_highsum_special',
    labelTh: 'งานใหม่ ชั้น1 High Sum (Special)',
    labelEn: 'New Type1 High Sum (Special)',
    descTh: 'รถทุนประกันสูง — ต้องมี High Sum Approval Form (BKI/MTI)',
    descEn: 'High sum insured — requires High Sum Approval Form (BKI/MTI)',
    data: {
      saleType: 'New', insuranceClass: 'Type1', paymentType: 'Non-Instalment',
      carType: 'Special', customerType: 'individual',
      paymentMethodValue: 'bank_account_full', carInspectionMethod: 'upload_photos',
      driverLicenseCount: 0,
    },
  },
  {
    id: 'coa_type2plus_installment',
    labelTh: 'โอนโค้ด ชั้น2+ ผ่อนชำระ',
    labelEn: 'COA Type2+ Instalment',
    descTh: 'โอนโค้ด + ผ่อนชำระ, ต้องมี COA forms + NID signed',
    descEn: 'COA + Instalment, needs COA forms + signed NID',
    data: {
      saleType: 'COA', insuranceClass: 'Type2+', paymentType: 'Instalment',
      carType: 'Normally', customerType: 'individual',
      paymentMethodValue: 'bank_account_installment', carInspectionMethod: '',
      kycMode: 'auto', installmentPlan: 'equal', installmentCount: '4',
      driverLicenseCount: 0,
    },
  },
];
