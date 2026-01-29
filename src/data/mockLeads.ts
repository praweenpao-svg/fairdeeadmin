import { Lead, ReworkConfig, HistoryLogEntry } from '@/types/pipeline';

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

// Helper to generate history log entries for a lead
function generateHistoryLog(lead: Partial<Lead>, hasRework: boolean, createdOn: string): HistoryLogEntry[] {
  const logs: HistoryLogEntry[] = [];
  const agent = lead.agentName || 'System';
  
  // 1. Lead created
  logs.push({
    id: `hl-${lead.id}-created`,
    action: 'lead_created',
    triggeredBy: agent,
    triggeredAt: createdOn,
  });

  // 2. RF assigned
  if (lead.rfAssignee) {
    logs.push({
      id: `hl-${lead.id}-rf`,
      action: 'assignee_changed',
      triggeredBy: 'System',
      triggeredAt: addMinutes(createdOn, 5),
      assigneeType: 'rf',
      fromAssignee: undefined,
      toAssignee: lead.rfAssignee,
    });
  }

  // 3. SC claimed
  if (lead.scAssignee) {
    logs.push({
      id: `hl-${lead.id}-sc`,
      action: 'assignee_changed',
      triggeredBy: lead.scAssignee,
      triggeredAt: addMinutes(createdOn, 30),
      assigneeType: 'sc',
      fromAssignee: undefined,
      toAssignee: lead.scAssignee,
    });
  }

  // 4. RF status transferred
  if (lead.rfStatus === 'transferred' || lead.rfStatus === 'completed') {
    logs.push({
      id: `hl-${lead.id}-rf-status`,
      action: 'rf_status_changed',
      triggeredBy: lead.rfAssignee || 'System',
      triggeredAt: addMinutes(createdOn, 60),
      fromStatus: 'pending',
      toStatus: 'transferred',
    });
  }

  // 5. Payment status
  if (lead.paymentStatus === 'paid') {
    logs.push({
      id: `hl-${lead.id}-payment`,
      action: 'payment_status_changed',
      triggeredBy: 'Payment System',
      triggeredAt: addMinutes(createdOn, 120),
      fromStatus: 'unpaid',
      toStatus: 'paid',
    });
  }

  // 6. DE assigned
  if (lead.deAssignee) {
    logs.push({
      id: `hl-${lead.id}-de`,
      action: 'assignee_changed',
      triggeredBy: 'System (Round Robin)',
      triggeredAt: addMinutes(createdOn, 180),
      assigneeType: 'de',
      fromAssignee: undefined,
      toAssignee: lead.deAssignee,
    });
  }

  // 7. Status progression (example)
  if (lead.saleStatus && lead.saleStatus !== 'pending') {
    logs.push({
      id: `hl-${lead.id}-status`,
      action: 'status_changed',
      triggeredBy: lead.deAssignee || lead.scAssignee || 'System',
      triggeredAt: addMinutes(createdOn, 240),
      fromStatus: 'pending',
      toStatus: lead.saleStatus,
    });
  }

  // 8. Rework if applicable
  if (hasRework && lead.reworkReasonId) {
    const reworkReasonLabels: Record<string, string> = {
      '1': 'Missing Documents',
      '2': 'Pending Confirmation',
      '3': 'Pending Verification',
      '4': 'Pending Initial Payment',
      '5': 'Pre-submission: Return to AST',
      '6': 'Reverted by Insurer',
      '7': 'Rejected by Insurer',
    };
    
    logs.push({
      id: `hl-${lead.id}-rework`,
      action: 'rework_created',
      triggeredBy: lead.deAssignee || 'System',
      triggeredAt: addMinutes(createdOn, 300),
      reworkReasonId: lead.reworkReasonId,
      reworkReasonLabel: reworkReasonLabels[lead.reworkReasonId] || 'Unknown',
      comment: 'Verification needed',
    });
  }

  // 9. Policy attached
  if (lead.policyAttached) {
    logs.push({
      id: `hl-${lead.id}-policy`,
      action: 'policy_attached',
      triggeredBy: lead.deAssignee || 'System',
      triggeredAt: addMinutes(createdOn, 360),
    });
  }

  // 10. Shipping
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
      triggeredAt: addMinutes(createdOn, 420),
      toStatus: shippingLabels[lead.shippingMethod] || lead.shippingMethod,
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
  for (let i = 0; i < 10; i++) {
    const agent = agents[i % agents.length];
    const hasSC = i % 3 !== 0;
    const createdOn = `${String(15 - i).padStart(2, '0')}-01-2026`;
    const createdOnFull = `${createdOn} 09:00`;
    const conversionStatuses = ['pending', 'waiting_for_insurer', 'partially_added', 'completed', 'quotation_shared', 'invalid'];

    const leadData: Partial<Lead> = {
      id: String(id),
      leadNumber: `#${10170 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: createdOnFull,
      updatedOn: generateUpdatedOn(createdOn, i % 8),
      vehicleDetails: vehiclePlates[i % vehiclePlates.length],
      rfStatus: i < 2 ? 'pending' : 'transferred',
      scStatus: hasSC ? 'claimed' : 'pending',
      // To Convert: unpaid + conversion status
      saleStatus: conversionStatuses[i % conversionStatuses.length] as Lead['saleStatus'],
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

  // TO PAY (15 leads)
  for (let i = 0; i < 15; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 13;
    const hasSC = i % 3 !== 0;
    const createdOn = `${String(7 - Math.floor(i / 3)).padStart(2, '0')}-01-2026`;
    const createdOnFull = `${createdOn} 09:00`;

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
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, hasRework, createdOnFull),
      reworkHistory: hasRework ? [{ id: `rh-pay-${i}`, reasonId: String((i % 4) + 1), reasonLabel: 'Missing Documents', details: 'Need info', attachments: [], savedBy: 'System', savedAt: 'Jan 5, 2026, 10:00 AM', previousStatus: 'pending' }] : [],
    } as Lead);
    id++;
  }

  // TO REPORT (15 leads)
  for (let i = 0; i < 15; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 13;
    const hasSC = i % 4 !== 0;
    const createdOn = `${String(23 - i).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 10:00`;

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
      saleStatus: i % 3 === 0 ? 'pending_review' : i % 3 === 1 ? 'under_review' : 'de_in_progress',
      paymentStatus: 'paid',
      policyAttached: false,
      reworkRequired: hasRework,
      reworkReasonId: hasRework ? String((i % 4) + 1) : undefined,
      assignedTo: hasRework ? scStaff[i % scStaff.length] : undefined,
      createdBy: i % 2 === 0 ? 'admin' : 'agent',
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: hasSC ? scStaff[i % scStaff.length] : undefined,
      deAssignee: deStaff[i % deStaff.length],
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, hasRework, createdOnFull),
      reworkHistory: hasRework ? [{ id: `rh-report-${i}`, reasonId: String((i % 4) + 1), reasonLabel: 'Missing Documents', details: 'Verification needed', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 20, 2025, 11:00 AM', previousStatus: 'pending_review' }] : [],
    } as Lead);
    id++;
  }

  // TO ISSUE (12 leads)
  for (let i = 0; i < 12; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 10;
    const createdOn = `${String(18 - i).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 11:00`;

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
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, hasRework, createdOnFull),
      reworkHistory: hasRework ? [{ id: `rh-issue-${i}`, reasonId: '5', reasonLabel: 'Return to AST', details: 'Issue pending', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 15, 2025, 09:00 AM', previousStatus: 'pending_issuance' }] : [],
    } as Lead);
    id++;
  }

  // TO DELIVER (12 leads)
  for (let i = 0; i < 12; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 10;
    const shippingMethods: Array<'print_by_fairdee' | 'e_policy' | 'print_by_myself'> = ['print_by_fairdee', 'e_policy', 'print_by_myself'];
    const createdOn = `${String(12 - Math.floor(i / 2)).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 14:00`;

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
    };

    leads.push({
      ...leadData,
      historyLog: generateHistoryLog(leadData, hasRework, createdOnFull),
      reworkHistory: hasRework ? [{ id: `rh-deliver-${i}`, reasonId: '6', reasonLabel: 'Reverted by Insurer', details: 'Delivery issue', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 09, 2025, 04:00 PM', previousStatus: 'policy_issued' }] : [],
    } as Lead);
    id++;
  }

  // COMPLETED (12 leads)
  for (let i = 0; i < 12; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 10;
    const shippingMethods: Array<'print_by_fairdee' | 'e_policy' | 'print_by_myself'> = ['print_by_fairdee', 'e_policy', 'print_by_myself'];
    const createdOn = `${String(5 - Math.floor(i / 3)).padStart(2, '0')}-09-2025`;
    const createdOnFull = `${createdOn} 08:00`;

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
