export type LeadType = 'new_leads' | 'coa' | 'renewals';
export type PaymentType = 'full' | 'installment';
export type PipelineStage = 'to_pay' | 'to_report' | 'to_issue' | 'to_deliver' | 'completed';

export type SaleStatus = 
  | 'pending_review'
  | 'under_review'
  | 'de_in_progress'
  | 'ready_for_de'
  | 'pending_issuance'
  | 'policy_issued'
  | 'completed';

export type ShippingMethod = 'e_policy' | 'print_by_myself' | 'print_by_fairdee';

export interface Lead {
  id: string;
  leadNumber: string;
  leadType: LeadType;
  paymentType: PaymentType;
  agentId: string;
  agentName: string;
  createdOn: string;
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
}

export interface ReworkConfig {
  id: string;
  descriptionTh: string;
  descriptionEn: string;
  team: string;
  teamMembers: string[];
  automationEnabled: boolean;
  automationDays?: number;
  targetReason?: string;
}

export interface PipelineTab {
  id: PipelineStage;
  label: string;
  count: number;
}
