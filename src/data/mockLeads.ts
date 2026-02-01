import { Lead, ReworkConfig, HistoryLogEntry, PolicyType, PolicyRecord, PolicyStatus } from '@/types/pipeline';

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

// Current user constant
export const CURRENT_USER = 'Pao';
const vehiclePlates = ['2มว7814', '2ศย8965', 'KL4521', 'PQ8823', 'AB1234', 'CD5678', 'EF9012', 'GH3456', 'IJ7890', 'MN6789', 'OP1234', 'QR5678'];

// Rework reason labels mapping
const reworkReasonLabels: Record<string, { en: string; th: string }> = {
  '1': { en: 'Missing Documents', th: 'เอกสารไม่ครบ' },
  '2': { en: 'Pending Confirmation', th: 'รอยืนยันข้อมูล' },
  '3': { en: 'Pending Verification', th: 'รอตรวจสอบ' },
  '4': { en: 'Pending Initial Payment', th: 'รองวดแรก' },
  '5': { en: 'Pre-submission: Return to AST', th: 'ตีกลับก่อนแจ้งงาน' },
  '6': { en: 'Reverted by Insurer', th: 'บ.ประกันตีกลับ' },
  '7': { en: 'Rejected by Insurer', th: 'บ.ประกันปฎิเสธ' },
  '8': { en: 'Pending Re-submission', th: 'รอแจ้งงานอีกครั้ง' },
  '9': { en: 'Return to OPS', th: 'ตีกลับให้ OPS' },
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

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10170 - i}`,
      leadType,
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 8),
      vehicleDetails: vehiclePlates[i % vehiclePlates.length],
      rfStatus: i < 2 ? 'pending' : 'transferred',
      scStatus: hasSC ? 'claimed' : 'pending',
      saleStatus,
      paymentStatus: 'unpaid',
      policyAttached: false,
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: hasSC ? scStaff[i % scStaff.length] : undefined,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // TO PAY (8 leads) - with policyType and policyRecords
  // TO PAY: 6 base records (no splits from here to avoid overflow in other stages)
  const toPayScenarios: Array<{ policyType: PolicyType; vmiStatus: PolicyStatus; cmiStatus?: PolicyStatus }> = [
    { policyType: 'vmi_only', vmiStatus: 'pending_payment' },
    { policyType: 'vmi_only', vmiStatus: 'pending_payment' },
    { policyType: 'vmi_cmi', vmiStatus: 'pending_payment', cmiStatus: 'pending_payment' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'pending_payment', cmiStatus: 'pending_payment' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'pending_payment', cmiStatus: 'pending_review' }, // Split: To Pay + To Report (1 split only)
    { policyType: 'vmi_only', vmiStatus: 'pending_payment' },
  ];

  for (let i = 0; i < toPayScenarios.length; i++) {
    const scenario = toPayScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(7 - Math.floor(i / 2)).padStart(2, '0')}-01-2026`;
    const createdOnFull = `${createdOn} 09:00`;
    const policyStartDate = `${String(15 + i).padStart(2, '0')}-02-2026`;
    
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [{ id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: false, updatedOn: createdOnFull, policyStartDate }]
      : [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: false, updatedOn: createdOnFull, policyStartDate },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: scenario.cmiStatus!, policyAttached: scenario.cmiStatus === 'policy_issued' || scenario.cmiStatus === 'policy_delivered', updatedOn: createdOnFull, policyStartDate },
        ];

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10154 - i}`,
      leadType: i % 3 === 0 ? 'coa' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 8),
      vehicleDetails: vehiclePlates[i % vehiclePlates.length],
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
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // TO REPORT: 6 base + 1 from To Pay split = 7 max
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
    
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [{ id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: false, updatedOn: createdOnFull, policyStartDate }]
      : [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: false, updatedOn: createdOnFull, policyStartDate },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: scenario.cmiStatus!, policyAttached: scenario.cmiStatus === 'policy_issued' || scenario.cmiStatus === 'policy_delivered', updatedOn: createdOnFull, policyStartDate },
        ];

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10143 - i}`,
      leadType: i % 3 === 0 ? 'coa' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 6 + 1),
      vehicleDetails: vehiclePlates[(i + 5) % vehiclePlates.length],
      rfStatus: 'transferred',
      scStatus: 'claimed',
      saleStatus: 'pending_review',
      paymentStatus: 'paid',
      policyAttached: false,
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'admin' : 'agent',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType: scenario.policyType,
      policyRecords,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // TO ISSUE: 6 base + 1 from To Report split = 7 max
  const toIssueScenarios: Array<{ policyType: PolicyType; vmiStatus: PolicyStatus; cmiStatus?: PolicyStatus }> = [
    { policyType: 'vmi_only', vmiStatus: 'pending_issuance' },
    { policyType: 'vmi_only', vmiStatus: 'pending_issuance' },
    { policyType: 'vmi_cmi', vmiStatus: 'pending_issuance', cmiStatus: 'pending_issuance' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'pending_issuance', cmiStatus: 'pending_issuance' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'pending_issuance', cmiStatus: 'policy_issued' }, // Split: To Issue + To Deliver (1 split only)
    { policyType: 'vmi_only', vmiStatus: 'pending_issuance' },
  ];

  for (let i = 0; i < toIssueScenarios.length; i++) {
    const scenario = toIssueScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(18 - i).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 11:00`;
    const policyStartDate = `${String(25 - i).padStart(2, '0')}-09-2025`;
    
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [{ id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: false, updatedOn: createdOnFull, policyStartDate }]
      : [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: false, updatedOn: createdOnFull, policyStartDate },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: scenario.cmiStatus!, policyAttached: scenario.cmiStatus === 'policy_issued' || scenario.cmiStatus === 'policy_delivered', updatedOn: createdOnFull, policyStartDate },
        ];

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10135 - i}`,
      leadType: i % 3 === 0 ? 'coa' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 5 + 2),
      vehicleDetails: vehiclePlates[(i + 3) % vehiclePlates.length],
      rfStatus: 'transferred',
      scStatus: 'claimed',
      saleStatus: 'pending_issuance',
      paymentStatus: 'paid',
      policyAttached: false,
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType: scenario.policyType,
      policyRecords,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // TO DELIVER: 6 base + 1 from To Issue split = 7 max
  const shippingMethods: Array<'print_by_fairdee' | 'e_policy' | 'print_by_myself'> = ['print_by_fairdee', 'e_policy', 'print_by_myself'];
  const toDeliverScenarios: Array<{ policyType: PolicyType; vmiStatus: PolicyStatus; cmiStatus?: PolicyStatus }> = [
    { policyType: 'vmi_only', vmiStatus: 'policy_issued' },
    { policyType: 'vmi_only', vmiStatus: 'policy_issued' },
    { policyType: 'vmi_cmi', vmiStatus: 'policy_issued', cmiStatus: 'policy_issued' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'policy_issued', cmiStatus: 'policy_issued' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'policy_issued', cmiStatus: 'policy_delivered' }, // Split: To Deliver + Completed (1 split only)
    { policyType: 'vmi_only', vmiStatus: 'policy_issued' },
  ];

  for (let i = 0; i < toDeliverScenarios.length; i++) {
    const scenario = toDeliverScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(12 - i).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 14:00`;
    const policyStartDate = `${String(20 - i).padStart(2, '0')}-09-2025`;
    const policyUploadedOn = `${String(14 - i).padStart(2, '0')}-09-2025 16:30`;
    
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [{ id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: true, shippingMethod: shippingMethods[i % 3], updatedOn: createdOnFull, policyUploadedOn, policyStartDate }]
      : [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: true, shippingMethod: shippingMethods[i % 3], updatedOn: createdOnFull, policyUploadedOn, policyStartDate },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: scenario.cmiStatus!, policyAttached: scenario.cmiStatus === 'policy_issued' || scenario.cmiStatus === 'policy_delivered', shippingMethod: scenario.cmiStatus === 'policy_issued' || scenario.cmiStatus === 'policy_delivered' ? shippingMethods[(i + 1) % 3] : undefined, updatedOn: createdOnFull, policyUploadedOn: scenario.cmiStatus === 'policy_issued' || scenario.cmiStatus === 'policy_delivered' ? policyUploadedOn : undefined, policyStartDate },
        ];

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10128 - i}`,
      leadType: i % 3 === 0 ? 'coa' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 4 + 3),
      vehicleDetails: vehiclePlates[(i + 7) % vehiclePlates.length],
      rfStatus: 'transferred',
      scStatus: 'claimed',
      saleStatus: 'policy_issued',
      paymentStatus: 'paid',
      policyAttached: true,
      shippingMethod: shippingMethods[i % 3],
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'admin' : 'agent',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType: scenario.policyType,
      policyRecords,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // COMPLETED: 6 base + 1 from To Deliver split = 7 max
  const completedScenarios: Array<{ policyType: PolicyType; vmiStatus: PolicyStatus; cmiStatus?: PolicyStatus }> = [
    { policyType: 'vmi_only', vmiStatus: 'policy_delivered' },
    { policyType: 'vmi_only', vmiStatus: 'policy_shipped' },
    { policyType: 'vmi_cmi', vmiStatus: 'policy_delivered', cmiStatus: 'policy_delivered' }, // Both same stage
    { policyType: 'vmi_cmi', vmiStatus: 'policy_shipped', cmiStatus: 'policy_shipped' }, // Both same stage
    { policyType: 'vmi_only', vmiStatus: 'policy_delivered' },
    { policyType: 'vmi_only', vmiStatus: 'policy_shipped' },
  ];

  for (let i = 0; i < completedScenarios.length; i++) {
    const scenario = completedScenarios[i];
    const agent = agents[i % agents.length];
    const createdOn = `${String(5 - Math.floor(i / 2)).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 08:00`;
    const policyStartDate = `${String(10 - i).padStart(2, '0')}-09-2025`;
    const policyUploadedOn = `${String(7 - Math.floor(i / 2)).padStart(2, '0')}-09-2025 10:00`;
    
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [{ id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: true, shippingMethod: shippingMethods[i % 3], trackingNumber: `TH${100000000 + i * 12345}`, updatedOn: createdOnFull, policyUploadedOn, policyStartDate }]
      : [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: true, shippingMethod: 'e_policy', updatedOn: createdOnFull, policyUploadedOn, policyStartDate },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: scenario.cmiStatus!, policyAttached: true, shippingMethod: 'print_by_fairdee', trackingNumber: `TH${100000000 + i * 12345}`, updatedOn: createdOnFull, policyUploadedOn, policyStartDate },
        ];

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10120 - i}`,
      leadType: i % 3 === 0 ? 'coa' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 7 + 1),
      vehicleDetails: vehiclePlates[(i + 2) % vehiclePlates.length],
      rfStatus: 'completed',
      scStatus: 'completed',
      saleStatus: scenario.vmiStatus === 'policy_delivered' ? 'policy_delivered' : 'policy_shipped',
      paymentStatus: 'paid',
      policyAttached: true,
      shippingMethod: shippingMethods[i % 3],
      trackingNumber: `TH${100000000 + i * 12345}`,
      reworkRequired: false,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType: scenario.policyType,
      policyRecords,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, false, createdOnFull),
      reworkHistory: [],
    } as Lead);
    id++;
  }

  // CANCELLED: 6 leads with VMI/CMI policy records
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
    
    const policyRecords: PolicyRecord[] = scenario.policyType === 'vmi_only'
      ? [{ id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: false }]
      : [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: scenario.vmiStatus, policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: scenario.cmiStatus!, policyAttached: scenario.cmiStatus === 'policy_delivered' },
        ];

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10108 - i}`,
      leadType: i % 2 === 0 ? 'coa' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 3 + 4),
      vehicleDetails: vehiclePlates[(i + 4) % vehiclePlates.length],
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
  { id: '1', descriptionTh: 'ขาดเอกสาร', descriptionEn: 'Missing Documents', team: '', teamMembers: [], automationEnabled: true, automationDays: 8, targetReason: '15', assignment: 'rf_sc', stages: ['to_pay', 'to_report'] },
  { id: '2', descriptionTh: 'ต้องการคอนเฟิร์ม', descriptionEn: 'Pending Confirmation', team: '', teamMembers: [], automationEnabled: true, automationDays: 8, targetReason: '15', assignment: 'rf_sc', stages: ['to_pay', 'to_report'] },
  { id: '3', descriptionTh: 'รอยืนยันตัวตน', descriptionEn: 'Pending Verification', team: '', teamMembers: [], automationEnabled: true, automationDays: 8, targetReason: '15', assignment: 'rf_sc', stages: ['to_pay', 'to_report'] },
  { id: '4', descriptionTh: 'รอจ่ายงวดแรก', descriptionEn: 'Pending Initial Payment', team: '', teamMembers: [], automationEnabled: true, automationDays: 8, targetReason: '15', assignment: 'rf_sc', stages: ['to_pay', 'to_report'] },
  { id: '5', descriptionTh: 'แจ้งงานก่อน ตีกลับให้ AST', descriptionEn: 'Pre-submission: Return to AST', team: '', teamMembers: [], automationEnabled: false, assignment: 'rf_sc', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '6', descriptionTh: 'บ.ประกันตีกลับ', descriptionEn: 'Reverted by Insurer', team: '', teamMembers: [], automationEnabled: false, assignment: 'rf_sc', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '7', descriptionTh: 'บ.ประกันปฎิเสธ', descriptionEn: 'Rejected by Insurer', team: '', teamMembers: [], automationEnabled: false, assignment: 'rf_sc', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '8', descriptionTh: 'รอแจ้งงานอีกครั้ง', descriptionEn: 'Pending Re-submission', team: '', teamMembers: [], automationEnabled: false, assignment: 'rf_sc', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '9', descriptionTh: 'ตีกลับให้ OPS', descriptionEn: 'Return to OPS', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '10', descriptionTh: 'แจ้งประกันแล้ว รอพิจารณา', descriptionEn: 'Submitted to Insurer: Under Review', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '11', descriptionTh: 'รอแจ้งประกันยกเลิก รอเอกสาร', descriptionEn: 'Pending Cancellation: Awaiting Documents', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '12', descriptionTh: 'รอแจ้งประกันยกเลิก เอกสารครบ', descriptionEn: 'Pending Cancellation: Documents Complete', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '13', descriptionTh: 'แจ้งประกันยกเลิกแล้ว รอเอกสาร', descriptionEn: 'Cancellation Submitted: Awaiting Documents', team: '', teamMembers: [], automationEnabled: false, assignment: 'rf_sc', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '14', descriptionTh: 'แจ้งประกันยกเลิกแล้ว เอกสารครบ', descriptionEn: 'Cancellation Submitted: Documents Complete', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '15', descriptionTh: 'รอยกเลิก', descriptionEn: 'Pending Cancellation', team: '', teamMembers: [], automationEnabled: false, assignment: 'rf_sc', stages: ['to_pay', 'to_report'] },
  { id: '16', descriptionTh: 'ยกเลิก', descriptionEn: 'Cancelled', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report'] },
  
];

export const teams = ['AST RF', 'AST SC', 'DE', 'Admin'];
