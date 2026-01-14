export type LeadType = 'new_leads' | 'coa' | 'renewals';
export type PaymentType = 'full' | 'installment';
export type PipelineStage = 'all' | 'to_pay' | 'to_report' | 'to_issue' | 'to_deliver' | 'completed' | 'cancelled';

export type SaleStatus = 
  | 'pending'
  | 'waiting_for_insurer'
  | 'partially_added'
  | 'completed'
  | 'quotation_shared'
  | 'invalid'
  | 'pending_review'
  | 'under_review'
  | 'de_in_progress'
  | 'ready_for_de'
  | 'pending_issuance'
  | 'policy_issued'
  | 'policy_shipped'
  | 'policy_delivered'
  | 'policy_cancelled';

export type ShippingMethod = 'e_policy' | 'print_by_myself' | 'print_by_fairdee';

export type CreatedByType = 'agent' | 'admin';

export interface ReworkHistoryEntry {
  id: string;
  reasonId: string;
  reasonLabel: string;
  details: string;
  attachments: ReworkAttachment[];
  savedBy: string;
  savedAt: string;
  resolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  previousStatus?: SaleStatus;
}

export interface ReworkAttachment {
  id: string;
  name: string;
  type: 'png' | 'jpg' | 'pdf';
  url: string;
}

export interface Lead {
  id: string;
  leadNumber: string;
  leadType: LeadType;
  paymentType: PaymentType;
  agentId: string;
  agentName: string;
  createdOn: string;
  updatedOn: string;
  vehicleDetails: string;
  rfStatus: 'pending' | 'transferred' | 'completed';
  scStatus: 'pending' | 'claimed' | 'completed';
  saleStatus: SaleStatus;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  policyAttached: boolean;
  shippingMethod?: ShippingMethod;
  trackingNumber?: string;
  reworkRequired: boolean;
  reworkReasonId?: string;
  assignedTo?: string;
  createdBy: CreatedByType;
  reworkHistory: ReworkHistoryEntry[];
  rfAssignee?: string;
  scAssignee?: string;
  deAssignee?: string;
}

export type AssignmentType = 'round_robin' | 'rf_sc' | 'none';

export interface ReworkConfig {
  id: string;
  descriptionTh: string;
  descriptionEn: string;
  team: string;
  teamMembers: string[];
  automationEnabled: boolean;
  automationDays?: number;
  targetReason?: string;
  assignment: AssignmentType;
  stages: PipelineStage[];
}

export interface PipelineTab {
  id: PipelineStage;
  label: string;
  count: number;
}
