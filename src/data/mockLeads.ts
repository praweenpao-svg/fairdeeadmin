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

  // TO CONVERT (10 leads) - unconverted leads with unpaid + conversion statuses
  // Statuses for new_leads
  const newLeadsStatuses = ['pending', 'docs_missing', 'waiting_for_insurer', 'partially_added', 'completed', 'quotation_shared'];
  // Statuses for COA (no 'partially_added')
  const coaStatuses = ['pending', 'docs_missing', 'waiting_for_insurer', 'completed', 'quotation_shared'];
  // Statuses for renewals
  const renewalStatuses = ['price_pending', 'revision_pending', 'renewal_rejected', 'price_ready'];

  for (let i = 0; i < 10; i++) {
    const agent = agents[i % agents.length];
    const hasSC = i % 3 !== 0;
    const createdOn = `${String(15 - i).padStart(2, '0')}-01-2026`;
    const createdOnFull = `${createdOn} 09:00`;
    
    // Determine lead type: COA every 3rd, Renewals every 5th, otherwise New Leads
    const leadType = i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads';
    
    // Use appropriate statuses based on lead type
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

  // TO PAY (15 leads) - with policyType and policyRecords (some with split statuses)
  for (let i = 0; i < 15; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 13;
    const hasSC = i % 3 !== 0;
    const createdOn = `${String(7 - Math.floor(i / 3)).padStart(2, '0')}-01-2026`;
    const createdOnFull = `${createdOn} 09:00`;
    
    // Alternate between vmi_only and vmi_cmi with varying statuses
    const policyType: PolicyType = i % 3 === 0 ? 'vmi_cmi' : 'vmi_only';
    let policyRecords: PolicyRecord[];
    
    if (policyType === 'vmi_only') {
      policyRecords = [{ id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_payment', policyAttached: false }];
    } else {
      // For vmi_cmi, create split statuses so sale appears in multiple tabs
      if (i === 0) {
        // VMI pending payment, CMI already in review (shows in To Pay + To Report)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_payment', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_review', policyAttached: false },
        ];
      } else if (i === 3) {
        // VMI pending payment, CMI pending issuance (shows in To Pay + To Issue)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_payment', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_issuance', policyAttached: false },
        ];
      } else if (i === 6) {
        // VMI pending payment, CMI already issued (shows in To Pay + To Deliver)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_payment', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'policy_issued', policyAttached: true },
        ];
      } else if (i === 9) {
        // VMI pending payment, CMI delivered (shows in To Pay + Completed)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_payment', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'policy_delivered', policyAttached: true },
        ];
      } else {
        // Both pending payment
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_payment', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_payment', policyAttached: false },
        ];
      }
    }

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10154 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 8),
      vehicleDetails: vehiclePlates[i % vehiclePlates.length],
      rfStatus: i < 2 ? 'pending' : 'transferred',
      scStatus: hasSC ? 'claimed' : 'pending',
      // To Pay: pending_payment status
      saleStatus: 'pending_payment',
      paymentStatus: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'partial' : 'unpaid',
      policyAttached: false,
      reworkRequired: hasRework,
      reworkReasonId: hasRework ? String((i % 4) + 1) : undefined,
      assignedTo: hasRework ? (hasSC ? scStaff[i % scStaff.length] : rfStaff[i % rfStaff.length]) : undefined,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: hasSC ? scStaff[i % scStaff.length] : undefined,
      policyType,
      policyRecords,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, hasRework, createdOnFull),
      reworkHistory: hasRework ? [{ id: `rh-pay-${i}`, reasonId: String((i % 4) + 1), reasonLabel: 'Missing Documents', details: 'Need info', attachments: [], savedBy: 'System', savedAt: 'Jan 5, 2026, 10:00 AM', previousStatus: 'pending' }] : [],
    } as Lead);
    id++;
  }

  // TO REPORT (15 leads) - with policyType and policyRecords
  for (let i = 0; i < 15; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 13;
    const hasSC = i % 4 !== 0;
    const createdOn = `${String(23 - i).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 10:00`;

    // Alternate between vmi_only and vmi_cmi with varying statuses
    const policyType: PolicyType = i % 4 === 0 ? 'vmi_cmi' : 'vmi_only';
    let policyRecords: PolicyRecord[];
    
    if (policyType === 'vmi_only') {
      policyRecords = [{ id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_review', policyAttached: false }];
    } else {
      // For vmi_cmi, create split statuses
      if (i === 0) {
        // VMI in review, CMI pending issuance (shows in To Report + To Issue)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_review', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_issuance', policyAttached: false },
        ];
      } else if (i === 4) {
        // VMI in review, CMI already issued (shows in To Report + To Deliver)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_review', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'policy_issued', policyAttached: true },
        ];
      } else if (i === 8) {
        // VMI in review, CMI delivered (shows in To Report + Completed)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_review', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'policy_delivered', policyAttached: true },
        ];
      } else {
        // Both pending review
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_review', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_review', policyAttached: false },
        ];
      }
    }

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10143 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
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
      reworkRequired: hasRework,
      reworkReasonId: hasRework ? String((i % 4) + 1) : undefined,
      assignedTo: hasRework ? scStaff[i % scStaff.length] : undefined,
      createdBy: i % 2 === 0 ? 'admin' : 'agent',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: hasSC ? scStaff[i % scStaff.length] : undefined,
      deAssignee: deStaff[i % deStaff.length],
      policyType,
      policyRecords,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, hasRework, createdOnFull),
      reworkHistory: hasRework ? [{ id: `rh-report-${i}`, reasonId: String((i % 4) + 1), reasonLabel: 'Missing Documents', details: 'Verification needed', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 20, 2025, 11:00 AM', previousStatus: 'pending_review' }] : [],
    } as Lead);
    id++;
  }

  // TO ISSUE (12 leads) - with policyType and policyRecords (some with split statuses)
  for (let i = 0; i < 12; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 10;
    const createdOn = `${String(18 - i).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 11:00`;

    // Mix of vmi_only and vmi_cmi with varying statuses
    const policyType: PolicyType = i % 3 === 0 ? 'vmi_cmi' : 'vmi_only';
    let policyRecords: PolicyRecord[];
    
    if (policyType === 'vmi_only') {
      policyRecords = [{ id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_issuance', policyAttached: false }];
    } else {
      // For vmi_cmi, show some with different statuses to demonstrate split appearance
      if (i === 0) {
        // VMI in To Issue, CMI already issued (shows in To Issue + To Deliver)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_issuance', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'policy_issued', policyAttached: true },
        ];
      } else if (i === 3) {
        // VMI in To Issue, CMI already delivered (shows in To Issue + Completed)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_issuance', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'policy_delivered', policyAttached: true },
        ];
      } else if (i === 6) {
        // VMI in To Issue, CMI pending review (shows in To Issue + To Report)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_issuance', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_review', policyAttached: false },
        ];
      } else if (i === 9) {
        // VMI in To Issue, CMI pending payment (shows in To Issue + To Pay)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_issuance', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_payment', policyAttached: false },
        ];
      } else {
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'pending_issuance', policyAttached: false },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_issuance', policyAttached: false },
        ];
      }
    }

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10135 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
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
      reworkRequired: hasRework,
      reworkReasonId: hasRework ? '5' : undefined,
      assignedTo: hasRework ? scStaff[i % scStaff.length] : undefined,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType,
      policyRecords,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, hasRework, createdOnFull),
      reworkHistory: hasRework ? [{ id: `rh-issue-${i}`, reasonId: '5', reasonLabel: 'Return to AST', details: 'Issue pending', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 15, 2025, 09:00 AM', previousStatus: 'pending_issuance' }] : [],
    } as Lead);
    id++;
  }

  // TO DELIVER (12 leads) - with policyType and policyRecords (some with split statuses)
  for (let i = 0; i < 12; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 10;
    const shippingMethods: Array<'print_by_fairdee' | 'e_policy' | 'print_by_myself'> = ['print_by_fairdee', 'e_policy', 'print_by_myself'];
    const createdOn = `${String(12 - Math.floor(i / 2)).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 14:00`;

    // Mix of vmi_only and vmi_cmi with varying statuses
    const policyType: PolicyType = i % 3 === 0 ? 'vmi_cmi' : 'vmi_only';
    let policyRecords: PolicyRecord[];
    
    if (policyType === 'vmi_only') {
      policyRecords = [{ 
        id: `pol-${id}-vmi`, 
        kind: 'vmi', 
        status: 'policy_issued', 
        policyAttached: true,
        shippingMethod: shippingMethods[i % 3],
      }];
    } else {
      // For vmi_cmi, show different statuses
      if (i === 0) {
        // VMI to deliver, CMI already delivered (shows in To Deliver + Completed)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'policy_issued', policyAttached: true, shippingMethod: 'print_by_fairdee' },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'policy_delivered', policyAttached: true, shippingMethod: 'e_policy' },
        ];
      } else if (i === 3) {
        // VMI to deliver, CMI pending issuance (shows in To Deliver + To Issue)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'policy_issued', policyAttached: true, shippingMethod: 'print_by_fairdee' },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_issuance', policyAttached: false },
        ];
      } else if (i === 6) {
        // VMI to deliver, CMI pending review (shows in To Deliver + To Report)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'policy_issued', policyAttached: true, shippingMethod: 'e_policy' },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_review', policyAttached: false },
        ];
      } else if (i === 9) {
        // VMI to deliver, CMI pending payment (shows in To Deliver + To Pay)
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'policy_issued', policyAttached: true, shippingMethod: 'print_by_myself' },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'pending_payment', policyAttached: false },
        ];
      } else {
        policyRecords = [
          { id: `pol-${id}-vmi`, kind: 'vmi', status: 'policy_issued', policyAttached: true, shippingMethod: shippingMethods[i % 3] },
          { id: `pol-${id}-cmi`, kind: 'cmi', status: 'policy_issued', policyAttached: true, shippingMethod: shippingMethods[(i + 1) % 3] },
        ];
      }
    }

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10128 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
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
      reworkRequired: hasRework,
      reworkReasonId: hasRework ? '6' : undefined,
      assignedTo: hasRework ? scStaff[i % scStaff.length] : undefined,
      createdBy: i % 2 === 0 ? 'admin' : 'agent',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType,
      policyRecords,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, hasRework, createdOnFull),
      reworkHistory: hasRework ? [{ id: `rh-deliver-${i}`, reasonId: '6', reasonLabel: 'Reverted by Insurer', details: 'Delivery issue', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 09, 2025, 04:00 PM', previousStatus: 'policy_issued' }] : [],
    } as Lead);
    id++;
  }

  // COMPLETED (12 leads) - with policyType and policyRecords
  for (let i = 0; i < 12; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 10;
    const shippingMethods: Array<'print_by_fairdee' | 'e_policy' | 'print_by_myself'> = ['print_by_fairdee', 'e_policy', 'print_by_myself'];
    const createdOn = `${String(5 - Math.floor(i / 3)).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 08:00`;

    // Mix of vmi_only and vmi_cmi
    const policyType: PolicyType = i % 4 === 0 ? 'vmi_cmi' : 'vmi_only';
    const completedStatus: PolicyStatus = i % 2 === 0 ? 'policy_delivered' : 'policy_shipped';
    let policyRecords: PolicyRecord[];
    
    if (policyType === 'vmi_only') {
      policyRecords = [{ 
        id: `pol-${id}-vmi`, 
        kind: 'vmi', 
        status: completedStatus, 
        policyAttached: true,
        shippingMethod: shippingMethods[i % 3],
        trackingNumber: `TH${100000000 + i * 12345}`,
      }];
    } else {
      policyRecords = [
        { id: `pol-${id}-vmi`, kind: 'vmi', status: 'policy_delivered', policyAttached: true, shippingMethod: 'e_policy' },
        { id: `pol-${id}-cmi`, kind: 'cmi', status: 'policy_delivered', policyAttached: true, shippingMethod: 'print_by_fairdee', trackingNumber: `TH${100000000 + i * 12345}` },
      ];
    }

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10120 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 7 + 1),
      vehicleDetails: vehiclePlates[(i + 2) % vehiclePlates.length],
      rfStatus: 'completed',
      scStatus: 'completed',
      saleStatus: i % 2 === 0 ? 'policy_delivered' : 'policy_shipped',
      paymentStatus: 'paid',
      policyAttached: true,
      shippingMethod: shippingMethods[i % 3],
      trackingNumber: `TH${100000000 + i * 12345}`,
      reworkRequired: hasRework,
      reworkReasonId: hasRework ? '7' : undefined,
      assignedTo: hasRework ? scStaff[i % scStaff.length] : undefined,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
      policyType,
      policyRecords,
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, hasRework, createdOnFull),
      reworkHistory: hasRework ? [{ id: `rh-completed-${i}`, reasonId: '7', reasonLabel: 'Rejected by Insurer', details: 'Post-completion issue', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 02, 2025, 10:00 AM', previousStatus: 'policy_delivered' }] : [],
    } as Lead);
    id++;
  }

  // CANCELLED (8 leads)
  for (let i = 0; i < 8; i++) {
    const agent = agents[i % agents.length];
    const createdOn = `${String(10 - i).padStart(2, '0')}-01-2026`;
    const createdOnFull = `${createdOn} 12:00`;

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10108 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
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
