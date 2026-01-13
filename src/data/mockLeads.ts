import { Lead, ReworkConfig } from '@/types/pipeline';

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

const generateLeads = (): Lead[] => {
  const leads: Lead[] = [];
  let id = 1;

  // TO PAY (15 leads)
  for (let i = 0; i < 15; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 13;
    const hasSC = i % 3 !== 0;
    leads.push({
      id: String(id++),
      leadNumber: `#${10154 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: `${String(7 - Math.floor(i / 3)).padStart(2, '0')}-01-2026`,
      vehicleDetails: vehiclePlates[i % vehiclePlates.length],
      rfStatus: i < 2 ? 'pending' : 'transferred',
      scStatus: hasSC ? 'claimed' : 'pending',
      saleStatus: i % 4 === 0 ? 'waiting_for_insurer' : i % 4 === 1 ? 'partially_added' : 'pending',
      paymentStatus: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'partial' : 'unpaid',
      policyAttached: false,
      reworkRequired: hasRework,
      reworkReasonId: hasRework ? String((i % 4) + 1) : undefined,
      assignedTo: hasRework ? (hasSC ? scStaff[i % scStaff.length] : rfStaff[i % rfStaff.length]) : undefined,
      createdBy: i % 2 === 0 ? 'agent' : 'admin',
      reworkHistory: hasRework ? [{ id: `rh-pay-${i}`, reasonId: String((i % 4) + 1), reasonLabel: 'Missing Documents', details: 'Need info', attachments: [], savedBy: 'System', savedAt: 'Jan 5, 2026, 10:00 AM', previousStatus: 'pending' }] : [],
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: hasSC ? scStaff[i % scStaff.length] : undefined,
    });
  }

  // TO REPORT (15 leads)
  for (let i = 0; i < 15; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 13;
    const hasSC = i % 4 !== 0;
    leads.push({
      id: String(id++),
      leadNumber: `#${10143 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: `${String(23 - i).padStart(2, '0')}-09-2025`,
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
      reworkHistory: hasRework ? [{ id: `rh-report-${i}`, reasonId: String((i % 4) + 1), reasonLabel: 'Missing Documents', details: 'Verification needed', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 20, 2025, 11:00 AM', previousStatus: 'pending_review' }] : [],
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: hasSC ? scStaff[i % scStaff.length] : undefined,
      deAssignee: deStaff[i % deStaff.length],
    });
  }

  // TO ISSUE (12 leads)
  for (let i = 0; i < 12; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 10;
    leads.push({
      id: String(id++),
      leadNumber: `#${10135 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: `${String(18 - i).padStart(2, '0')}-09-2025`,
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
      reworkHistory: hasRework ? [{ id: `rh-issue-${i}`, reasonId: '5', reasonLabel: 'Return to AST', details: 'Issue pending', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 15, 2025, 09:00 AM', previousStatus: 'pending_issuance' }] : [],
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
    });
  }

  // TO DELIVER (12 leads)
  for (let i = 0; i < 12; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 10;
    const shippingMethods: Array<'print_by_fairdee' | 'e_policy' | 'print_by_myself'> = ['print_by_fairdee', 'e_policy', 'print_by_myself'];
    leads.push({
      id: String(id++),
      leadNumber: `#${10128 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: `${String(12 - Math.floor(i / 2)).padStart(2, '0')}-09-2025`,
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
      reworkHistory: hasRework ? [{ id: `rh-deliver-${i}`, reasonId: '6', reasonLabel: 'Reverted by Insurer', details: 'Delivery issue', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 09, 2025, 04:00 PM', previousStatus: 'policy_issued' }] : [],
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
    });
  }

  // COMPLETED (12 leads)
  for (let i = 0; i < 12; i++) {
    const agent = agents[i % agents.length];
    const hasRework = i >= 10;
    const shippingMethods: Array<'print_by_fairdee' | 'e_policy' | 'print_by_myself'> = ['print_by_fairdee', 'e_policy', 'print_by_myself'];
    leads.push({
      id: String(id++),
      leadNumber: `#${10120 - i}`,
      leadType: i % 3 === 0 ? 'coa' : i % 5 === 0 ? 'renewals' : 'new_leads',
      paymentType: i % 2 === 0 ? 'full' : 'installment',
      agentId: agent.id,
      agentName: agent.name,
      createdOn: `${String(5 - Math.floor(i / 3)).padStart(2, '0')}-09-2025`,
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
      reworkHistory: hasRework ? [{ id: `rh-completed-${i}`, reasonId: '7', reasonLabel: 'Rejected by Insurer', details: 'Post-completion issue', attachments: [], savedBy: deStaff[i % deStaff.length], savedAt: 'Sep 02, 2025, 10:00 AM', previousStatus: 'policy_delivered' }] : [],
      rfAssignee: rfStaff[i % rfStaff.length],
      scAssignee: scStaff[i % scStaff.length],
      deAssignee: deStaff[i % deStaff.length],
    });
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
  { id: '9', descriptionTh: 'ตีกลับให้ OPS', descriptionEn: 'Return to OPS', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_report', 'to_issue', 'to_deliver', 'completed'] },
  { id: '10', descriptionTh: 'แจ้งประกันแล้ว รอพิจารณา', descriptionEn: 'Submitted to Insurer: Under Review', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '11', descriptionTh: 'รอแจ้งประกันยกเลิก รอเอกสาร', descriptionEn: 'Pending Cancellation: Awaiting Documents', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '12', descriptionTh: 'รอแจ้งประกันยกเลิก เอกสารครบ', descriptionEn: 'Pending Cancellation: Documents Complete', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '13', descriptionTh: 'แจ้งประกันยกเลิกแล้ว รอเอกสาร', descriptionEn: 'Cancellation Submitted: Awaiting Documents', team: '', teamMembers: [], automationEnabled: false, assignment: 'rf_sc', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '14', descriptionTh: 'แจ้งประกันยกเลิกแล้ว เอกสารครบ', descriptionEn: 'Cancellation Submitted: Documents Complete', team: 'Admin', teamMembers: [], automationEnabled: false, assignment: 'round_robin', stages: ['to_issue', 'to_deliver', 'completed'] },
  { id: '15', descriptionTh: 'รอยกเลิก', descriptionEn: 'Pending Cancellation', team: '', teamMembers: [], automationEnabled: false, assignment: 'rf_sc', stages: ['to_pay', 'to_report'] },
  { id: '16', descriptionTh: 'ยกเลิก', descriptionEn: 'Cancelled', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report'] },
  { id: '17', descriptionTh: 'ซ้ำ', descriptionEn: 'Duplicated', team: '', teamMembers: [], automationEnabled: false, assignment: 'none', stages: ['to_pay', 'to_report'] },
];

export const teams = ['AST RF', 'AST SC', 'DE', 'Admin'];
