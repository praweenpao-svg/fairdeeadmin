// Document requirements matrix derived from fairdee_sale_report_master.json v3.0
// Single source of truth for sale-level attachment fields.
// VMI is always present; CMI piggybacks on the same matrix (driven by VMI insuranceClass).

export type DocumentCategory = 'required_base' | 'conditional' | 'sale_type_specific' | 'optional_if_available';

export type FieldType = 'SHARED' | 'SEPARATE';

export interface AttachmentFieldDef {
  th: string;
  en: string;
  isOcr: boolean;
  group: string;
  fieldType: FieldType;
  accepts?: { nameEn: string; nameTh: string; when: string }[];
  subField?: string;
  subFieldValues?: string[];
}

export const DOCUMENT_FIELDS: Record<string, AttachmentFieldDef> = {
  // A. Identity & Customer Verification
  identity_document: {
    th: 'เอกสารประจำตัว', en: 'Identity Document', isOcr: true,
    group: 'A. Identity & Customer Verification', fieldType: 'SHARED',
    accepts: [
      { nameEn: 'NID', nameTh: 'บัตรประจำตัวประชาชน', when: 'Thai customer' },
      { nameEn: 'Passport / Other NID', nameTh: 'หนังสือเดินทาง / เอกสารประจำตัวอื่น', when: 'Foreigner customer' },
    ],
    subField: 'identity_document_type',
    subFieldValues: ['NID', 'Passport', 'Other'],
  },
  identity_document_signed: {
    th: 'บัตรประชาชนพร้อมลายเซ็น (สำหรับผ่อนชำระ)',
    en: 'NID with Signed (Instalment Copy)',
    isOcr: false, group: 'A. Identity & Customer Verification', fieldType: 'SEPARATE',
  },
  customer_selfie: {
    th: 'เซลฟี่ลูกค้าพร้อมบัตรผ่อน',
    en: 'Customer Selfie with Instalment Card',
    isOcr: false, group: 'A. Identity & Customer Verification', fieldType: 'SEPARATE',
  },

  // B. Vehicle & Registration
  vehicle_registration: {
    th: 'รายการจดทะเบียน', en: 'Car Registration', isOcr: true,
    group: 'B. Vehicle & Registration', fieldType: 'SEPARATE',
  },
  existing_policy_document: {
    th: 'ตารางกรมธรรม์ประกันภัยรถยนต์', en: 'Old / Existing Policy Document',
    isOcr: false, group: 'B. Vehicle & Registration', fieldType: 'SEPARATE',
  },
  driver_license: {
    th: 'ใบอนุญาตขับรถยนต์ส่วนบุคคล', en: 'Driver License',
    isOcr: false, group: 'B. Vehicle & Registration', fieldType: 'SEPARATE',
  },

  // C. Payment Documents
  identity_document_signed_dup: {
    // placeholder so order keeps groups distinct; not used
    th: '', en: '', isOcr: false, group: '', fieldType: 'SEPARATE',
  },
  credit_card_authorization: {
    th: 'หนังสือขอให้หักบัตรเครดิต', en: 'Credit Card Debit Authorization Form',
    isOcr: false, group: 'C. Payment Documents', fieldType: 'SEPARATE',
  },
  payment_proof: {
    th: 'หลักฐานการชำระเงิน', en: 'Payment Proof',
    isOcr: false, group: 'C. Payment Documents', fieldType: 'SEPARATE',
  },

  // D. Customer Type
  business_registration_certificate: {
    th: 'หนังสือรับรองบริษัท', en: 'Certificate of Business Registration',
    isOcr: false, group: 'D. Customer Type', fieldType: 'SEPARATE',
  },

  // E. Vehicle Inspection
  car_inspection_photos: {
    th: 'ภาพถ่ายตรวจสภาพรถ 8 มุม พร้อมวันที่',
    en: 'Car Inspection Photos (8 Angles + Timestamp)',
    isOcr: false, group: 'E. Vehicle Inspection', fieldType: 'SEPARATE',
  },
  car_inspection_form: {
    th: 'ใบตรวจสภาพรถ', en: 'Car Inspection Form',
    isOcr: false, group: 'E. Vehicle Inspection', fieldType: 'SEPARATE',
  },
  high_sum_approval_form: {
    th: 'แบบฟอร์มขออนุมัติทำประกันภัย สำหรับโครงการรถยนต์ High Sum',
    en: 'High Sum Insured Approval Form',
    isOcr: false, group: 'E. Vehicle Inspection', fieldType: 'SEPARATE',
  },

  // F. Prior Policy & COA Transfer
  prior_policy_notice: {
    th: 'ใบเตือนต่ออายุ / ใบเตือนจากบริษัทประกันอื่น', en: 'Prior Policy Notice',
    isOcr: false, group: 'F. Prior Policy & COA Transfer', fieldType: 'SHARED',
    accepts: [
      { nameEn: 'Notice Document', nameTh: 'ใบเตือนต่ออายุ', when: 'Renewal sale type' },
      { nameEn: 'Notice Document from another Broker', nameTh: 'ใบเตือนต่ออายุกรมธรรม์ประกันภัยรถยนต์', when: 'COA sale type' },
    ],
    subField: 'prior_policy_notice_source',
    subFieldValues: ['FairDee', 'Other Broker'],
  },
  coa_request_form: {
    th: 'แบบฟอร์มขอเปลี่ยนตัวแทน (COA)', en: 'COA Request Form',
    isOcr: false, group: 'F. Prior Policy & COA Transfer', fieldType: 'SEPARATE',
  },
  coa_pricelist: {
    th: 'ใบเสนอราคาจากบริษัทประกัน หรือ เบี้ยดิบ', en: 'COA Pricelist / Insurer Quote or Raw Premium',
    isOcr: false, group: 'F. Prior Policy & COA Transfer', fieldType: 'SEPARATE',
  },

  // G. Optional / Special Case
  sum_insured_reference: {
    th: 'เอกสารอ้างอิงทุนประกัน', en: 'Sum Insured Reference',
    isOcr: false, group: 'G. Optional / Special Case', fieldType: 'SEPARATE',
  },
  bill_of_sale: {
    th: 'สัญญาซื้อขาย', en: 'Bill of Sale',
    isOcr: false, group: 'G. Optional / Special Case', fieldType: 'SEPARATE',
  },
  power_of_attorney: {
    th: 'แนบคำขอโอนและรับโอน', en: 'Power of Attorney (Registration Transfer)',
    isOcr: false, group: 'G. Optional / Special Case', fieldType: 'SEPARATE',
  },
  name_change_certificate: {
    th: 'หนังสือสำคัญแสดงการเปลี่ยนชื่อตัว', en: 'Name Change Certificate',
    isOcr: false, group: 'G. Optional / Special Case', fieldType: 'SEPARATE',
  },
  administrator_document: {
    th: 'ขอรับโอนมรดกรถยนต์', en: 'Administrator Document (Inheritance / Law)',
    isOcr: false, group: 'G. Optional / Special Case', fieldType: 'SEPARATE',
  },
  death_certificate: {
    th: 'มรณบัตร', en: 'Death Certificate',
    isOcr: false, group: 'G. Optional / Special Case', fieldType: 'SEPARATE',
  },
  relationship_form: {
    th: 'แบบฟอร์มแสดงความสัมพันธ์', en: 'Relationship Form',
    isOcr: false, group: 'G. Optional / Special Case', fieldType: 'SEPARATE',
  },
};

export type SaleType = 'New' | 'Renewable' | 'COA';
export type InsuranceClass = 'Type1' | 'Type2' | 'Type2+' | 'Type3' | 'Type3+';
export type PaymentType = 'Non-Instalment' | 'Instalment';
export type CarType = 'Normally' | 'EV' | 'Special';

export interface DocumentGroup {
  fieldId: string;
  required: boolean;
  isOcr: boolean;
  category: DocumentCategory;
  conditionNote?: string;
  requiredCount?: number;
}

// Fields that remain mandatory even when start date = today
export const FORMAL_REQUIRED_FIELDS = ['identity_document', 'vehicle_registration'];

/**
 * Get required document groups based on current sale parameters.
 * Driven by VMI insuranceClass; CMI inherits.
 */
export function getRequiredDocuments(
  saleType: SaleType,
  insuranceClass: InsuranceClass,
  paymentType: PaymentType,
  carType: CarType,
  customerType: 'individual' | 'corporation' = 'individual',
  paymentMethod: string = '',
  driverLicenseCount: number = 0,
  carInspectionMethod: string = '',
): DocumentGroup[] {
  const docs: DocumentGroup[] = [];

  // A. Identity
  docs.push({ fieldId: 'identity_document', required: true, isOcr: true, category: 'required_base' });
  if (paymentType === 'Instalment') {
    docs.push({ fieldId: 'identity_document_signed', required: true, isOcr: false, category: 'required_base', conditionNote: 'Instalment payment' });
    if (['Type1', 'Type2', 'Type2+'].includes(insuranceClass)) {
      docs.push({ fieldId: 'customer_selfie', required: true, isOcr: false, category: 'required_base', conditionNote: 'Instalment + Type1/2/2+' });
    }
  }

  // B. Vehicle
  docs.push({ fieldId: 'vehicle_registration', required: true, isOcr: true, category: 'required_base' });
  if (driverLicenseCount > 0) {
    docs.push({ fieldId: 'driver_license', required: true, isOcr: false, category: 'conditional', conditionNote: `Named driver designated (${driverLicenseCount})`, requiredCount: driverLicenseCount });
  }

  // C. Payment
  if (paymentMethod === 'insurer_cc' || paymentMethod === 'insurer_transfer') {
    docs.push({ fieldId: 'payment_proof', required: true, isOcr: false, category: 'conditional', conditionNote: paymentMethod === 'insurer_cc' ? 'Credit Card via Insurer' : 'Transfer via Insurer' });
  }
  if (paymentMethod.includes('credit_card') && paymentType === 'Non-Instalment') {
    docs.push({ fieldId: 'credit_card_authorization', required: true, isOcr: false, category: 'conditional', conditionNote: 'Credit card + Full payment' });
  }

  // D. Customer Type
  if (customerType === 'corporation') {
    docs.push({ fieldId: 'business_registration_certificate', required: true, isOcr: false, category: 'conditional', conditionNote: 'Corporate customer' });
  }

  // E. Vehicle Inspection
  if (insuranceClass === 'Type1') {
    const isUploadPhotos = carInspectionMethod === 'upload_photos';
    docs.push({
      fieldId: 'car_inspection_photos',
      required: isUploadPhotos,
      isOcr: false,
      category: 'conditional',
      conditionNote: saleType === 'Renewable' ? 'Renewal — same as last year (≥ 8 photos)' : 'Type 1 only (at least 8 photos)',
      requiredCount: isUploadPhotos ? 8 : undefined,
    });
    docs.push({ fieldId: 'car_inspection_form', required: false, isOcr: false, category: 'conditional', conditionNote: 'Type 1 only' });
  }
  if (carType === 'Special') {
    docs.push({ fieldId: 'high_sum_approval_form', required: true, isOcr: false, category: 'conditional', conditionNote: 'High Sum + BKI/MTI insurer' });
  }

  // F. Prior Policy & COA
  if (saleType === 'Renewable') {
    docs.push({ fieldId: 'prior_policy_notice', required: true, isOcr: false, category: 'sale_type_specific', conditionNote: 'Renewal — FairDee notice' });
    docs.push({ fieldId: 'existing_policy_document', required: false, isOcr: false, category: 'sale_type_specific', conditionNote: 'Supplementary for renewal' });
  }
  if (saleType === 'COA') {
    docs.push({ fieldId: 'prior_policy_notice', required: true, isOcr: false, category: 'sale_type_specific', conditionNote: 'COA — other broker notice' });
    docs.push({ fieldId: 'coa_request_form', required: true, isOcr: false, category: 'sale_type_specific', conditionNote: 'COA only' });
    docs.push({ fieldId: 'coa_pricelist', required: true, isOcr: false, category: 'sale_type_specific', conditionNote: 'COA — all insurance classes' });
    docs.push({ fieldId: 'existing_policy_document', required: false, isOcr: false, category: 'sale_type_specific', conditionNote: 'Can replace car registration' });
  }
  if (saleType === 'New') {
    docs.push({ fieldId: 'existing_policy_document', required: false, isOcr: false, category: 'sale_type_specific', conditionNote: 'Can replace car registration' });
  }

  // G. Optional
  docs.push({ fieldId: 'sum_insured_reference', required: false, isOcr: false, category: 'optional_if_available', conditionNote: 'If available' });
  docs.push({ fieldId: 'bill_of_sale', required: false, isOcr: false, category: 'optional_if_available', conditionNote: 'Red plate / name mismatch' });
  docs.push({ fieldId: 'power_of_attorney', required: false, isOcr: false, category: 'optional_if_available', conditionNote: 'New car with temp red plate' });
  docs.push({ fieldId: 'name_change_certificate', required: false, isOcr: false, category: 'optional_if_available', conditionNote: 'Name mismatch on car reg' });
  docs.push({ fieldId: 'administrator_document', required: false, isOcr: false, category: 'optional_if_available', conditionNote: 'Deceased insured' });
  docs.push({ fieldId: 'death_certificate', required: false, isOcr: false, category: 'optional_if_available', conditionNote: 'Deceased insured' });
  docs.push({ fieldId: 'relationship_form', required: false, isOcr: false, category: 'optional_if_available', conditionNote: 'CBC + credit card + name mismatch' });

  // Sort: formal required first, then required, then optional
  docs.sort((a, b) => {
    const aFormal = FORMAL_REQUIRED_FIELDS.includes(a.fieldId) ? 0 : 1;
    const bFormal = FORMAL_REQUIRED_FIELDS.includes(b.fieldId) ? 0 : 1;
    if (aFormal !== bFormal) return aFormal - bFormal;
    const aReq = a.required ? 0 : 1;
    const bReq = b.required ? 0 : 1;
    return aReq - bReq;
  });

  return docs;
}

// Dynamic payment proof name based on payment method
export function getPaymentProofName(paymentMethod: string): { th: string; en: string } {
  if (paymentMethod === 'insurer_cc') {
    return { th: 'แบบฟอร์มบัตรเครดิต / สำเนาบัตรเครดิต', en: 'Credit Card Form / Copy of Credit Card' };
  }
  if (paymentMethod === 'insurer_transfer') {
    return { th: 'หลักฐานการโอนเงินให้บริษัทประกัน', en: 'Payment Slip to Insurer' };
  }
  return { th: 'หลักฐานการชำระเงิน', en: 'Payment Proof' };
}

// Category badge tokens — using semantic Tailwind classes (not raw hex)
export const CATEGORY_LABELS: Record<DocumentCategory, { th: string; en: string }> = {
  required_base: { th: 'จำเป็น', en: 'Required' },
  conditional: { th: 'ตามเงื่อนไข', en: 'Conditional' },
  sale_type_specific: { th: 'ตามประเภทงาน', en: 'Sale Type' },
  optional_if_available: { th: 'ถ้ามี', en: 'If Available' },
};

export const CATEGORY_BADGE_CLASS: Record<DocumentCategory, string> = {
  required_base: 'bg-blue-100 text-blue-800 border-blue-200',
  conditional: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sale_type_specific: 'bg-red-100 text-red-800 border-red-200',
  optional_if_available: 'bg-green-100 text-green-800 border-green-200',
};

// Group order for display
export const GROUP_ORDER = [
  'A. Identity & Customer Verification',
  'B. Vehicle & Registration',
  'C. Payment Documents',
  'D. Customer Type',
  'E. Vehicle Inspection',
  'F. Prior Policy & COA Transfer',
  'G. Optional / Special Case',
];
