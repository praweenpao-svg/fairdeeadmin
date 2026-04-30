// Mock data for OPS Dashboard Sales Detail view
export interface CoverageDetail {
  insurer: string;
  insurerLogo?: string;
  insuranceClass: string;
  coverageType: string;
  sumInsured: number;
  annualPremium: number;
  // Full details
  ownDamage?: number;
  deductible?: number;
  thirdPartyBodilyInjury?: string;
  thirdPartyPropertyDamage?: string;
  personalAccident?: string;
  medicalExpense?: string;
  accessoriesCover?: string;
  floodCover?: string;
  bailBond?: string;
  keyExclusions?: string;
  addOns?: string[];
  policyPeriod?: string;
  insurerProductCode?: string;
}

export interface SaleCustomer {
  customerType: 'individual' | 'corporation';
  title: string;
  firstName: string;
  lastName: string;
  idType: string;
  nationalId: string;
  birthday: string;
  gender: string;
  addressLine: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  phoneNumber: string;
}

export interface SaleVehicle {
  licenseType: string;
  licensePlate: string;
  registrationProvince: string;
  chassisNumber: string;
  engineNumber: string;
  vehicleWeight: string;
  color: string;
  driverSpec: string;
  beneficiaryType: string;
  vehicleCode: string;
  brand: string;
  model: string;
  year: number;
}

export interface SalePolicy {
  kind: 'vmi' | 'cmi';
  packageName: string;
  insurer: string;
  sumInsured: number;
  garageType: string;
  installmentType: string;
  affiliateCommission: number;
  premiumAfterTax: number;
  status: string;
  policyNumber?: string;
  policyStartDate?: string;
  policyEndDate?: string;
  deliveryMethod?: string;
  trackingNumber?: string;
  policyFileUrl?: string;
  coverage: CoverageDetail;
}

export interface SaleShipping {
  receiverType: 'policy_holder' | 'agent' | 'e_policy' | 'new_address';
  receiverName: string;
  addressLine: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  phoneNumber: string;
}

export interface SaleAssignment {
  rf?: string;
  sc?: string;
  de?: string;
  admin?: string;
  delivery?: string;
}

export interface SaleAddress {
  addressLine: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
}

export interface SaleAgent {
  name: string;
  nameTh: string;
  level: number;
  phone: string;
  code: string;
  membershipDuration: string;
  sumInsured: number;
  sumInsuredFromOriginal: string;
  originalSumInsured: string;
  bestPremium: boolean;
  commissionDetail: string;
  /** Agent's mailing address — used by 'Agent' shipping option to pre-fill. */
  address?: SaleAddress;
}

// Sale-level matrix drivers — single source of truth for document requirements.
// VMI is always present; CMI piggybacks (no per-policy doc divergence).
export type SaleTypeKey = 'New' | 'Renewable' | 'COA';
export type InsuranceClassKey = 'Type1' | 'Type2' | 'Type2+' | 'Type3' | 'Type3+';
export type PaymentTypeKey = 'Non-Instalment' | 'Instalment';
export type CarTypeKey = 'Normally' | 'EV' | 'Special';

export interface SaleDetail {
  id: string;
  qqId: string;
  agentCode: string;
  typeOfSale: string;
  paymentMethod: string;
  paymentStatus: 'unpaid' | 'paid' | 'partial' | 'pending';
  customer: SaleCustomer;
  vehicle: SaleVehicle;
  policies: SalePolicy[];
  shipping: SaleShipping;
  assignment: SaleAssignment;
  agent: SaleAgent;
  opsStep1Complete: boolean;
  opsStep2Complete: boolean;
  hasCompulsoryInsurance: boolean;
  forCommercialVehicle: boolean;
  createdAt: string;
  // Sale-level matrix drivers (drive doc requirements; VMI-led, CMI inherits)
  saleType?: SaleTypeKey;
  insuranceClass?: InsuranceClassKey;
  paymentType?: PaymentTypeKey;
  carType?: CarTypeKey;
  paymentMethodValue?: string; // e.g. 'insurer_cc', 'credit_card_full'
  driverLicenseCount?: number;
  carInspectionMethod?: 'upload_photos' | 'inspection_appointment' | '';
}


export const mockSaleDetail: SaleDetail = {
  id: 'sale-001',
  qqId: '112233',
  agentCode: 'FM-5369',
  typeOfSale: 'งานใหม่',
  paymentMethod: 'QR Code (Full Payment)',
  paymentStatus: 'pending',
  customer: {
    customerType: 'individual',
    title: 'นาย',
    firstName: 'Praween',
    lastName: 'Imchokchai',
    idType: 'National Id',
    nationalId: '1234567890123',
    birthday: '30/03/1958',
    gender: 'M',
    addressLine: '111 หมู่ที่ 1 ปฐมนท : ก.สุนวิก',
    province: 'กรุงเทพมหานคร',
    district: 'บางขุนเทียน',
    subDistrict: 'แสมดำ',
    postalCode: '10150',
    phoneNumber: '081-234-5678',
  },
  vehicle: {
    licenseType: 'Registered',
    licensePlate: '43589',
    registrationProvince: 'กรุงเทพมหานคร',
    chassisNumber: 'MRHGK810200012345',
    engineNumber: '1NZ-FE12345',
    vehicleWeight: '1300 กก.',
    color: 'ขาว',
    driverSpec: 'Not specified',
    beneficiaryType: 'Legal Owner',
    vehicleCode: '110 - รถยนต์ส่วนบุ',
    brand: 'Toyota',
    model: 'Vios',
    year: 2023,
  },
  policies: [
    {
      kind: 'vmi',
      packageName: 'เมืองไทย 3+ Care',
      insurer: 'Muang Thai',
      sumInsured: 350000,
      garageType: 'Dealership',
      installmentType: '',
      affiliateCommission: 2000,
      premiumAfterTax: 10000,
      status: 'pending_review',
      policyStartDate: '01/04/2026',
      policyEndDate: '01/04/2027',
      coverage: {
        insurer: 'Muang Thai Insurance',
        insuranceClass: '1',
        coverageType: 'Comprehensive',
        sumInsured: 350000,
        annualPremium: 10000,
        ownDamage: 350000,
        deductible: 3000,
        thirdPartyBodilyInjury: '500,000/person, 10,000,000/incident',
        thirdPartyPropertyDamage: '1,000,000/incident',
        personalAccident: '100,000/person × 7 seats',
        medicalExpense: '100,000/person',
        accessoriesCover: 'Included up to 20,000 THB',
        floodCover: 'Not included',
        bailBond: 'Included up to 200,000 THB',
        keyExclusions: 'Racing, intentional damage, driving under influence, use as public transport. Excludes damage from nuclear/chemical/biological weapons.',
        addOns: ['Roadside Assistance', 'Windshield Cover', 'Personal Belongings 30,000 THB'],
        policyPeriod: '01/04/2026 → 01/04/2027',
        insurerProductCode: 'MTI-VMI-3P-CARE-2026',
      },
    },
    {
      kind: 'cmi',
      packageName: 'พ.ร.บ. รถยนต์',
      insurer: 'Muang Thai',
      sumInsured: 0,
      garageType: '-',
      installmentType: '',
      affiliateCommission: 129.04,
      premiumAfterTax: 645.21,
      status: 'pending_payment',
      policyStartDate: '01/04/2026',
      policyEndDate: '01/04/2027',
      coverage: {
        insurer: 'Muang Thai Insurance',
        insuranceClass: 'พ.ร.บ.',
        coverageType: 'Compulsory Motor Insurance',
        sumInsured: 0,
        annualPremium: 645.21,
        thirdPartyBodilyInjury: '80,000 - 300,000/person (as per law)',
        thirdPartyPropertyDamage: 'N/A (covered under VMI)',
        personalAccident: '35,000 - 300,000/person (as per law)',
        medicalExpense: '80,000/person',
        keyExclusions: 'Intentional acts, driving without valid license, vehicle used in crime.',
        policyPeriod: '01/04/2026 → 01/04/2027',
        insurerProductCode: 'MTI-CMI-STD-2026',
      },
    },
  ],
  shipping: {
    receiverType: 'policy_holder',
    receiverName: 'Praween Imchokchai',
    addressLine: '111 หมู่ที่ 1 ปฐมนท : ก.สุนวิก',
    province: 'กรุงเทพมหานคร',
    district: 'บางขุนเทียน',
    subDistrict: 'แสมดำ',
    postalCode: '10150',
    phoneNumber: '081-234-5678',
  },
  assignment: {
    rf: 'Ricky',
    sc: 'Lisa',
    de: 'Pao',
    admin: 'Rachel',
    delivery: 'Dao',
  },
  agent: {
    name: 'Praween Imchokchai',
    nameTh: 'ประวีณ อิ่มโชคชัย',
    level: 3,
    phone: '865044433',
    code: 'FM-72482',
    membershipDuration: '1 ปี',
    sumInsured: 500000,
    sumInsuredFromOriginal: '- บาท',
    originalSumInsured: '-',
    bestPremium: false,
    commissionDetail: 'จ่ายเบี้ยแบบหักค่าคอม',
  },
  opsStep1Complete: true,
  opsStep2Complete: false,
  hasCompulsoryInsurance: true,
  forCommercialVehicle: false,
  createdAt: '20/03/2026',
  // Sale-level matrix drivers
  saleType: 'New',
  insuranceClass: 'Type3+',
  paymentType: 'Non-Instalment',
  carType: 'Normally',
  paymentMethodValue: 'qr_code_full',
  driverLicenseCount: 0,
  carInspectionMethod: '',
};
