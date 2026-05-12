// Mock data visualizing the proposed Document Matrix schema.
// Three tables: Document Library, Document Matrix Rules, Audit Log.

export type DocCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type DocTier = 'Required Base' | 'Conditional' | 'Sale-Type Specific' | 'Optional';
export type SaleType = 'New' | 'Renew' | 'COA';
export type InsuranceClass = 'Type1' | 'Type2' | 'Type2Plus' | 'Type3' | 'Type3Plus';
export type PaymentType = 'Full' | 'Instalment';
export type CarType = 'Normally' | 'EV' | 'High Sum';

export interface DocLibraryRow {
  id: number;
  name_en: string;
  name_th: string;
  category: DocCategory;
  default_tier: DocTier;
  default_condition_note: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SumInsuredOp = '<' | '<=' | '=' | '>=' | '>';

export interface InsurerRow {
  id: string;
  name: string;
}

export const mockInsurers: InsurerRow[] = [
  { id: 'viriyah', name: 'Viriyah' },
  { id: 'bangkok', name: 'Bangkok Insurance' },
  { id: 'tip', name: 'Thai Insurance Public (TIP)' },
  { id: 'msig', name: 'MSIG' },
  { id: 'dhipaya', name: 'Dhipaya' },
  { id: 'axa', name: 'AXA' },
  { id: 'allianz', name: 'Allianz Ayudhya' },
  { id: 'lmg', name: 'LMG Insurance' },
];

export interface DocMatrixRule {
  id: number;
  sale_type: SaleType;
  insurance_class: InsuranceClass;
  payment_type: PaymentType;
  car_type: CarType;
  document_id: number;
  tier: DocTier;
  condition_note: string;
  min_count: number;
  is_active: boolean;
  /** Optional. Empty/undefined = applies to all insurers. */
  insurer_ids?: string[];
  /** Optional sum-insured threshold. Both fields required together. */
  sum_insured_op?: SumInsuredOp;
  sum_insured_value?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface DocAuditLog {
  id: number;
  matrix_rule_id: number;
  action: 'Added' | 'Removed' | 'Updated';
  field_changed: string;
  old_value: string;
  new_value: string;
  actor_email: string;
  created_at: string;
}

export const mockDocLibrary: DocLibraryRow[] = [
  { id: 1, name_en: 'Identity Document (NID/Passport)', name_th: 'เอกสารประจำตัว', category: 'A', default_tier: 'Required Base', default_condition_note: 'Always required for all sales', is_active: true, created_at: '2026-01-15 09:00', updated_at: '2026-03-12 14:22' },
  { id: 2, name_en: 'NID with Signed (Instalment Copy)', name_th: 'บัตรประชาชนพร้อมลายเซ็น', category: 'A', default_tier: 'Conditional', default_condition_note: 'Required when payment_type = Instalment', is_active: true, created_at: '2026-01-15 09:01', updated_at: '2026-01-15 09:01' },
  { id: 3, name_en: 'Customer Selfie with Instalment Card', name_th: 'เซลฟี่ลูกค้าพร้อมบัตรผ่อน', category: 'A', default_tier: 'Conditional', default_condition_note: 'Required when payment_type = Instalment', is_active: true, created_at: '2026-01-15 09:02', updated_at: '2026-01-15 09:02' },
  { id: 4, name_en: 'Car Registration', name_th: 'รายการจดทะเบียน', category: 'B', default_tier: 'Required Base', default_condition_note: 'Always required', is_active: true, created_at: '2026-01-15 09:03', updated_at: '2026-01-15 09:03' },
  { id: 5, name_en: 'Old / Existing Policy Document', name_th: 'ตารางกรมธรรม์เดิม', category: 'B', default_tier: 'Sale-Type Specific', default_condition_note: 'Required for Renew & COA only', is_active: true, created_at: '2026-01-15 09:04', updated_at: '2026-02-08 11:00' },
  { id: 6, name_en: 'Driver License', name_th: 'ใบอนุญาตขับรถยนต์', category: 'B', default_tier: 'Optional', default_condition_note: 'Collect if available', is_active: true, created_at: '2026-01-15 09:05', updated_at: '2026-01-15 09:05' },
  { id: 7, name_en: 'Credit Card Debit Authorization Form', name_th: 'หนังสือขอให้หักบัตรเครดิต', category: 'C', default_tier: 'Conditional', default_condition_note: 'Required when payment_type = Instalment (Credit Card)', is_active: true, created_at: '2026-01-15 09:06', updated_at: '2026-01-15 09:06' },
  { id: 8, name_en: 'Payment Proof', name_th: 'หลักฐานการชำระเงิน', category: 'C', default_tier: 'Required Base', default_condition_note: 'Always required after payment', is_active: true, created_at: '2026-01-15 09:07', updated_at: '2026-01-15 09:07' },
  { id: 9, name_en: 'Certificate of Business Registration', name_th: 'หนังสือรับรองบริษัท', category: 'D', default_tier: 'Conditional', default_condition_note: 'Required when customer is Corporate', is_active: true, created_at: '2026-01-15 09:08', updated_at: '2026-01-15 09:08' },
  { id: 10, name_en: 'Car Inspection Photos (8 Angles + Timestamp)', name_th: 'ภาพถ่ายตรวจสภาพรถ 8 มุม', category: 'E', default_tier: 'Conditional', default_condition_note: 'Required when insurance_class is Type1/2+/3+ and not Today', is_active: true, created_at: '2026-01-15 09:09', updated_at: '2026-03-01 10:10' },
  { id: 11, name_en: 'Car Inspection Form', name_th: 'แบบฟอร์มตรวจสภาพรถ', category: 'E', default_tier: 'Conditional', default_condition_note: 'Same as inspection photos', is_active: true, created_at: '2026-01-15 09:10', updated_at: '2026-01-15 09:10' },
  { id: 12, name_en: 'EV Battery Inspection Report', name_th: 'รายงานตรวจสภาพแบตเตอรี่ EV', category: 'E', default_tier: 'Conditional', default_condition_note: 'Required when car_type = EV', is_active: true, created_at: '2026-02-20 09:00', updated_at: '2026-02-20 09:00' },
  { id: 13, name_en: 'High Sum Insured Approval', name_th: 'หนังสืออนุมัติทุนประกันสูง', category: 'F', default_tier: 'Conditional', default_condition_note: 'Required when car_type = High Sum', is_active: true, created_at: '2026-01-15 09:12', updated_at: '2026-01-15 09:12' },
  { id: 14, name_en: 'Named Driver Declaration', name_th: 'ใบแจ้งผู้ขับขี่ระบุชื่อ', category: 'G', default_tier: 'Optional', default_condition_note: 'Collect when named-driver discount applied', is_active: true, created_at: '2026-01-15 09:13', updated_at: '2026-01-15 09:13' },
  { id: 15, name_en: 'Installment Consent Form (DEPRECATED)', name_th: 'หนังสือยินยอมผ่อนชำระ', category: 'C', default_tier: 'Optional', default_condition_note: 'Deprecated — not used in any scenario', is_active: false, created_at: '2025-11-01 09:00', updated_at: '2026-01-30 16:00' },
];

export const mockMatrixRules: DocMatrixRule[] = [
  { id: 101, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Full', car_type: 'Normally', document_id: 1, tier: 'Required Base', condition_note: 'Always required', min_count: 1, is_active: true, created_at: '2026-01-15 09:00', updated_at: '2026-01-15 09:00', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  { id: 102, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Full', car_type: 'Normally', document_id: 4, tier: 'Required Base', condition_note: 'Always required', min_count: 1, is_active: true, created_at: '2026-01-15 09:01', updated_at: '2026-01-15 09:01', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  { id: 103, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Full', car_type: 'Normally', document_id: 10, tier: 'Conditional', condition_note: 'Type1 always inspects (8 angles)', min_count: 8, is_active: true, created_at: '2026-01-15 09:02', updated_at: '2026-03-01 10:10', created_by: 'admin@fairdee.com', updated_by: 'pao@fairdee.com' },
  { id: 104, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Instalment', car_type: 'Normally', document_id: 2, tier: 'Conditional', condition_note: 'Instalment requires signed NID', min_count: 1, is_active: true, created_at: '2026-01-16 11:20', updated_at: '2026-01-16 11:20', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  { id: 105, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Instalment', car_type: 'Normally', document_id: 3, tier: 'Conditional', condition_note: 'Instalment requires selfie', min_count: 1, is_active: true, created_at: '2026-01-16 11:21', updated_at: '2026-01-16 11:21', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  { id: 106, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Instalment', car_type: 'Normally', document_id: 7, tier: 'Conditional', condition_note: 'Required for credit card instalment', min_count: 1, is_active: true, created_at: '2026-01-16 11:22', updated_at: '2026-01-16 11:22', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  { id: 107, sale_type: 'Renew', insurance_class: 'Type1', payment_type: 'Full', car_type: 'Normally', document_id: 5, tier: 'Sale-Type Specific', condition_note: 'Renew requires existing policy', min_count: 1, is_active: true, created_at: '2026-01-17 14:00', updated_at: '2026-02-08 11:00', created_by: 'admin@fairdee.com', updated_by: 'rachel@fairdee.com' },
  { id: 108, sale_type: 'COA', insurance_class: 'Type1', payment_type: 'Full', car_type: 'Normally', document_id: 5, tier: 'Sale-Type Specific', condition_note: 'COA requires existing policy', min_count: 1, is_active: true, created_at: '2026-01-17 14:05', updated_at: '2026-01-17 14:05', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  { id: 109, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Full', car_type: 'EV', document_id: 12, tier: 'Conditional', condition_note: 'EV battery report required', min_count: 1, is_active: true, created_at: '2026-02-20 09:30', updated_at: '2026-02-20 09:30', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  { id: 110, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Full', car_type: 'High Sum', document_id: 13, tier: 'Conditional', condition_note: 'High Sum requires approval letter', min_count: 1, is_active: true, created_at: '2026-01-18 10:00', updated_at: '2026-01-18 10:00', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  { id: 111, sale_type: 'New', insurance_class: 'Type3', payment_type: 'Full', car_type: 'Normally', document_id: 10, tier: 'Optional', condition_note: 'Type3 generally skips inspection', min_count: 8, is_active: false, created_at: '2026-01-15 09:30', updated_at: '2026-03-05 13:00', created_by: 'admin@fairdee.com', updated_by: 'pao@fairdee.com' },
  { id: 112, sale_type: 'New', insurance_class: 'Type2Plus', payment_type: 'Full', car_type: 'Normally', document_id: 10, tier: 'Conditional', condition_note: '2+ requires inspection', min_count: 8, is_active: true, created_at: '2026-01-15 09:35', updated_at: '2026-01-15 09:35', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  { id: 113, sale_type: 'New', insurance_class: 'Type3Plus', payment_type: 'Full', car_type: 'Normally', document_id: 10, tier: 'Conditional', condition_note: '3+ requires inspection', min_count: 8, is_active: true, created_at: '2026-01-15 09:36', updated_at: '2026-01-15 09:36', created_by: 'admin@fairdee.com', updated_by: 'admin@fairdee.com' },
  // Insurer-specific extra
  { id: 114, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Full', car_type: 'Normally', document_id: 13, tier: 'Conditional', condition_note: 'Viriyah requires extra approval letter', min_count: 1, is_active: true, insurer_ids: ['viriyah'], created_at: '2026-04-02 10:00', updated_at: '2026-04-02 10:00', created_by: 'pao@fairdee.com', updated_by: 'pao@fairdee.com' },
  // Sum-insured threshold extra
  { id: 115, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Full', car_type: 'Normally', document_id: 13, tier: 'Conditional', condition_note: 'Sum insured ≥ 2,000,000 Baht needs approval', min_count: 1, is_active: true, sum_insured_op: '>=', sum_insured_value: 2000000, created_at: '2026-04-04 09:30', updated_at: '2026-04-04 09:30', created_by: 'pao@fairdee.com', updated_by: 'pao@fairdee.com' },
  // Combined insurer + threshold
  { id: 116, sale_type: 'New', insurance_class: 'Type1', payment_type: 'Instalment', car_type: 'Normally', document_id: 9, tier: 'Conditional', condition_note: 'MSIG / Bangkok require corp cert when SI > 3M', min_count: 1, is_active: true, insurer_ids: ['msig', 'bangkok'], sum_insured_op: '>', sum_insured_value: 3000000, created_at: '2026-04-10 14:00', updated_at: '2026-04-10 14:00', created_by: 'pao@fairdee.com', updated_by: 'pao@fairdee.com' },
];

export const mockAuditLog: DocAuditLog[] = [
  { id: 1001, matrix_rule_id: 103, action: 'Updated', field_changed: 'min_count', old_value: '1', new_value: '8', actor_email: 'pao@fairdee.com', created_at: '2026-03-01 10:10' },
  { id: 1002, matrix_rule_id: 107, action: 'Updated', field_changed: 'condition_note', old_value: 'Renew requires policy doc', new_value: 'Renew requires existing policy', actor_email: 'rachel@fairdee.com', created_at: '2026-02-08 11:00' },
  { id: 1003, matrix_rule_id: 109, action: 'Added', field_changed: '—', old_value: '—', new_value: 'New rule for EV battery report', actor_email: 'admin@fairdee.com', created_at: '2026-02-20 09:30' },
  { id: 1004, matrix_rule_id: 111, action: 'Updated', field_changed: 'is_active', old_value: 'true', new_value: 'false', actor_email: 'pao@fairdee.com', created_at: '2026-03-05 13:00' },
  { id: 1005, matrix_rule_id: 111, action: 'Updated', field_changed: 'tier', old_value: 'Conditional', new_value: 'Optional', actor_email: 'pao@fairdee.com', created_at: '2026-03-05 12:55' },
  { id: 1006, matrix_rule_id: 104, action: 'Added', field_changed: '—', old_value: '—', new_value: 'Instalment NID rule added', actor_email: 'admin@fairdee.com', created_at: '2026-01-16 11:20' },
  { id: 1007, matrix_rule_id: 103, action: 'Updated', field_changed: 'condition_note', old_value: 'Always required', new_value: 'Type1 always inspects (8 angles)', actor_email: 'pao@fairdee.com', created_at: '2026-03-01 10:09' },
];
