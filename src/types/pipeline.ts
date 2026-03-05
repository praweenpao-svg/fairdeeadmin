export type LeadType = 'new_leads' | 'coa' | 'renewals';
export type LeadSource = 'system' | 'custom'; // For new_leads: system-created or custom created
export type PaymentType = 'full' | 'installment';
export type InstallmentCount = 3 | 6 | 10;
export type PipelineStage = 'all' | 'to_convert' | 'to_pay' | 'to_report' | 'to_issue' | 'to_deliver' | 'completed' | 'cancelled';

export type SaleStatus = 
  | 'pending'
  | 'docs_missing'
  | 'waiting_for_insurer'
  | 'partially_added'
  | 'completed'
  | 'quotation_shared'
  | 'invalid'
  | 'pending_payment'
  | 'pending_review'
  | 'under_review'
  | 'de_in_progress'
  | 'ready_for_de'
  | 'pending_issuance'
  | 'policy_issued'
  | 'policy_shipped'
  | 'policy_delivered'
  | 'policy_cancelled'
  // Renewal-specific statuses
  | 'price_pending'
  | 'revision_pending'
  | 'renewal_rejected'
  | 'price_ready';

export type ShippingMethod = 'e_policy' | 'print_by_myself' | 'print_by_fairdee';

// Payment method for the sale
export type PaymentMethod = 'credit' | 'cbc_to_fairdee' | 'cbc_to_insurer';

// Policy type for post-lead journey (VMI only vs VMI + CMI)
export type PolicyType = 'vmi_only' | 'vmi_cmi';

// Individual policy record within a sale (VMI or CMI)
export type PolicyKind = 'vmi' | 'cmi';

// Endorsement types for policy modifications
export type EndorsementType = 'policy_endorsement' | 'policy_cancellation';

// Endorsement status workflow
export type EndorsementStatus = 
  | 'request_created'
  | 'request_submitted'
  | 'request_approved'
  | 'pending_on_ops'
  | 'pending_finance'
  | 'invalid';

// Status specific to each policy record in post-lead stages
export type PolicyStatus = 
  | 'pending_payment'
  | 'pending_review'
  | 'pending_issuance'
  | 'policy_issued'
  | 'policy_shipped'
  | 'policy_delivered'
  | 'policy_cancelled'
  | 'rework_required';

// Thread reply for comments on remarks or rework entries
export interface ThreadReply {
  id: string;
  comment: string;
  attachments?: ReworkAttachment[];
  createdBy: string;
  createdAt: string;
}

// Rework entry for policy-level rework
export interface PolicyReworkEntry {
  id: string;
  reasonId: string;
  reasonLabel: string;
  details: string;
  attachments: ReworkAttachment[];
  savedBy: string;
  savedAt: string;
  assignedTo?: string; // Owner for this specific rework entry
  resolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  autoResolveDate?: string; // DD/MM/YYYY date for auto-resolve reasons
  previousStatus: PolicyStatus; // Status before rework was triggered
  replies?: ThreadReply[]; // Thread replies for this rework entry
}

export interface PolicyRemark {
  id: string;
  comment: string;
  attachments?: ReworkAttachment[];
  createdBy: string;
  createdAt: string;
  replies?: ThreadReply[]; // Thread replies for this remark
}

// Policy-level history log entry
// Policy-level history action types
export type PolicyHistoryActionType = 
  | 'rework_created' 
  | 'rework_resolved' 
  | 'rework_reassigned' 
  | 'status_changed' 
  | 'remark_added'
  | 'lead_status_changed'    // Lead status changes (pre-conversion)
  | 'payment_status_changed' // Payment status changes
  | 'endorsement_status_changed' // Endorsement status changes
  | 'assignee_changed';      // RF/SC/DE assignee changes

export interface PolicyHistoryLogEntry {
  id: string;
  action: PolicyHistoryActionType;
  triggeredBy: string;
  triggeredAt: string;
  fromStatus?: PolicyStatus | SaleStatus | EndorsementStatus | string;
  toStatus?: PolicyStatus | SaleStatus | EndorsementStatus | string;
  reworkReasonId?: string;
  reworkReasonLabel?: string;
  comment?: string;
  attachments?: HistoryAttachment[];
  // For assignee changes
  assigneeType?: 'rf' | 'sc' | 'de' | 'owner';
  fromAssignee?: string;
  toAssignee?: string;
}

// Endorsement entry for tracking endorsement status changes with comments/attachments
export interface PolicyEndorsementEntry {
  id: string;
  endorsementType: EndorsementType;
  fromStatus: EndorsementStatus;
  toStatus: EndorsementStatus;
  details: string;
  attachments: ReworkAttachment[];
  savedBy: string;
  savedAt: string;
  assignedTo?: string; // Owner for this endorsement entry
  replies?: ThreadReply[]; // Thread replies
}

export interface PolicyRecord {
  id: string;
  kind: PolicyKind;
  status: PolicyStatus;
  policyAttached: boolean;
  shippingMethod?: ShippingMethod;
  trackingNumber?: string;
  updatedOn?: string;
  policyUploadedOn?: string;
  policyStartDate?: string;
  policyNumber?: string;
  policyFileUrl?: string;
  remarks?: PolicyRemark[];
  // Policy-level rework
  reworkRequired?: boolean;
  reworkHistory?: PolicyReworkEntry[];
  // Policy-level history log
  historyLog?: PolicyHistoryLogEntry[];
  // Endorsement fields
  endorsementType?: EndorsementType;
  endorsementStatus?: EndorsementStatus;
  // Endorsement change history
  endorsementHistory?: PolicyEndorsementEntry[];
}

export type CreatedByType = 'agent' | 'admin';

// History Log Action Types
export type HistoryActionType = 
  | 'lead_created'
  | 'status_changed'
  | 'rework_created'
  | 'rework_resolved'
  | 'rework_reassigned'
  | 'assignee_changed'
  | 'payment_status_changed'
  | 'rf_status_changed'
  | 'sc_status_changed'
  | 'policy_attached'
  | 'shipping_updated';

export interface HistoryAttachment {
  id: string;
  name: string;
  type: 'png' | 'jpg' | 'pdf';
  url: string;
}

export interface HistoryLogEntry {
  id: string;
  action: HistoryActionType;
  triggeredBy: string;
  triggeredAt: string;
  // For status changes
  fromStatus?: string;
  toStatus?: string;
  // For rework actions
  reworkReasonId?: string;
  reworkReasonLabel?: string;
  // For assignee changes
  assigneeType?: 'rf' | 'sc' | 'de' | 'owner';
  fromAssignee?: string;
  toAssignee?: string;
  // Optional details
  comment?: string;
  attachments?: HistoryAttachment[];
}

// Legacy type alias for backwards compatibility during transition
export interface ReworkAttachment {
  id: string;
  name: string;
  type: 'png' | 'jpg' | 'pdf';
  url: string;
}

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

export interface Lead {
  id: string;
  leadNumber: string;
  leadType: LeadType;
  leadSource?: LeadSource; // For new_leads: 'system' or 'manual' (COA leads don't need this)
  paymentType: PaymentType;
  agentId: string;
  agentName: string;
  createdOn: string;
  updatedOn: string;
  vehicleDetails: string;
  vehicleProvince?: string;
  vehicleBrand?: string;
  vehicleSubBrand?: string;
  vehicleYear?: number;
  // Coverage details (post-lead stages)
  insuranceClass?: string; // 1, 2, 2+, 3, 3+
  garageType?: 'Dealer' | 'Garage';
  insurerName?: string; // English insurer name
  insurerNameTh?: string; // Thai insurer name
  rfStatus: 'pending' | 'transferred' | 'completed';
  scStatus: 'pending' | 'claimed' | 'completed';
  saleStatus: SaleStatus;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  policyAttached: boolean;
  shippingMethod?: ShippingMethod;
  trackingNumber?: string;
  reworkRequired: boolean;
  // Sale-level financial info (shown in post-lead stages)
  premium?: number; // Premium amount in THB
  paymentMethod?: PaymentMethod;
  installmentCount?: InstallmentCount; // Only for installment payments (cbc_to_fairdee)
  reworkReasonId?: string;
  assignedTo?: string;
  createdBy: CreatedByType;
  // New unified history log
  historyLog: HistoryLogEntry[];
  // Legacy rework history (kept for backwards compatibility)
  reworkHistory: ReworkHistoryEntry[];
  rfAssignee?: string;
  scAssignee?: string;
  deAssignee?: string;
  // Policy type and records for post-lead journey
  policyType?: PolicyType;
  policyRecords?: PolicyRecord[];
  // Insurer quotes for Leads stage (New Leads / COA)
  insurerQuotes?: InsurerQuote[];
  // Sale-level ETA status (for post-lead stages)
  etaStatus?: ETAStatus;
  etaDaysOverdue?: number;
}

export type AssignmentType = 'round_robin' | 'rf_sc' | 'rf' | 'requestor' | 'none';

// Automation type for rework configs
export type AutomationType = 'auto_reassign' | 'auto_resolve';

// Policy scope for rework reasons - which policy types this rework reason applies to
export type PolicyScopeType = 'vmi' | 'cmi' | 'both';

// Party type for rework reasons
export type ReworkPartyType = 'internal' | 'external' | 'both';
export type PartyType = ReworkPartyType;

// Configuration type: standard rework or endorsement
export type ReworkConfigType = 'rework' | 'endorsement';

// Endorsement config type
export type EndorsementConfigType = 'policy_endorsement' | 'policy_cancellation';

export interface ReworkConfig {
  id: string;
  descriptionTh: string;
  descriptionEn: string;
  team: string;
  teamMembers: string[];
  automationEnabled: boolean;
  automationType?: AutomationType; // 'auto_reassign' reassigns to target reason, 'auto_resolve' auto-resolves and re-runs waterfall
  automationDays?: number;
  targetReason?: string; // Only used when automationType === 'auto_reassign'
  assignment: AssignmentType;
  stages: PipelineStage[];
  movesToCancellation?: boolean;
  partyType: ReworkPartyType;
  policyScope: PolicyScopeType;
  configType?: ReworkConfigType;
  endorsementConfigType?: EndorsementType;
  endorsementConfigStatus?: EndorsementStatus;
}

export interface PipelineTab {
  id: PipelineStage;
  label: string;
  count: number;
}

// Insurer Quote types for Leads stage (New Leads / COA)
export type PriceListStatus = 
  | 'pending'
  | 'price_list_added'
  | 'rejected_by_insurer'
  | 'email_sent';

export type ETAStatus = 'on_time' | 'breached';

export interface InsurerQuote {
  id: string;
  insurerName: string;
  insuranceClass: string;
  garageType: 'Dealer' | 'Garage' | 'Any';
  priceListStatus: PriceListStatus;
  emailSentAt?: string;
  waitingTimeDays?: number;
  followUpDate?: string;
  etaStatus?: ETAStatus;
  daysOverdue?: number;
  etaRange?: string;
  priceListAddedAt?: string;
}
