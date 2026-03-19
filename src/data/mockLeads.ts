import { Lead, ReworkConfig, HistoryLogEntry, PolicyType, PolicyRecord, PolicyStatus, PolicyReworkEntry, InsurerQuote, PriceListStatus, ETAStatus, PaymentMethod, EndorsementType, EndorsementStatus, LeadSource, PolicyHistoryLogEntry, InstallmentCount } from '@/types/pipeline';

const agents = [
  { id: 'FD-3460', name: 'Akshay Bazad' },
  { id: 'FM-5368', name: 'James Santes' },
  { id: 'FM-5369', name: 'Harriett Joyce' },
  { id: 'FM-5370', name: 'Jennifer Haines' },
  { id: 'FM-5371', name: 'Michael Chen' },
  { id: 'FM-5372', name: 'Sarah Wilson' },
];

const rfStaff = ['Ricky', 'Jenny', 'Tommy'];
const scStaff = ['Lisa', 'Mike', 'Nina'];
const deStaff = ['Oscar', 'Paula', 'Quinn', 'Pao'];
const adminStaff = ['Rachel', 'Sam', 'Tina'];
const deliveryStaff = ['Dao', 'Kai', 'Ploy'];

// Current user constant
export const CURRENT_USER = 'Pao';
const vehiclePlates = ['2มว7814', '2ศย8965', 'กย4521', 'ษท8823', '1กก1234', 'ฆจ5678', '3ขค9012', 'พร3456', 'ศว7890', '2ญม6789', 'นค1234', 'ฉฬ5678'];

// Thai provinces for license plates
const vehicleProvinces = [
  'กรุงเทพมหานคร',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'ชลบุรี',
  'เชียงใหม่',
  'ภูเก็ต',
  'ขอนแก่น',
  'นครราชสีมา',
  'สงขลา',
];

// Vehicle brands and models for mock data (short names only)
const vehicleBrands: Array<{ brand: string; subBrands: string[] }> = [
  { brand: 'Nissan', subBrands: ['Terra', 'Kicks', 'Almera'] },
  { brand: 'Honda', subBrands: ['Civic', 'City', 'CR-V'] },
  { brand: 'Suzuki', subBrands: ['XL7', 'Ertiga', 'Swift'] },
  { brand: 'Mazda', subBrands: ['CX-5', 'CX-3', '3'] },
  { brand: 'Isuzu', subBrands: ['MU-X', 'D-Max'] },
  { brand: 'Toyota', subBrands: ['Vios', 'Yaris', 'Camry'] },
];

// Helper to get random vehicle info
function getRandomVehicle() {
  const brandData = vehicleBrands[Math.floor(Math.random() * vehicleBrands.length)];
  const subBrand = brandData.subBrands[Math.floor(Math.random() * brandData.subBrands.length)];
  const year = 2015 + Math.floor(Math.random() * 11); // 2015-2025
  const province = vehicleProvinces[Math.floor(Math.random() * vehicleProvinces.length)];
  return { brand: brandData.brand, subBrand, year, province };
}

// Helper to get random coverage details for post-lead stages
function getRandomCoverage(index: number) {
  const insurer = insurerNamePairs[index % insurerNamePairs.length];
  return {
    insuranceClass: coverageInsuranceClasses[index % coverageInsuranceClasses.length],
    garageType: coverageGarageTypes[index % coverageGarageTypes.length],
    insurerName: insurer.en,
    insurerNameTh: insurer.th,
  };
}

// Insurer names for mock data (EN only - used for insurer quotes)
const insurerNames = [
  'Viriyah Insurance',
  'AXA Insurance',
  'LMG Insurance',
  'Bangkok Insurance',
  'Dhipaya Insurance',
  'Muang Thai Insurance',
  'Thai Sri Insurance',
  'MSIG Insurance',
];

// Insurer names with TH/EN pairs for coverage details
const insurerNamePairs: Array<{ en: string; th: string }> = [
  { en: 'Viriyah Insurance', th: 'วิริยะประกันภัย' },
  { en: 'Bangkok Insurance', th: 'กรุงเทพประกันภัย' },
  { en: 'Dhipaya Insurance', th: 'ทิพยประกันภัย' },
  { en: 'Muang Thai Insurance', th: 'เมืองไทยประกันภัย' },
  { en: 'Sin Munkong Insurance', th: 'สินมั่นคงประกันภัย' },
  { en: 'LMG Insurance', th: 'แอลเอ็มจีประกันภัย' },
  { en: 'AIA Thailand', th: 'เอไอเอ ประเทศไทย' },
  { en: 'Allianz Ayudhya', th: 'อลิอันซ์ อยุธยา' },
  { en: 'Deves Insurance', th: 'เทเวศประกันภัย' },
  { en: 'MSIG Insurance', th: 'เอ็ม เอส ไอ จี ประกันภัย' },
  { en: 'Thaisri Insurance', th: 'ไทยศรีประกันภัย' },
  { en: 'Chubb Samaggi Insurance', th: 'ชับบ์สามัคคีประกันภัย' },
  { en: 'Falcon Insurance', th: 'ฟอลคอนประกันภัย' },
  { en: 'Navakij Insurance', th: 'นวกิจประกันภัย' },
];

// Coverage detail values for post-lead stages
const coverageInsuranceClasses = ['1', '2', '2+', '3', '3+'];
const coverageGarageTypes: Array<'Dealer' | 'Garage'> = ['Dealer', 'Garage'];

// Helper to get random ETA status for post-lead stages
function getRandomEtaStatus(index: number): { etaStatus: ETAStatus; etaDaysOverdue?: number } {
  // ~40% breached, ~60% on_time
  if (index % 5 < 2) {
    return { etaStatus: 'breached', etaDaysOverdue: 1 + (index % 15) };
  }
  return { etaStatus: 'on_time' };
}

const insuranceClasses = ['type_1_insurance', 'type_2_insurance', 'type_3_insurance', 'type_2+_insurance'];
const garageTypes: Array<'Dealer' | 'Garage' | 'Any'> = ['Dealer', 'Garage', 'Any'];
const priceListStatuses: PriceListStatus[] = ['pending', 'price_list_added', 'rejected_by_insurer', 'email_sent'];
const paymentMethods: PaymentMethod[] = ['credit', 'cbc_to_fairdee', 'cbc_to_insurer'];
const installmentCounts: InstallmentCount[] = [3, 6, 10];
const printingPreferences: Array<'e_policy' | 'print_by_myself' | 'print_by_fairdee'> = ['e_policy', 'print_by_myself', 'print_by_fairdee'];

// Helper to get payment type and installment count based on payment method
let installmentCounter = 0;
function getPaymentTypeInfo(paymentMethod: PaymentMethod, index: number): { paymentType: 'full' | 'installment'; installmentCount?: InstallmentCount } {
  // Installment is only possible with cbc_to_fairdee, and we randomly decide
  if (paymentMethod === 'cbc_to_fairdee' && index % 2 === 1) {
    const pick = installmentCounter % installmentCounts.length;
    installmentCounter++;
    return { 
      paymentType: 'installment', 
      installmentCount: installmentCounts[pick] 
    };
  }
  return { paymentType: 'full' };
}

// Helper to generate random premium between 5000 and 20000
function generatePremium(): number {
  return Math.round((5000 + Math.random() * 15000) * 100) / 100;
}

// Helper to generate 11-character policy number (mix of letters and digits)
function generatePolicyNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 11; i++) {
    // Mix letters and numbers
    if (i < 3) {
      result += chars.charAt(Math.floor(Math.random() * 26)); // First 3 are letters
    } else {
      result += chars.charAt(26 + Math.floor(Math.random() * 10)); // Rest are numbers
    }
  }
  return result;
}

// Helper to check if policy status means policy has been uploaded
function isPolicyUploaded(status: PolicyStatus): boolean {
  return ['policy_issued', 'policy_shipped', 'policy_delivered', 'policy_cancelled'].includes(status);
}

// Status progression for policy history generation
const policyStatusProgression: PolicyStatus[] = [
  'pending_payment',
  'pending_review', 
  'pending_issuance',
  'policy_issued',
  'policy_shipped',
  'policy_delivered',
];

// Lead status progression (pre-conversion)
const leadStatusProgression = [
  'pending',
  'docs_missing',
  'waiting_for_insurer',
  'quotation_shared',
];

// Helper to generate rich policy history log with lead status, assignees, payment, endorsement
function generatePolicyHistoryLog(
  policyId: string,
  currentStatus: PolicyStatus,
  baseDate: string,
  options?: {
    paymentMethod?: PaymentMethod;
    endorsementType?: EndorsementType;
    endorsementStatus?: EndorsementStatus;
    rfAssignee?: string;
    scAssignee?: string;
    deAssignee?: string;
  }
): PolicyHistoryLogEntry[] {
  const logs: PolicyHistoryLogEntry[] = [];
  const currentIndex = policyStatusProgression.indexOf(currentStatus);
  
  const [datePart, timePart] = baseDate.split(' ');
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours] = (timePart || '09:00').split(':').map(Number);
  let hourOffset = 0;
  
  const getTime = () => {
    hourOffset += 1;
    const entryDate = new Date(year, month - 1, day, hours + hourOffset, Math.floor(Math.random() * 60));
    return `${String(entryDate.getDate()).padStart(2, '0')}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${entryDate.getFullYear()} ${String(entryDate.getHours()).padStart(2, '0')}:${String(entryDate.getMinutes()).padStart(2, '0')}`;
  };

  // Add lead status changes (pre-conversion journey) - always add these first
  // Simulate: pending -> docs_missing -> waiting_for_insurer -> quotation_shared
  const leadSteps = Math.min(2 + Math.floor(Math.random() * 2), 3); // 2-3 steps
  for (let i = 1; i <= leadSteps; i++) {
    logs.push({
      id: `phl-${policyId}-lead-${i}`,
      action: 'lead_status_changed',
      triggeredBy: options?.scAssignee || options?.rfAssignee || scStaff[i % scStaff.length],
      triggeredAt: getTime(),
      fromStatus: leadStatusProgression[i - 1] as any,
      toStatus: leadStatusProgression[i] as any,
    });
  }

  // Add RF assignee change
  if (options?.rfAssignee) {
    logs.push({
      id: `phl-${policyId}-rf`,
      action: 'assignee_changed',
      triggeredBy: 'System (Round Robin)',
      triggeredAt: getTime(),
      assigneeType: 'rf',
      fromAssignee: undefined,
      toAssignee: options.rfAssignee,
    });
  }

  // Add SC assignee change
  if (options?.scAssignee) {
    logs.push({
      id: `phl-${policyId}-sc`,
      action: 'assignee_changed',
      triggeredBy: options.scAssignee,
      triggeredAt: getTime(),
      assigneeType: 'sc',
      fromAssignee: undefined,
      toAssignee: options.scAssignee,
    });
  }

  // Add payment status change (based on payment method)
  if (options?.paymentMethod && currentIndex >= 1) {
    const paymentStatusMap: Record<PaymentMethod, string> = {
      cbc_to_fairdee: 'payment_verified',
      cbc_to_insurer: 'insurer_notified',
      credit: 'credit_approved',
    };
    logs.push({
      id: `phl-${policyId}-payment`,
      action: 'payment_status_changed',
      triggeredBy: 'Payment System',
      triggeredAt: getTime(),
      fromStatus: 'unpaid' as any,
      toStatus: paymentStatusMap[options.paymentMethod] as any,
    });
  }

  // Add DE assignee change (for post to_pay stages)
  if (options?.deAssignee && currentIndex >= 1) {
    logs.push({
      id: `phl-${policyId}-de`,
      action: 'assignee_changed',
      triggeredBy: 'System (Round Robin)',
      triggeredAt: getTime(),
      assigneeType: 'de',
      fromAssignee: undefined,
      toAssignee: options.deAssignee,
    });
  }
  
  // Generate policy status transition history entries
  if (currentIndex !== -1) {
    for (let i = 1; i <= currentIndex; i++) {
      logs.push({
        id: `phl-${policyId}-${i}`,
        action: 'status_changed',
        triggeredBy: options?.deAssignee || deStaff[i % deStaff.length],
        triggeredAt: getTime(),
        fromStatus: policyStatusProgression[i - 1],
        toStatus: policyStatusProgression[i],
      });
    }
  }

  // Add endorsement status change if applicable
  if (options?.endorsementType && options?.endorsementStatus) {
    logs.push({
      id: `phl-${policyId}-endorse`,
      action: 'endorsement_status_changed',
      triggeredBy: options?.deAssignee || deStaff[0],
      triggeredAt: getTime(),
      fromStatus: 'request_created' as any,
      toStatus: options.endorsementStatus as any,
    });
  }
  
  return logs;
}

// Helper to generate policy record with proper timestamps
function generatePolicyRecord(
  id: string,
  kind: 'vmi' | 'cmi',
  status: PolicyStatus,
  baseDate: string,
  policyStartDate: string,
  shippingMethodOverride?: 'e_policy' | 'print_by_myself' | 'print_by_fairdee',
  endorsementType?: EndorsementType,
  endorsementStatus?: EndorsementStatus,
  staffOptions?: {
    paymentMethod?: PaymentMethod;
    rfAssignee?: string;
    scAssignee?: string;
    deAssignee?: string;
  }
): PolicyRecord {
  const hasUploadedPolicy = isPolicyUploaded(status);
  const shippingMethod = shippingMethodOverride || printingPreferences[Math.floor(Math.random() * printingPreferences.length)];
  
  // Generate updatedOn - latest timestamp of any action (random hours after base date)
  const [datePart, timePart] = baseDate.split(' ');
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours, mins] = (timePart || '09:00').split(':').map(Number);
  const updateDate = new Date(year, month - 1, day, hours + Math.floor(Math.random() * 48), Math.floor(Math.random() * 60));
  const updatedOn = `${String(updateDate.getDate()).padStart(2, '0')}-${String(updateDate.getMonth() + 1).padStart(2, '0')}-${updateDate.getFullYear()} ${String(updateDate.getHours()).padStart(2, '0')}:${String(updateDate.getMinutes()).padStart(2, '0')}`;
  
  // Generate policyUploadedOn only if status indicates policy was uploaded
  let policyUploadedOn: string | undefined;
  if (hasUploadedPolicy) {
    const uploadDate = new Date(year, month - 1, day, hours + Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    policyUploadedOn = `${String(uploadDate.getDate()).padStart(2, '0')}-${String(uploadDate.getMonth() + 1).padStart(2, '0')}-${uploadDate.getFullYear()} ${String(uploadDate.getHours()).padStart(2, '0')}:${String(uploadDate.getMinutes()).padStart(2, '0')}`;
  }

  // Generate policy history log with all context
  const historyLog = generatePolicyHistoryLog(id, status, baseDate, {
    paymentMethod: staffOptions?.paymentMethod,
    endorsementType,
    endorsementStatus,
    rfAssignee: staffOptions?.rfAssignee,
    scAssignee: staffOptions?.scAssignee,
    deAssignee: staffOptions?.deAssignee,
  });

  // Assign admin for pending_issuance status and beyond
  const needsAdmin = ['pending_issuance', 'policy_issued', 'policy_shipped', 'policy_delivered'].includes(status);
  const adminAssignee = needsAdmin ? adminStaff[Math.floor(Math.random() * adminStaff.length)] : undefined;
  
  // Assign delivery for print_by_fairdee with policy_issued/shipped/delivered
  const needsDelivery = shippingMethod === 'print_by_fairdee' && ['policy_issued', 'policy_shipped', 'policy_delivered'].includes(status);
  const deliveryAssignee = needsDelivery ? deliveryStaff[Math.floor(Math.random() * deliveryStaff.length)] : undefined;

  return {
    id,
    kind,
    status,
    policyAttached: hasUploadedPolicy,
    shippingMethod,
    updatedOn,
    policyUploadedOn,
    policyStartDate,
    policyNumber: hasUploadedPolicy ? generatePolicyNumber() : undefined,
    policyFileUrl: hasUploadedPolicy ? `/mock-policies/${id}.pdf` : undefined,
    trackingNumber: shippingMethod === 'print_by_fairdee' && hasUploadedPolicy ? `TH${Math.floor(Math.random() * 9000000000) + 1000000000}` : undefined,
    endorsementType,
    endorsementStatus,
    historyLog,
    adminAssignee,
    deliveryAssignee,
  };
}

// Helper to generate policy record with multiple rework entries
function generatePolicyRecordWithRework(
  id: string,
  kind: 'vmi' | 'cmi',
  previousStatus: PolicyStatus,
  baseDate: string,
  policyStartDate: string,
  reworkReasonIds: string[],
  shippingMethodOverride?: 'e_policy' | 'print_by_myself' | 'print_by_fairdee',
  assignedTo?: string,
  staffOptions?: {
    paymentMethod?: PaymentMethod;
    rfAssignee?: string;
    scAssignee?: string;
    deAssignee?: string;
  }
): PolicyRecord {
  const shippingMethod = shippingMethodOverride || printingPreferences[Math.floor(Math.random() * printingPreferences.length)];
  
  const [datePart, timePart] = baseDate.split(' ');
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours, mins] = (timePart || '09:00').split(':').map(Number);
  const updateDate = new Date(year, month - 1, day, hours + Math.floor(Math.random() * 48), Math.floor(Math.random() * 60));
  const updatedOn = `${String(updateDate.getDate()).padStart(2, '0')}-${String(updateDate.getMonth() + 1).padStart(2, '0')}-${updateDate.getFullYear()} ${String(updateDate.getHours()).padStart(2, '0')}:${String(updateDate.getMinutes()).padStart(2, '0')}`;
  
  // Generate rework history entries
  const reworkHistory: PolicyReworkEntry[] = reworkReasonIds.map((reasonId, idx) => {
    const entryDate = new Date(year, month - 1, day, hours + 8 + idx * 2, Math.floor(Math.random() * 60));
    const savedAt = `${String(entryDate.getDate()).padStart(2, '0')}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${entryDate.getFullYear()} ${String(entryDate.getHours()).padStart(2, '0')}:${String(entryDate.getMinutes()).padStart(2, '0')}`;
    
    // Reason '1' (Missing Documents) is auto_resolve type
    const isAutoResolve = reasonId === '1';
    
    return {
      id: `rework-${id}-${idx}`,
      reasonId,
      reasonLabel: reworkReasonLabels[reasonId]?.en || 'Unknown',
      details: idx === 0 ? 'ต้องการข้อมูลเพิ่มเติม' : 'รอเอกสารจากลูกค้า',
      attachments: [],
      savedBy: deStaff[idx % deStaff.length],
      savedAt,
      previousStatus,
      assignedTo: assignedTo, // Owner for this rework entry
      ...(isAutoResolve ? { autoResolveDate: '15/04/2026' } : {}),
    };
  });

  // Generate history log with lead status (pre-conversion) first, then policy status progression
  const historyLog: PolicyHistoryLogEntry[] = [];
  let hourOffset = 0;
  
  const getTime = () => {
    hourOffset += 1;
    const entryDate = new Date(year, month - 1, day, hours + hourOffset, Math.floor(Math.random() * 60));
    return `${String(entryDate.getDate()).padStart(2, '0')}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${entryDate.getFullYear()} ${String(entryDate.getHours()).padStart(2, '0')}:${String(entryDate.getMinutes()).padStart(2, '0')}`;
  };

  // 1. Lead status changes first (pre-conversion journey)
  const leadSteps = 2 + Math.floor(Math.random() * 2); // 2-3 steps
  for (let i = 1; i <= leadSteps; i++) {
    historyLog.push({
      id: `phl-${id}-lead-${i}`,
      action: 'lead_status_changed',
      triggeredBy: staffOptions?.scAssignee || staffOptions?.rfAssignee || scStaff[i % scStaff.length],
      triggeredAt: getTime(),
      fromStatus: leadStatusProgression[i - 1] as any,
      toStatus: leadStatusProgression[i] as any,
    });
  }

  // 2. RF assignee change
  if (staffOptions?.rfAssignee) {
    historyLog.push({
      id: `phl-${id}-rf`,
      action: 'assignee_changed',
      triggeredBy: 'System (Round Robin)',
      triggeredAt: getTime(),
      assigneeType: 'rf',
      fromAssignee: undefined,
      toAssignee: staffOptions.rfAssignee,
    });
  }

  // 3. SC assignee change
  if (staffOptions?.scAssignee) {
    historyLog.push({
      id: `phl-${id}-sc`,
      action: 'assignee_changed',
      triggeredBy: staffOptions.scAssignee,
      triggeredAt: getTime(),
      assigneeType: 'sc',
      fromAssignee: undefined,
      toAssignee: staffOptions.scAssignee,
    });
  }

  // 4. Payment status change
  if (staffOptions?.paymentMethod) {
    const paymentStatusMap: Record<PaymentMethod, string> = {
      cbc_to_fairdee: 'payment_verified',
      cbc_to_insurer: 'insurer_notified',
      credit: 'credit_approved',
    };
    historyLog.push({
      id: `phl-${id}-payment`,
      action: 'payment_status_changed',
      triggeredBy: 'Payment System',
      triggeredAt: getTime(),
      fromStatus: 'unpaid' as any,
      toStatus: paymentStatusMap[staffOptions.paymentMethod] as any,
    });
  }

  // 5. DE assignee change
  if (staffOptions?.deAssignee) {
    historyLog.push({
      id: `phl-${id}-de`,
      action: 'assignee_changed',
      triggeredBy: 'System (Round Robin)',
      triggeredAt: getTime(),
      assigneeType: 'de',
      fromAssignee: undefined,
      toAssignee: staffOptions.deAssignee,
    });
  }

  // 6. Policy status progression up to previousStatus
  const currentIndex = policyStatusProgression.indexOf(previousStatus);
  if (currentIndex !== -1) {
    for (let i = 1; i <= currentIndex; i++) {
      historyLog.push({
        id: `phl-${id}-status-${i}`,
        action: 'status_changed',
        triggeredBy: staffOptions?.deAssignee || deStaff[i % deStaff.length],
        triggeredAt: getTime(),
        fromStatus: policyStatusProgression[i - 1],
        toStatus: policyStatusProgression[i],
      });
    }
  }

  // 7. Rework status change and owner change (last entries)
  if (reworkReasonIds.length > 0) {
    const reworkTimestamp = getTime();
    
    // Status change: previousStatus -> rework_required
    historyLog.push({
      id: `phl-${id}-status-rework`,
      action: 'status_changed',
      triggeredBy: deStaff[0],
      triggeredAt: reworkTimestamp,
      fromStatus: previousStatus,
      toStatus: 'rework_required',
    });
    
    // Owner change (if applicable) - same timestamp
    if (assignedTo) {
      historyLog.push({
        id: `phl-${id}-owner-rework`,
        action: 'assignee_changed',
        triggeredBy: deStaff[0],
        triggeredAt: reworkTimestamp,
        assigneeType: 'owner',
        fromAssignee: undefined,
        toAssignee: assignedTo,
      });
    }
  }

  return {
    id,
    kind,
    status: 'rework_required',
    policyAttached: false,
    shippingMethod,
    updatedOn,
    policyStartDate,
    reworkRequired: true,
    reworkHistory,
    historyLog,
  };
}

// Helper to generate insurer quotes for a lead
function generateInsurerQuotes(leadId: string, numQuotes: number = 3): InsurerQuote[] {
  const quotes: InsurerQuote[] = [];
  const usedInsurers = new Set<string>();

  for (let i = 0; i < numQuotes; i++) {
    // Get a unique insurer
    let insurer = insurerNames[i % insurerNames.length];
    while (usedInsurers.has(insurer) && usedInsurers.size < insurerNames.length) {
      insurer = insurerNames[(insurerNames.indexOf(insurer) + 1) % insurerNames.length];
    }
    usedInsurers.add(insurer);

    const status = priceListStatuses[i % priceListStatuses.length];
    const hasEmailSent = status === 'email_sent' || Math.random() > 0.6;
    const isBreached = i % 3 === 0 || (i === 0 && Math.random() > 0.3); // More breached quotes
    
    quotes.push({
      id: `quote-${leadId}-${i + 1}`,
      insurerName: insurer,
      insuranceClass: insuranceClasses[i % insuranceClasses.length],
      garageType: garageTypes[i % garageTypes.length],
      priceListStatus: status,
      emailSentAt: hasEmailSent ? `2569-01-15 21:13:19` : undefined,
      waitingTimeDays: hasEmailSent ? Math.floor(Math.random() * 30) : undefined,
      followUpDate: undefined,
      etaStatus: (status === 'price_list_added' || status === 'email_sent') ? (isBreached ? 'breached' : 'on_time') : undefined,
      daysOverdue: isBreached ? Math.floor(Math.random() * 14) + 1 : undefined,
      etaRange: status === 'price_list_added' ? `${String(16 + i).padStart(2, '0')}/01/2026 ${10 + i}:00:00` : undefined,
      priceListAddedAt: status === 'price_list_added' ? `2569-01-16 ${13 + i}:02:04` : undefined,
    });
  }

  return quotes;
}

// Rework reason labels mapping
const reworkReasonLabels: Record<string, { en: string; th: string }> = {
  '1': { en: 'Missing Documents', th: 'เอกสารไม่ครบถ้วน' },
  '2': { en: 'Pending Confirmation', th: 'รอยืนยันข้อมูล' },
  '3': { en: 'Pending Initial Payment', th: 'รอชำระเงินงวดแรก' },
  '4': { en: 'Incorrect Information', th: 'ข้อมูลไม่ถูกต้อง' },
  '5': { en: 'Vehicle Inspection Failed', th: 'ตรวจสภาพรถไม่ผ่าน' },
  '6': { en: 'Insurer Rejected', th: 'บริษัทประกันปฏิเสธ' },
  '7': { en: 'Other (External)', th: 'อื่นๆ (ภายนอก)' },
  '8': { en: 'Incorrect Commission', th: 'ค่าคอมมิชชั่นไม่ถูกต้อง' },
  '9': { en: 'Wrong Lead Type', th: 'แจ้งงานผิดประเภท' },
  '10': { en: 'Other (Internal)', th: 'อื่นๆ (ภายใน)' },
};

// Helper to generate realistic history log entries based on lead's journey stage
function generateHistoryLog(lead: Partial<Lead>, hasRework: boolean, createdOn: string): HistoryLogEntry[] {
  const logs: HistoryLogEntry[] = [];
  const agent = lead.agentName || 'System';
  let minuteOffset = 0;
  
  // Helper to add time offset
  const getTime = (additionalMinutes: number = 0) => {
    minuteOffset += additionalMinutes;
    return addMinutes(createdOn, minuteOffset);
  };

  // ===== STAGE 1: Lead Created =====
  logs.push({
    id: `hl-${lead.id}-created`,
    action: 'lead_created',
    triggeredBy: lead.createdBy === 'agent' ? agent : 'Admin',
    triggeredAt: getTime(0),
  });

  // ===== STAGE 2: RF Assigned (auto round-robin) =====
  if (lead.rfAssignee) {
    logs.push({
      id: `hl-${lead.id}-rf-assign`,
      action: 'assignee_changed',
      triggeredBy: 'System (Round Robin)',
      triggeredAt: getTime(2),
      assigneeType: 'rf',
      fromAssignee: undefined,
      toAssignee: lead.rfAssignee,
    });
  }

  // ===== STAGE 3: SC Claims the lead =====
  if (lead.scAssignee) {
    logs.push({
      id: `hl-${lead.id}-sc-claim`,
      action: 'assignee_changed',
      triggeredBy: lead.scAssignee,
      triggeredAt: getTime(15 + Math.floor(Math.random() * 30)),
      assigneeType: 'sc',
      fromAssignee: undefined,
      toAssignee: lead.scAssignee,
    });
  }

  // ===== STAGE 4: RF transfers to SC (for to_convert onwards) =====
  if (lead.rfStatus === 'transferred' || lead.rfStatus === 'completed') {
    logs.push({
      id: `hl-${lead.id}-rf-transfer`,
      action: 'rf_status_changed',
      triggeredBy: lead.rfAssignee || 'System',
      triggeredAt: getTime(30 + Math.floor(Math.random() * 60)),
      fromStatus: 'pending',
      toStatus: 'transferred',
    });
  }

  // ===== STAGE 5: Status progression in to_convert stage =====
  // Simulate realistic status changes during conversion
  const conversionStatuses = ['pending', 'docs_missing', 'waiting_for_insurer', 'partially_added', 'completed', 'quotation_shared'];
  const renewalStatuses = ['price_pending', 'revision_pending', 'price_ready'];
  
  const isRenewal = lead.leadType === 'renewals';
  const statusList = isRenewal ? renewalStatuses : conversionStatuses;
  
  // For leads past to_convert, show progression through conversion
  if (lead.paymentStatus === 'paid' || lead.paymentStatus === 'partial' || lead.saleStatus === 'pending_payment') {
    // Lead has progressed past conversion - show status journey
    if (isRenewal) {
      logs.push({
        id: `hl-${lead.id}-status-1`,
        action: 'status_changed',
        triggeredBy: lead.scAssignee || lead.rfAssignee || 'System',
        triggeredAt: getTime(60),
        fromStatus: 'pending',
        toStatus: 'price_pending',
      });
      logs.push({
        id: `hl-${lead.id}-status-2`,
        action: 'status_changed',
        triggeredBy: lead.scAssignee || 'System',
        triggeredAt: getTime(120),
        fromStatus: 'price_pending',
        toStatus: 'price_ready',
      });
    } else {
      logs.push({
        id: `hl-${lead.id}-status-1`,
        action: 'status_changed',
        triggeredBy: lead.scAssignee || lead.rfAssignee || 'System',
        triggeredAt: getTime(45),
        fromStatus: 'pending',
        toStatus: 'waiting_for_insurer',
      });
      logs.push({
        id: `hl-${lead.id}-status-2`,
        action: 'status_changed',
        triggeredBy: lead.scAssignee || 'System',
        triggeredAt: getTime(180),
        fromStatus: 'waiting_for_insurer',
        toStatus: 'quotation_shared',
      });
    }
  } else if (lead.saleStatus && lead.saleStatus !== 'pending' && !['pending_review', 'pending_issuance', 'policy_issued', 'policy_delivered', 'policy_shipped', 'policy_cancelled'].includes(lead.saleStatus)) {
    // Lead is still in to_convert with a non-pending status
    logs.push({
      id: `hl-${lead.id}-status-current`,
      action: 'status_changed',
      triggeredBy: lead.scAssignee || lead.rfAssignee || 'System',
      triggeredAt: getTime(60 + Math.floor(Math.random() * 120)),
      fromStatus: 'pending',
      toStatus: lead.saleStatus,
    });
  }

  // ===== STAGE 6: Payment received (to_pay → to_report transition) =====
  if (lead.paymentStatus === 'paid') {
    logs.push({
      id: `hl-${lead.id}-payment`,
      action: 'payment_status_changed',
      triggeredBy: 'Payment System',
      triggeredAt: getTime(60),
      fromStatus: 'unpaid',
      toStatus: 'paid',
    });
    
    // Status changes to pending_payment then to pending_review
    logs.push({
      id: `hl-${lead.id}-to-pay-status`,
      action: 'status_changed',
      triggeredBy: 'System',
      triggeredAt: getTime(5),
      fromStatus: 'quotation_shared',
      toStatus: 'pending_payment',
    });
  } else if (lead.paymentStatus === 'partial') {
    logs.push({
      id: `hl-${lead.id}-payment-partial`,
      action: 'payment_status_changed',
      triggeredBy: 'Payment System',
      triggeredAt: getTime(60),
      fromStatus: 'unpaid',
      toStatus: 'partial',
    });
  }

  // ===== STAGE 7: DE Assigned (entering to_report) =====
  if (lead.deAssignee) {
    logs.push({
      id: `hl-${lead.id}-de-assign`,
      action: 'assignee_changed',
      triggeredBy: 'System (Round Robin)',
      triggeredAt: getTime(30),
      assigneeType: 'de',
      fromAssignee: undefined,
      toAssignee: lead.deAssignee,
    });
    
    // Status to pending_review
    if (['pending_review', 'pending_issuance', 'policy_issued', 'policy_delivered', 'policy_shipped'].includes(lead.saleStatus || '')) {
      logs.push({
        id: `hl-${lead.id}-to-report`,
        action: 'status_changed',
        triggeredBy: 'System',
        triggeredAt: getTime(5),
        fromStatus: 'pending_payment',
        toStatus: 'pending_review',
      });
    }
  }

  // ===== STAGE 8: to_issue - Pending Issuance =====
  if (['pending_issuance', 'policy_issued', 'policy_delivered', 'policy_shipped'].includes(lead.saleStatus || '')) {
    logs.push({
      id: `hl-${lead.id}-to-issue`,
      action: 'status_changed',
      triggeredBy: lead.deAssignee || 'System',
      triggeredAt: getTime(240 + Math.floor(Math.random() * 120)),
      fromStatus: 'pending_review',
      toStatus: 'pending_issuance',
    });
  }

  // ===== STAGE 9: Policy Attached & Issued =====
  if (lead.policyAttached) {
    logs.push({
      id: `hl-${lead.id}-policy`,
      action: 'policy_attached',
      triggeredBy: lead.deAssignee || 'System',
      triggeredAt: getTime(180 + Math.floor(Math.random() * 60)),
    });
    
    logs.push({
      id: `hl-${lead.id}-policy-issued`,
      action: 'status_changed',
      triggeredBy: lead.deAssignee || 'System',
      triggeredAt: getTime(10),
      fromStatus: 'pending_issuance',
      toStatus: 'policy_issued',
    });
  }

  // ===== STAGE 10: Shipping =====
  if (lead.shippingMethod) {
    const shippingLabels: Record<string, string> = {
      'e_policy': 'E-Policy',
      'print_by_myself': 'Print By Myself',
      'print_by_fairdee': 'Print By Fairdee',
    };
    logs.push({
      id: `hl-${lead.id}-shipping`,
      action: 'shipping_updated',
      triggeredBy: lead.deAssignee || 'System',
      triggeredAt: getTime(30),
      toStatus: shippingLabels[lead.shippingMethod] || lead.shippingMethod,
    });
  }

  // ===== STAGE 11: Delivery Complete =====
  if (lead.saleStatus === 'policy_shipped' || lead.saleStatus === 'policy_delivered') {
    logs.push({
      id: `hl-${lead.id}-shipped`,
      action: 'status_changed',
      triggeredBy: lead.deAssignee || 'Shipping System',
      triggeredAt: getTime(1440), // 1 day later
      fromStatus: 'policy_issued',
      toStatus: 'policy_shipped',
    });
    
    if (lead.saleStatus === 'policy_delivered') {
      logs.push({
        id: `hl-${lead.id}-delivered`,
        action: 'status_changed',
        triggeredBy: 'Shipping System',
        triggeredAt: getTime(2880), // 2 days later
        fromStatus: 'policy_shipped',
        toStatus: 'policy_delivered',
      });
    }
  }

  // ===== STAGE 12: Cancellation =====
  if (lead.saleStatus === 'policy_cancelled') {
    logs.push({
      id: `hl-${lead.id}-cancelled`,
      action: 'status_changed',
      triggeredBy: 'Admin',
      triggeredAt: getTime(60),
      fromStatus: lead.policyAttached ? 'policy_issued' : 'pending_review',
      toStatus: 'policy_cancelled',
    });
  }

  // ===== Rework Events (if applicable) =====
  if (hasRework && lead.reworkReasonId) {
    const reasonLabel = reworkReasonLabels[lead.reworkReasonId]?.en || 'Unknown';
    
    logs.push({
      id: `hl-${lead.id}-rework`,
      action: 'rework_created',
      triggeredBy: lead.deAssignee || lead.scAssignee || 'System',
      triggeredAt: getTime(120),
      reworkReasonId: lead.reworkReasonId,
      reworkReasonLabel: reasonLabel,
      comment: 'ต้องการข้อมูลเพิ่มเติม',
    });
  }

  return logs;
}

// Helper to add minutes to a date string
function addMinutes(dateStr: string, minutes: number): string {
  // Parse DD-MM-YYYY HH:MM format
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours, mins] = (timePart || '09:00').split(':').map(Number);
  
  const date = new Date(year, month - 1, day, hours, mins);
  date.setMinutes(date.getMinutes() + minutes);
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const generateLeads = (): Lead[] => {
  const leads: Lead[] = [];
  let id = 1;

  // Helper to generate updatedOn (slightly after createdOn)
  const generateUpdatedOn = (createdOn: string, hoursOffset: number = 2): string => {
    const [day, month, year] = createdOn.split('-').map(Number);
    const date = new Date(year, month - 1, day, 9 + hoursOffset, Math.floor(Math.random() * 60));
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // TO CONVERT (8 leads) - unconverted leads with unpaid + conversion statuses
  const newLeadsStatuses = ['pending', 'docs_missing', 'waiting_for_insurer', 'quotation_shared'];
  const coaStatuses = ['pending', 'waiting_for_insurer', 'quotation_shared'];
  const renewalStatuses = ['price_pending', 'price_ready'];

  for (let i = 0; i < 8; i++) {
    const agent = agents[i % agents.length];
    const hasSC = i % 3 !== 0;
    const createdOn = `${String(15 - i).padStart(2, '0')}-01-2026`;
    const createdOnFull = `${createdOn} 09:00`;
    
    const leadType = i % 4 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads';
    
    let saleStatus: Lead['saleStatus'];
    if (leadType === 'renewals') {
      saleStatus = renewalStatuses[i % renewalStatuses.length] as Lead['saleStatus'];
    } else if (leadType === 'coa') {
      saleStatus = coaStatuses[i % coaStatuses.length] as Lead['saleStatus'];
    } else {
      saleStatus = newLeadsStatuses[i % newLeadsStatuses.length] as Lead['saleStatus'];
    }

    // Generate insurer quotes for new_leads and coa (not renewals)
    const insurerQuotes = (leadType === 'new_leads' || leadType === 'coa') 
      ? generateInsurerQuotes(String(id), 2 + (i % 2)) // 2-3 quotes per lead
      : undefined;

    const vehicle = getRandomVehicle();
    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${200008 - i}`,
      leadType,
      leadSource: leadType === 'new_leads' ? (i % 2 === 0 ? 'system' : 'custom') : undefined,
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 8),
      vehicleDetails: vehiclePlates[i % vehiclePlates.length],
      vehicleBrand: vehicle.brand,
      vehicleSubBrand: vehicle.subBrand,
      vehicleYear: vehicle.year,
      vehicleProvince: vehicle.province,
      rfStatus: i < 2 ? 'pending' : 'transferred',
      scStatus: hasSC ? 'claimed' : 'pending',
      saleStatus,
      paymentStatus: 'unpaid',
      policyAttached: false,
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: hasSC ? scStaff[i % scStaff.length] : undefined,
      insurerQuotes,
      ...getRandomEtaStatus(i + 40),
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // TO PAY (6 leads) - with policyType and policyRecords
  // VMI and CMI always move together at To Pay stage (payment is one-go for both)
  const toPayScenarios: Array<{ policyType: PolicyType; vmiStatus: PolicyStatus; cmiStatus?: PolicyStatus }> = [
    { policyType: 'vmi_only', vmiStatus: 'pending_payment' },
    { policyType: 'vmi_only', vmiStatus: 'pending_payment' },
    { policyType: 'vmi_cmi', vmiStatus: 'pending_payment', cmiStatus: 'pending_payment' }, // Both pending
    { policyType: 'vmi_cmi', vmiStatus: 'pending_payment', cmiStatus: 'pending_payment' }, // Both pending
    { policyType: 'vmi_cmi', vmiStatus: 'pending_payment', cmiStatus: 'pending_payment' }, // Both pending (no split at To Pay)
    { policyType: 'vmi_only', vmiStatus: 'pending_payment' },
  ];

  for (let i = 0; i < toPayScenarios.length; i++) {
    const scenario = toPayScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(7 - Math.floor(i / 2)).padStart(2, '0')}-01-2026`;
    const createdOnFull = `${createdOn} 09:00`;
    const policyStartDate = `${String(15 + i).padStart(2, '0')}-02-2026`;
    
    // VMI and CMI may have slightly different start dates (within a few days)
    const cmiPolicyStartDate = Math.random() > 0.7 
      ? `${String(Math.max(1, parseInt(policyStartDate.split('-')[0]) + (Math.random() > 0.5 ? 1 : -1))).padStart(2, '0')}-02-2026`
      : policyStartDate;
    
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate)]
      : [
          generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate),
          generatePolicyRecord(`pol-${id}-cmi`, 'cmi', scenario.cmiStatus!, createdOnFull, cmiPolicyStartDate),
        ];

    const vehicle = getRandomVehicle();
    const leadType = i % 3 === 0 ? 'coa' : 'new_leads';
    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10006 - i}`,
      leadType: leadType as 'new_leads' | 'coa' | 'renewals',
      leadSource: leadType === 'new_leads' ? (i % 2 === 0 ? 'system' : 'custom') : undefined,
      paymentType: getPaymentTypeInfo(paymentMethods[i % paymentMethods.length], i).paymentType,
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 8),
      vehicleDetails: vehiclePlates[i % vehiclePlates.length],
      vehicleBrand: vehicle.brand,
      vehicleSubBrand: vehicle.subBrand,
      vehicleYear: vehicle.year,
      vehicleProvince: vehicle.province,
      ...getRandomCoverage(i),
      rfStatus: 'transferred',
      scStatus: 'claimed',
      saleStatus: 'pending_payment',
      paymentStatus: i % 3 === 0 ? 'paid' : 'unpaid',
      policyAttached: false,
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length], // Assign DE for Owner column
      policyType: scenario.policyType,
      policyRecords,
      premium: generatePremium(),
      paymentMethod: paymentMethods[i % paymentMethods.length],
      ...getRandomEtaStatus(i),
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // TO REPORT: 6 base + 1 from To Pay split = 7 max
  // Some records have Policy Endorsement with various statuses
  const endorsementStatuses: EndorsementStatus[] = ['request_created', 'request_submitted', 'request_approved', 'pending_on_ops', 'pending_finance', 'invalid'];
  
  const toReportScenarios: Array<{ policyType: PolicyType; vmiStatus: PolicyStatus; cmiStatus?: PolicyStatus }> = [
    { policyType: 'vmi_only', vmiStatus: 'pending_review' },
    { policyType: 'vmi_only', vmiStatus: 'pending_review' },
    { policyType: 'vmi_cmi', vmiStatus: 'pending_review', cmiStatus: 'pending_review' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'pending_review', cmiStatus: 'pending_review' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'pending_review', cmiStatus: 'pending_issuance' }, // Split: To Report + To Issue (1 split only)
    { policyType: 'vmi_only', vmiStatus: 'pending_review' },
  ];

  for (let i = 0; i < toReportScenarios.length; i++) {
    const scenario = toReportScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(23 - i).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 10:00`;
    const policyStartDate = `${String(1 + i).padStart(2, '0')}-10-2025`;
    
    const cmiPolicyStartDate = Math.random() > 0.7 
      ? `${String(Math.max(1, parseInt(policyStartDate.split('-')[0]) + (Math.random() > 0.5 ? 1 : -1))).padStart(2, '0')}-10-2025`
      : policyStartDate;
    
    // Add endorsement for first 2 To Report records (index 0 and 1)
    const hasEndorsement = i < 2;
    const endorsementStatus = hasEndorsement ? endorsementStatuses[i % endorsementStatuses.length] : undefined;
    
    const rfAssignee = rfStaff[i % rfStaff.length];
    const scAssignee = scStaff[i % scStaff.length];
    const deAssignee = i === 4 ? 'Pao' : deStaff[i % deStaff.length];
    const paymentMethod = paymentMethods[i % paymentMethods.length];
    
    const staffOptions = { paymentMethod, rfAssignee, scAssignee, deAssignee };
    
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate, undefined, hasEndorsement ? 'policy_endorsement' : undefined, endorsementStatus, staffOptions)]
      : [
          generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate, undefined, hasEndorsement ? 'policy_endorsement' : undefined, endorsementStatus, staffOptions),
          generatePolicyRecord(`pol-${id}-cmi`, 'cmi', scenario.cmiStatus!, createdOnFull, cmiPolicyStartDate, undefined, undefined, undefined, staffOptions),
        ];

    const vehicle = getRandomVehicle();
    const leadType2 = i % 3 === 0 ? 'coa' : 'new_leads';
    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10012 - i}`,
      leadType: leadType2 as 'new_leads' | 'coa' | 'renewals',
      leadSource: leadType2 === 'new_leads' ? (i % 2 === 0 ? 'system' : 'custom') : undefined,
      paymentType: getPaymentTypeInfo(paymentMethod, i).paymentType,
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 6 + 1),
      vehicleDetails: vehiclePlates[(i + 5) % vehiclePlates.length],
      vehicleBrand: vehicle.brand,
      vehicleSubBrand: vehicle.subBrand,
      vehicleYear: vehicle.year,
      vehicleProvince: vehicle.province,
      ...getRandomCoverage(i + 6),
      rfStatus: 'transferred',
      scStatus: 'claimed',
      saleStatus: 'pending_review',
      paymentStatus: 'paid',
      policyAttached: false,
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'admin' : 'agent',
      rfAssignee,
      scAssignee,
      deAssignee,
      policyType: scenario.policyType,
      policyRecords,
      premium: generatePremium(),
      paymentMethod,
      installmentCount: getPaymentTypeInfo(paymentMethod, i).installmentCount,
      ...getRandomEtaStatus(i + 6),
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // TO ISSUE: 6 base + 1 from To Report split = 7 max
  // Include 2 leads with rework status (one with single rework, one with multiple)
  const toIssueScenarios: Array<{ policyType: PolicyType; vmiStatus: PolicyStatus; cmiStatus?: PolicyStatus; hasRework?: boolean; multipleRework?: boolean }> = [
    { policyType: 'vmi_only', vmiStatus: 'pending_issuance' },
    { policyType: 'vmi_only', vmiStatus: 'pending_issuance', hasRework: true }, // Single rework
    { policyType: 'vmi_cmi', vmiStatus: 'pending_issuance', cmiStatus: 'pending_issuance' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'pending_issuance', cmiStatus: 'pending_issuance', hasRework: true, multipleRework: true }, // Multiple reworks
    { policyType: 'vmi_cmi', vmiStatus: 'pending_issuance', cmiStatus: 'policy_issued' }, // Split: To Issue + To Deliver (1 split only)
    { policyType: 'vmi_only', vmiStatus: 'pending_issuance' },
  ];

  for (let i = 0; i < toIssueScenarios.length; i++) {
    const scenario = toIssueScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(18 - i).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 11:00`;
    const policyStartDate = `${String(25 - i).padStart(2, '0')}-09-2025`;
    
    const cmiPolicyStartDate = Math.random() > 0.7 
      ? `${String(Math.max(1, parseInt(policyStartDate.split('-')[0]) + (Math.random() > 0.5 ? 1 : -1))).padStart(2, '0')}-09-2025`
      : policyStartDate;
    
    // Add endorsement for index 2 and 3 (VMI+CMI scenarios) with different statuses
    const hasEndorsement = i === 2 || i === 3;
    const endorsementStatus: EndorsementStatus | undefined = i === 2 ? 'pending_on_ops' : i === 3 ? 'pending_finance' : undefined;
    
    // Generate policy records - some with rework status
    // For rework records, assign different owners to test count logic
    // Assign to SC/RF based on rework config (rf_sc assignment for reasons 5,6,7)
    let policyRecords: PolicyRecord[];
    if (scenario.hasRework) {
      const reworkReasonIds = scenario.multipleRework ? ['1', '5', '6'] : ['1'];
      // For VMI rework, alternate between Pao and other staff to test count logic
      const vmiReworkOwner = i % 2 === 0 ? 'Pao' : scStaff[i % scStaff.length];
      const cmiReworkOwner = i % 2 === 0 ? scStaff[i % scStaff.length] : 'Pao'; // Opposite of VMI
      
      if (scenario.policyType === 'vmi_only') {
        policyRecords = [generatePolicyRecordWithRework(`pol-${id}-vmi`, 'vmi', 'pending_issuance', createdOnFull, policyStartDate, reworkReasonIds, undefined, vmiReworkOwner, {
          paymentMethod: paymentMethods[i % paymentMethods.length],
          rfAssignee: rfStaff[i % rfStaff.length],
          scAssignee: scStaff[i % scStaff.length],
          deAssignee: deStaff[i % deStaff.length],
        })];
      } else {
        policyRecords = [
          generatePolicyRecordWithRework(`pol-${id}-vmi`, 'vmi', 'pending_issuance', createdOnFull, policyStartDate, reworkReasonIds, undefined, vmiReworkOwner, {
            paymentMethod: paymentMethods[i % paymentMethods.length],
            rfAssignee: rfStaff[i % rfStaff.length],
            scAssignee: scStaff[i % scStaff.length],
            deAssignee: deStaff[i % deStaff.length],
          }),
          generatePolicyRecord(`pol-${id}-cmi`, 'cmi', scenario.cmiStatus!, createdOnFull, cmiPolicyStartDate),
        ];
      }
    } else {
      policyRecords = scenario.policyType === 'vmi_only'
        ? [generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate)]
        : [
            generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate, undefined, hasEndorsement ? 'policy_endorsement' : undefined, endorsementStatus),
            generatePolicyRecord(`pol-${id}-cmi`, 'cmi', scenario.cmiStatus!, createdOnFull, cmiPolicyStartDate, undefined, hasEndorsement ? 'policy_endorsement' : undefined, i === 3 ? 'request_submitted' : undefined),
          ];
    }

    const vehicle = getRandomVehicle();
    const leadType3 = i % 3 === 0 ? 'coa' : 'new_leads';
    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10018 - i}`,
      leadType: leadType3 as 'new_leads' | 'coa' | 'renewals',
      leadSource: leadType3 === 'new_leads' ? (i % 2 === 0 ? 'custom' : 'system') : undefined,
      paymentType: getPaymentTypeInfo(paymentMethods[i % paymentMethods.length], i).paymentType,
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 5 + 2),
      vehicleDetails: vehiclePlates[(i + 3) % vehiclePlates.length],
      vehicleBrand: vehicle.brand,
      vehicleSubBrand: vehicle.subBrand,
      vehicleYear: vehicle.year,
      vehicleProvince: vehicle.province,
      ...getRandomCoverage(i + 12),
      rfStatus: 'transferred',
      scStatus: 'claimed',
      saleStatus: scenario.hasRework ? 'pending_issuance' : 'pending_issuance',
      paymentStatus: 'paid',
      policyAttached: false,
      reworkRequired: scenario.hasRework || false,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType: scenario.policyType,
      policyRecords,
      premium: generatePremium(),
      paymentMethod: paymentMethods[i % paymentMethods.length],
      installmentCount: getPaymentTypeInfo(paymentMethods[i % paymentMethods.length], i).installmentCount,
      ...getRandomEtaStatus(i + 12),
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, scenario.hasRework || false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // TO DELIVER: Only policies with "Print by FairDee" go through this stage
  // E-Policy and Print by Myself skip directly to Completed
  const toDeliverScenarios: Array<{ policyType: PolicyType; vmiStatus: PolicyStatus; cmiStatus?: PolicyStatus }> = [
    { policyType: 'vmi_only', vmiStatus: 'policy_issued' },
    { policyType: 'vmi_only', vmiStatus: 'policy_issued' },
    { policyType: 'vmi_cmi', vmiStatus: 'policy_issued', cmiStatus: 'policy_issued' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'policy_issued', cmiStatus: 'policy_issued' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'policy_issued', cmiStatus: 'policy_shipped' }, // Split: To Deliver + Completed (CMI already shipped)
    { policyType: 'vmi_only', vmiStatus: 'policy_issued' },
  ];

  for (let i = 0; i < toDeliverScenarios.length; i++) {
    const scenario = toDeliverScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(12 - i).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 14:00`;
    const policyStartDate = `${String(20 - i).padStart(2, '0')}-09-2025`;
    const cmiPolicyStartDate = Math.random() > 0.7 
      ? `${String(Math.max(1, parseInt(policyStartDate.split('-')[0]) + (Math.random() > 0.5 ? 1 : -1))).padStart(2, '0')}-09-2025`
      : policyStartDate;
    
    // To Deliver stage: ALL policies here must be "print_by_fairdee"
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate, 'print_by_fairdee')]
      : [
          generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate, 'print_by_fairdee'),
          generatePolicyRecord(`pol-${id}-cmi`, 'cmi', scenario.cmiStatus!, createdOnFull, cmiPolicyStartDate, 'print_by_fairdee'),
        ];

    const vehicle = getRandomVehicle();
    const leadType4 = i % 3 === 0 ? 'coa' : 'new_leads';
    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10024 - i}`,
      leadType: leadType4 as 'new_leads' | 'coa' | 'renewals',
      leadSource: leadType4 === 'new_leads' ? (i % 2 === 0 ? 'system' : 'custom') : undefined,
      paymentType: getPaymentTypeInfo(paymentMethods[i % paymentMethods.length], i).paymentType,
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 4 + 3),
      vehicleDetails: vehiclePlates[(i + 7) % vehiclePlates.length],
      vehicleBrand: vehicle.brand,
      vehicleSubBrand: vehicle.subBrand,
      vehicleYear: vehicle.year,
      vehicleProvince: vehicle.province,
      ...getRandomCoverage(i + 18),
      rfStatus: 'transferred',
      scStatus: 'claimed',
      saleStatus: 'policy_issued',
      paymentStatus: 'paid',
      policyAttached: true,
      shippingMethod: 'print_by_fairdee', // Only print_by_fairdee goes to To Deliver
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'admin' : 'agent',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType: scenario.policyType,
      policyRecords,
      premium: generatePremium(),
      paymentMethod: paymentMethods[i % paymentMethods.length],
      installmentCount: getPaymentTypeInfo(paymentMethods[i % paymentMethods.length], i).installmentCount,
      ...getRandomEtaStatus(i + 18),
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // COMPLETED: Mix of different completion paths
  // - E-Policy & Print by Myself: policy_issued is final (skip To Deliver)
  // - Print by FairDee: policy_shipped → policy_delivered (went through To Deliver)
  const completedScenarios: Array<{ 
    policyType: PolicyType; 
    vmiStatus: PolicyStatus; 
    vmiShipping: 'e_policy' | 'print_by_myself' | 'print_by_fairdee';
    cmiStatus?: PolicyStatus;
    cmiShipping?: 'e_policy' | 'print_by_myself' | 'print_by_fairdee';
  }> = [
    // E-Policy completes at policy_issued
    { policyType: 'vmi_only', vmiStatus: 'policy_issued', vmiShipping: 'e_policy' },
    // Print by Myself completes at policy_issued
    { policyType: 'vmi_only', vmiStatus: 'policy_issued', vmiShipping: 'print_by_myself' },
    // Print by FairDee goes through shipping flow
    { policyType: 'vmi_only', vmiStatus: 'policy_shipped', vmiShipping: 'print_by_fairdee' },
    { policyType: 'vmi_only', vmiStatus: 'policy_delivered', vmiShipping: 'print_by_fairdee' },
    // VMI+CMI: VMI e-policy (issued), CMI print_by_fairdee (delivered)
    { policyType: 'vmi_cmi', vmiStatus: 'policy_issued', vmiShipping: 'e_policy', cmiStatus: 'policy_delivered', cmiShipping: 'print_by_fairdee' },
    // VMI+CMI: Both print_by_fairdee, both shipped
    { policyType: 'vmi_cmi', vmiStatus: 'policy_shipped', vmiShipping: 'print_by_fairdee', cmiStatus: 'policy_shipped', cmiShipping: 'print_by_fairdee' },
  ];

  for (let i = 0; i < completedScenarios.length; i++) {
    const scenario = completedScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(5 - Math.floor(i / 2)).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 08:00`;
    const policyStartDate = `${String(10 - i).padStart(2, '0')}-09-2025`;
    
    const cmiPolicyStartDate = Math.random() > 0.7 
      ? `${String(Math.max(1, parseInt(policyStartDate.split('-')[0]) + (Math.random() > 0.5 ? 1 : -1))).padStart(2, '0')}-09-2025`
      : policyStartDate;
    
    const rfAssignee = rfStaff[i % rfStaff.length];
    const scAssignee = scStaff[i % scStaff.length];
    const deAssignee = deStaff[i % deStaff.length];
    const paymentMethod = paymentMethods[i % paymentMethods.length];
    
    const staffOptions = { paymentMethod, rfAssignee, scAssignee, deAssignee };
    
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate, scenario.vmiShipping, undefined, undefined, staffOptions)]
      : [
          generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate, scenario.vmiShipping, undefined, undefined, staffOptions),
          generatePolicyRecord(`pol-${id}-cmi`, 'cmi', scenario.cmiStatus!, createdOnFull, cmiPolicyStartDate, scenario.cmiShipping!, undefined, undefined, staffOptions),
        ];

    const vehicle = getRandomVehicle();
    
    // Determine lead-level saleStatus based on most progressed policy
    const isDelivered = scenario.vmiStatus === 'policy_delivered' || scenario.cmiStatus === 'policy_delivered';
    const isShipped = scenario.vmiStatus === 'policy_shipped' || scenario.cmiStatus === 'policy_shipped';
    const saleStatus = isDelivered ? 'policy_delivered' : isShipped ? 'policy_shipped' : 'policy_issued';
    
    const leadType5 = i % 3 === 0 ? 'coa' : 'new_leads';
    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10030 - i}`,
      leadType: leadType5 as 'new_leads' | 'coa' | 'renewals',
      leadSource: leadType5 === 'new_leads' ? (i % 2 === 0 ? 'custom' : 'system') : undefined,
      paymentType: getPaymentTypeInfo(paymentMethod, i).paymentType,
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 7 + 1),
      vehicleDetails: vehiclePlates[(i + 2) % vehiclePlates.length],
      vehicleBrand: vehicle.brand,
      vehicleSubBrand: vehicle.subBrand,
      vehicleYear: vehicle.year,
      vehicleProvince: vehicle.province,
      ...getRandomCoverage(i + 24),
      rfStatus: 'completed',
      scStatus: 'completed',
      saleStatus: saleStatus as Lead['saleStatus'],
      paymentStatus: 'paid',
      policyAttached: true,
      shippingMethod: scenario.vmiShipping,
      trackingNumber: scenario.vmiShipping === 'print_by_fairdee' ? `TH${100000000 + i * 12345}` : undefined,
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee,
      scAssignee,
      deAssignee,
      policyType: scenario.policyType,
      policyRecords,
      premium: generatePremium(),
      paymentMethod,
      installmentCount: getPaymentTypeInfo(paymentMethod, i).installmentCount,
      ...getRandomEtaStatus(i + 24),
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // CANCELLED: 6 leads with VMI/CMI policy records - all with Policy Cancellation endorsement type and Request Approved status
  const cancelledScenarios: Array<{ policyType: PolicyType; vmiStatus: PolicyStatus; cmiStatus?: PolicyStatus }> = [
    { policyType: 'vmi_only', vmiStatus: 'policy_cancelled' },
    { policyType: 'vmi_only', vmiStatus: 'policy_cancelled' },
    { policyType: 'vmi_cmi', vmiStatus: 'policy_cancelled', cmiStatus: 'policy_cancelled' }, // Both cancelled
    { policyType: 'vmi_cmi', vmiStatus: 'policy_cancelled', cmiStatus: 'policy_cancelled' }, // Both cancelled
    { policyType: 'vmi_cmi', vmiStatus: 'policy_cancelled', cmiStatus: 'policy_delivered' }, // VMI cancelled, CMI delivered
    { policyType: 'vmi_only', vmiStatus: 'policy_cancelled' },
  ];

  for (let i = 0; i < cancelledScenarios.length; i++) {
    const scenario = cancelledScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(10 - i).padStart(2, '0')}-01-2026`;
    const createdOnFull = `${createdOn} 12:00`;
    
    const policyStartDate = `${String(15 + i).padStart(2, '0')}-01-2026`;
    
    // For cancelled policies, add Policy Cancellation endorsement with Request Approved status
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate, undefined, 'policy_cancellation', 'request_approved')]
      : [
          generatePolicyRecord(`pol-${id}-vmi`, 'vmi', scenario.vmiStatus, createdOnFull, policyStartDate, undefined, scenario.vmiStatus === 'policy_cancelled' ? 'policy_cancellation' : undefined, scenario.vmiStatus === 'policy_cancelled' ? 'request_approved' : undefined),
          generatePolicyRecord(`pol-${id}-cmi`, 'cmi', scenario.cmiStatus!, createdOnFull, policyStartDate, undefined, scenario.cmiStatus === 'policy_cancelled' ? 'policy_cancellation' : undefined, scenario.cmiStatus === 'policy_cancelled' ? 'request_approved' : undefined),
        ];

    const vehicle = getRandomVehicle();
    const leadType6 = i % 2 === 0 ? 'coa' : 'new_leads';
    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10036 - i}`,
      leadType: leadType6 as 'new_leads' | 'coa' | 'renewals',
      leadSource: leadType6 === 'new_leads' ? (i % 2 === 0 ? 'system' : 'custom') : undefined,
      paymentType: getPaymentTypeInfo(paymentMethods[i % paymentMethods.length], i).paymentType,
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 3 + 4),
      vehicleDetails: vehiclePlates[(i + 4) % vehiclePlates.length],
      vehicleBrand: vehicle.brand,
      vehicleSubBrand: vehicle.subBrand,
      vehicleYear: vehicle.year,
      vehicleProvince: vehicle.province,
      ...getRandomCoverage(i + 30),
      rfStatus: 'completed',
      scStatus: 'completed',
      saleStatus: 'policy_cancelled',
      paymentStatus: 'paid',
      policyAttached: false,
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType: scenario.policyType,
      policyRecords,
      premium: generatePremium(),
      paymentMethod: paymentMethods[i % paymentMethods.length],
      installmentCount: getPaymentTypeInfo(paymentMethods[i % paymentMethods.length], i).installmentCount,
      ...getRandomEtaStatus(i + 30),
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  return leads;
};

export const mockLeads: Lead[] = generateLeads();

export const mockReworkConfigs: ReworkConfig[] = [
  // === REWORK CONFIGS (10) — External reasons (7) + Internal reasons (3) ===
  // External reasons
  { id: '1', configType: 'rework', descriptionTh: 'เอกสารไม่ครบถ้วน', descriptionEn: 'Missing Documents', team: 'DE', teamMembers: [], automationEnabled: true, automationType: 'auto_resolve', automationDays: 3, assignment: 'round_robin', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'external', policyScope: 'both', stickyEnabled: true, stickyColumns: ['DE'] },
  { id: '2', configType: 'rework', descriptionTh: 'รอยืนยันข้อมูล', descriptionEn: 'Pending Confirmation', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'external', policyScope: 'both', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: '3', configType: 'rework', descriptionTh: 'รอชำระเงินงวดแรก', descriptionEn: 'Pending Initial Payment', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'external', policyScope: 'both', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: '4', configType: 'rework', descriptionTh: 'ข้อมูลไม่ถูกต้อง', descriptionEn: 'Incorrect Information', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'external', policyScope: 'both', stickyEnabled: true, stickyColumns: ['Admin'] },
  { id: '5', configType: 'rework', descriptionTh: 'ตรวจสภาพรถไม่ผ่าน', descriptionEn: 'Vehicle Inspection Failed', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'external', policyScope: 'both', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: '6', configType: 'rework', descriptionTh: 'บริษัทประกันปฏิเสธ', descriptionEn: 'Insurer Rejected', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'external', policyScope: 'both', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: '7', configType: 'rework', descriptionTh: 'อื่นๆ (ภายนอก)', descriptionEn: 'Other (External)', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'external', policyScope: 'both', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  // Internal reasons
  { id: '8', configType: 'rework', descriptionTh: 'ค่าคอมมิชชั่นไม่ถูกต้อง', descriptionEn: 'Incorrect Commission', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: '9', configType: 'rework', descriptionTh: 'แจ้งงานผิดประเภท', descriptionEn: 'Wrong Lead Type', team: 'DE', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', stickyEnabled: false, stickyColumns: [] },
  { id: '10', configType: 'rework', descriptionTh: 'อื่นๆ (ภายใน)', descriptionEn: 'Other (Internal)', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },

  // === ENDORSEMENT CONFIGS (12) — Policy Endorsement + Policy Cancellation ===
  { id: 'endo-1', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'requestor', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_endorsement', endorsementConfigStatus: 'request_created', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-2', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_endorsement', endorsementConfigStatus: 'request_submitted', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-3', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_endorsement', endorsementConfigStatus: 'request_approved', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-4', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'requestor', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_endorsement', endorsementConfigStatus: 'pending_on_ops', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-5', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_endorsement', endorsementConfigStatus: 'pending_finance', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-6', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_endorsement', endorsementConfigStatus: 'invalid', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-7', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'requestor', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_cancellation', endorsementConfigStatus: 'request_created', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-8', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: true, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_cancellation', endorsementConfigStatus: 'request_submitted', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-9', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: true, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_cancellation', endorsementConfigStatus: 'request_approved', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-10', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'requestor', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: true, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_cancellation', endorsementConfigStatus: 'pending_on_ops', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-11', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: true, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_cancellation', endorsementConfigStatus: 'pending_finance', stickyEnabled: false, stickyColumns: [] },
  { id: 'endo-12', configType: 'endorsement', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', endorsementConfigType: 'policy_cancellation', endorsementConfigStatus: 'invalid', stickyEnabled: false, stickyColumns: [] },

  // === DEFAULT LEAD CONFIGS (7) — pre-seeded per US-25a ===
  { id: 'lead-1', configType: 'lead', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'pending', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'lead-2', configType: 'lead', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'docs_missing', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'lead-3', configType: 'lead', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'waiting_for_insurer', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'lead-4', configType: 'lead', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'quotation_shared', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'lead-5', configType: 'lead', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'partially_added', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'lead-6', configType: 'lead', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'completed', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'lead-7', configType: 'lead', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'invalid', stickyEnabled: false, stickyColumns: [] },

  // === DEFAULT RENEWAL CONFIGS (5) — pre-seeded per US-25a ===
  { id: 'renew-1', configType: 'renewal', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'price_pending', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'renew-2', configType: 'renewal', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'revision_pending', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'renew-3', configType: 'renewal', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'price_ready', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'renew-4', configType: 'renewal', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'revision_required', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'renew-5', configType: 'renewal', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'renewal_rejected', stickyEnabled: false, stickyColumns: [] },

  // === DEFAULT POLICY CONFIGS (13) — pre-seeded per US-25a ===
  { id: 'pol-1', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'pending_payment', stickyEnabled: true, stickyColumns: ['SC', 'RF'] },
  { id: 'pol-2', configType: 'policy', descriptionTh: '', descriptionEn: '', team: 'DE', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'pending_review', stickyEnabled: true, stickyColumns: ['DE'] },
  { id: 'pol-3', configType: 'policy', descriptionTh: '', descriptionEn: '', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'pending_issuance', issuanceMethod: 'email', stickyEnabled: true, stickyColumns: ['Admin'] },
  { id: 'pol-4', configType: 'policy', descriptionTh: '', descriptionEn: '', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'pending_issuance', issuanceMethod: 'manual', stickyEnabled: true, stickyColumns: ['Admin'] },
  { id: 'pol-5', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'pending_issuance', issuanceMethod: 'api', stickyEnabled: false, stickyColumns: [] },
  { id: 'pol-6', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'policy_issued', deliveryMethod: 'print_by_fairdee', stickyEnabled: false, stickyColumns: [] },
  { id: 'pol-7', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'policy_issued', deliveryMethod: 'print_by_myself', stickyEnabled: false, stickyColumns: [] },
  { id: 'pol-8', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'policy_issued', deliveryMethod: 'e_policy', stickyEnabled: false, stickyColumns: [] },
  { id: 'pol-9', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'policy_shipped', deliveryMethod: 'print_by_fairdee', stickyEnabled: false, stickyColumns: [] },
  { id: 'pol-10', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'policy_shipped', deliveryMethod: 'print_by_myself', stickyEnabled: false, stickyColumns: [] },
  { id: 'pol-11', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'policy_shipped', deliveryMethod: 'e_policy', stickyEnabled: false, stickyColumns: [] },
  { id: 'pol-12', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'policy_delivered', stickyEnabled: false, stickyColumns: [] },
  { id: 'pol-13', configType: 'policy', descriptionTh: '', descriptionEn: '', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'], movesToCancellation: false, partyType: 'internal', policyScope: 'both', statusFilter: 'policy_cancelled', stickyEnabled: false, stickyColumns: [] },
];

export const teams = ['AST RF', 'AST SC', 'DE', 'Admin', 'Delivery'];
