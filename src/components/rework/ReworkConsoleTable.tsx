import { useState } from 'react';
import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  ReworkConfig, AssignmentType, PipelineStage, ReworkPartyType, PolicyScopeType,
  ReworkConfigType, EndorsementType, EndorsementStatus, AutomationType,
  IssuanceMethod, DeliveryMethodType, StickyColumnType, SalesChannelScope,
} from '@/types/pipeline';
import { useTeamsStore } from '@/stores/teamsStore';
import { useReworkReasonsStore } from '@/stores/reworkReasonsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { SearchableReasonSelect } from '@/components/pipeline/SearchableReasonSelect';

interface ReworkConsoleTableProps {
  reworkConfigs: ReworkConfig[];
  onUpdate: (configs: ReworkConfig[]) => void;
}

// Assignment logic options per PRD: Round-Robin, Requestor, None
const assignmentOptions: { value: AssignmentType; label: string }[] = [
  { value: 'round_robin', label: 'Round-Robin' },
  { value: 'requestor', label: 'Requestor' },
  { value: 'none', label: 'None' },
];

const stageOptions: { value: PipelineStage; label: string }[] = [
  { value: 'to_pay', label: 'To Pay Premium' },
  { value: 'to_report', label: 'To Report Sale' },
  { value: 'to_issue', label: 'To Issue Policy' },
  { value: 'to_deliver', label: 'To Deliver Policy' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancellation' },
];

const partyTypeOptions: { value: ReworkPartyType; label: string; desc: string }[] = [
  { value: 'internal', label: 'Internal', desc: 'Issues handled within the organization (AST, OPS, etc.)' },
  { value: 'external', label: 'External', desc: 'Issues involving external parties (Agents, Insurers, etc.)' },
];

const policyScopeOptions: { value: PolicyScopeType; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'vmi', label: 'VMI Only' },
  { value: 'cmi', label: 'CMI Only' },
];

const configTypeOptions: { value: ReworkConfigType; label: string }[] = [
  { value: 'policy', label: 'Policy' },
  { value: 'lead', label: 'Lead' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'rework', label: 'Rework' },
  { value: 'endorsement', label: 'Endorsement' },
];

const endorsementTypeOptions: { value: EndorsementType; label: string }[] = [
  { value: 'policy_endorsement', label: 'Policy Endorsement' },
  { value: 'policy_cancellation', label: 'Policy Cancellation' },
];

const endorsementStatusOptions: { value: EndorsementStatus; label: string; th: string }[] = [
  { value: 'request_created', label: 'Request Created', th: 'สร้างคำขอแล้ว' },
  { value: 'request_submitted', label: 'Request Submitted', th: 'ส่งคำขอแล้ว' },
  { value: 'request_approved', label: 'Request Approved', th: 'อนุมัติคำขอแล้ว' },
  { value: 'pending_on_ops', label: 'Pending on Ops', th: 'รอดำเนินการ OPS' },
  { value: 'pending_finance', label: 'Pending Finance', th: 'รอการเงิน' },
  { value: 'invalid', label: 'Invalid', th: 'ไม่ถูกต้อง' },
];

const issuanceMethodOptions: { value: IssuanceMethod; label: string }[] = [
  { value: 'api', label: 'API' },
  { value: 'email', label: 'Email' },
  { value: 'manual', label: 'Manual' },
];

const deliveryMethodOptions: { value: DeliveryMethodType; label: string }[] = [
  { value: 'print_by_fairdee', label: 'Print by FairDee' },
  { value: 'print_by_myself', label: 'Print by Myself' },
  { value: 'e_policy', label: 'E-Policy' },
];

// Selectable delivery methods in the form (excludes Print by FairDee per US-25b R-28e)
const selectableDeliveryMethodOptions = deliveryMethodOptions.filter(o => o.value !== 'print_by_fairdee');

const stickyColumnOptions: { value: StickyColumnType; label: string }[] = [
  { value: 'RF', label: 'RF' },
  { value: 'SC', label: 'SC' },
  { value: 'DE', label: 'DE' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Delivery', label: 'Delivery' },
];

const statusesWithIssuanceMethod = ['pending_issuance'];
const statusesWithDeliveryMethod = ['policy_issued', 'policy_shipped'];

const policyStatusOptions: { value: string; label: string }[] = [
  { value: 'pending_payment', label: 'Pending' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'pending_issuance', label: 'Pending Issuance' },
  { value: 'policy_issued', label: 'Policy Uploaded' },
  { value: 'policy_shipped', label: 'Policy Shipped' },
  { value: 'policy_delivered', label: 'Policy Delivered' },
  { value: 'policy_cancelled', label: 'Policy Cancelled' },
];

const leadStatusOptions: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'docs_missing', label: 'Docs Missing' },
  { value: 'waiting_for_insurer', label: 'Waiting for Insurer' },
  { value: 'quotation_shared', label: 'Quotation Shared' },
  { value: 'partially_added', label: 'Partially Added' },
  { value: 'completed', label: 'Completed' },
  { value: 'invalid', label: 'Invalid' },
];

const renewalStatusOptions: { value: string; label: string }[] = [
  { value: 'price_pending', label: 'Price Pending' },
  { value: 'request_sent_to_insurer', label: 'Request Sent to Insurer' },
  { value: 'pricelist_added', label: 'Pricelist Added' },
  { value: 'revision_pending', label: 'Revision Pending' },
  { value: 'recheck_price_claim', label: 'Recheck Price (Claim)' },
  { value: 'special_request_pending', label: 'Special Request Pending' },
  { value: 'pricelist_verified', label: 'Pricelist Verified' },
  { value: 'quotation_shared_to_agent', label: 'Quotation Shared to Agent' },
  { value: 'renewal_rejected', label: 'Renewal Rejected' },
  { value: 'invalid', label: 'Invalid' },
];

function getStatusOptionsForType(configType?: ReworkConfigType) {
  switch (configType) {
    case 'policy': return policyStatusOptions;
    case 'lead': return leadStatusOptions;
    case 'renewal': return renewalStatusOptions;
    default: return [];
  }
}

const allPostLeadStages: PipelineStage[] = ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'];

export function isCancellationReworkReason(reasonId: string, reworkConfigs: ReworkConfig[]): boolean {
  const config = reworkConfigs.find(c => c.id === reasonId);
  return config?.movesToCancellation === true;
}

const typesWithStatus: ReworkConfigType[] = ['policy', 'lead', 'renewal'];
const typesWithMinimalForm: ReworkConfigType[] = ['endorsement', 'policy', 'lead', 'renewal'];
// Lead/Policy/Renewal can split assignment by sales channel (SS vs NSS).
// SS  = Self-Service (quotation_created_by = User/Agent)
// NSS = Non-Self-Service (quotation_created_by = Admin)
const typesWithSalesChannel: ReworkConfigType[] = ['lead', 'policy', 'renewal'];

const salesChannelOptions: { value: Exclude<SalesChannelScope, 'both'>; label: string; desc: string }[] = [
  { value: 'ss', label: 'SS', desc: 'Self-Service — quotation created by Agent/User' },
  { value: 'nss', label: 'NSS', desc: 'Non-Self-Service — quotation created by Admin' },
];

const salesChannelBadgeCls: Record<SalesChannelScope, string> = {
  ss: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  nss: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  both: 'bg-muted text-muted-foreground',
};

type FormData = Partial<ReworkConfig>;

const defaultFormData: FormData = {
  configType: undefined,
  descriptionTh: '',
  descriptionEn: '',
  team: '',
  assignment: 'none',
  stages: [],
  automationEnabled: false,
  automationType: undefined,
  automationDays: undefined,
  targetReason: undefined,
  movesToCancellation: false,
  partyType: 'internal',
  policyScope: 'both',
  endorsementConfigType: undefined,
  endorsementConfigStatus: undefined,
  statusFilter: undefined,
  issuanceMethod: undefined,
  deliveryMethod: undefined,
  stickyEnabled: false,
  stickyColumns: [],
  salesChannel: undefined,
  manualOverrideEnabled: false,
  manualOverrideTeam: '',
};

export function ReworkConsoleTable({ reworkConfigs, onUpdate }: ReworkConsoleTableProps) {
  const { teams, teamEntries, getTeamsByStickyColumn } = useTeamsStore();
  const { reasons: reworkReasons, getReason } = useReworkReasonsStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReworkConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState<FormData>({ ...defaultFormData });
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const openDialog = (config?: ReworkConfig) => {
    if (config) {
      setEditingConfig(config);
      let resolvedReasonId = config.reasonId;
      // Back-match legacy rework configs by EN description if reasonId missing
      if (!resolvedReasonId && config.configType === 'rework') {
        const match = reworkReasons.find(r =>
          r.descriptionEn.trim().toLowerCase() === (config.descriptionEn || '').trim().toLowerCase()
          && r.descriptionTh.trim().toLowerCase() === (config.descriptionTh || '').trim().toLowerCase()
        );
        resolvedReasonId = match?.id;
      }
      setFormData({ ...config, reasonId: resolvedReasonId });
    } else {
      setEditingConfig(null);
      setFormData({ ...defaultFormData });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const config = reworkConfigs.find(c => c.id === id);
    if (config?.hardCoded) return; // Cannot delete hard-coded rows
    onUpdate(reworkConfigs.filter(c => c.id !== id));
    setDeleteTarget(null);
  };

  const handleSave = () => {
    const ct = formData.configType;
    if (!ct) {
      toast({ title: 'Validation Error', description: 'Please select a config type.', variant: 'destructive' });
      return;
    }

    const isEndorsement = ct === 'endorsement';
    const isRework = ct === 'rework';
    const isStatusType = typesWithStatus.includes(ct);
    const isMinimal = typesWithMinimalForm.includes(ct);

    // Validation
    if (isRework) {
      if (!formData.reasonId) {
        toast({ title: 'Validation Error', description: 'Please select a Rework Reason.', variant: 'destructive' });
        return;
      }
      if (!getReason(formData.reasonId)) {
        toast({ title: 'Validation Error', description: 'Selected Rework Reason no longer exists.', variant: 'destructive' });
        return;
      }
      // 1:1 — block duplicate assignment config for the same Rework Reason.
      // Legacy/migrated configs may not have reasonId yet, so back-match by description.
      const selectedReason = getReason(formData.reasonId);
      const dup = reworkConfigs.some(c => {
        if (c.id === editingConfig?.id) return false;
        if (c.configType !== 'rework') return false;
        if (c.reasonId && c.reasonId === formData.reasonId) return true;
        if (!c.reasonId && selectedReason) {
          const enMatch = (c.descriptionEn || '').trim().toLowerCase() === selectedReason.descriptionEn.trim().toLowerCase();
          const thMatch = (c.descriptionTh || '').trim().toLowerCase() === selectedReason.descriptionTh.trim().toLowerCase();
          if (enMatch && thMatch) return true;
        }
        return false;
      });
      if (dup) {
        toast({ title: 'Already exists', description: 'An assignment config for this Rework Reason already exists.', variant: 'destructive' });
        return;
      }
    }

    if (isEndorsement) {
      if (!formData.endorsementConfigType) {
        toast({ title: 'Validation Error', description: 'Endorsement Type is required.', variant: 'destructive' });
        return;
      }
      if (!formData.endorsementConfigStatus) {
        toast({ title: 'Validation Error', description: 'Endorsement Status is required.', variant: 'destructive' });
        return;
      }
      const dup = reworkConfigs.some(c =>
        c.configType === 'endorsement' && c.endorsementConfigType === formData.endorsementConfigType
        && c.endorsementConfigStatus === formData.endorsementConfigStatus && c.id !== editingConfig?.id
      );
      if (dup) {
        toast({ title: 'Already exists', description: 'This endorsement type + status combination already exists.', variant: 'destructive' });
        return;
      }
    }

    if (isStatusType) {
      if (!formData.statusFilter) {
        toast({ title: 'Validation Error', description: 'Status selection is required.', variant: 'destructive' });
        return;
      }
      if (typesWithSalesChannel.includes(ct) && (formData.salesChannel !== 'ss' && formData.salesChannel !== 'nss')) {
        toast({ title: 'Validation Error', description: 'Sales Channel (SS or NSS) is required.', variant: 'destructive' });
        return;
      }
      if (ct === 'policy' && statusesWithIssuanceMethod.includes(formData.statusFilter) && !formData.issuanceMethod) {
        toast({ title: 'Validation Error', description: 'Issuance Method is required.', variant: 'destructive' });
        return;
      }
      if (ct === 'policy' && statusesWithDeliveryMethod.includes(formData.statusFilter) && !formData.deliveryMethod) {
        toast({ title: 'Validation Error', description: 'Delivery Method is required.', variant: 'destructive' });
        return;
      }
      // Uniqueness check — (configType + statusFilter + salesChannel [+ method]) must be unique.
      const hasMethod = ct === 'policy' && (statusesWithIssuanceMethod.includes(formData.statusFilter) || statusesWithDeliveryMethod.includes(formData.statusFilter));
      const dup = reworkConfigs.some(c => {
        if (c.id === editingConfig?.id) return false;
        if (c.configType !== ct || c.statusFilter !== formData.statusFilter) return false;
        if (c.salesChannel !== formData.salesChannel) return false;
        if (hasMethod) {
          if (statusesWithIssuanceMethod.includes(formData.statusFilter!)) return c.issuanceMethod === formData.issuanceMethod;
          if (statusesWithDeliveryMethod.includes(formData.statusFilter!)) return c.deliveryMethod === formData.deliveryMethod;
        }
        return true;
      });
      if (dup) {
        toast({ title: 'Already exists', description: `This ${ct} status + channel configuration already exists.`, variant: 'destructive' });
        return;
      }
    }

    // Sticky validation
    if (formData.stickyEnabled && !(formData.stickyColumns || []).length) {
      toast({ title: 'Validation Error', description: 'At least one sticky column is required when Sticky Check is enabled.', variant: 'destructive' });
      return;
    }

    // Round-robin team validation
    if (formData.assignment === 'round_robin' && !formData.team) {
      toast({ title: 'Validation Error', description: 'Team is required for Round-Robin assignment.', variant: 'destructive' });
      return;
    }

    // Note: Automation lives on the Rework Reason entity now (no validation here).

    const teamValue = formData.assignment === 'round_robin' ? (formData.team || '') : '';

    // For rework configs, mirror reason fields onto the assignment config
    // so existing consumers reading descriptionEn/Th, partyType, stages,
    // automation, etc. continue to work without changes.
    const reason = isRework ? getReason(formData.reasonId) : undefined;
    const stages = isRework
      ? (reason?.stages || allPostLeadStages)
      : isMinimal ? allPostLeadStages : (formData.stages || []);
    const partyType: ReworkPartyType = isRework
      ? (reason?.partyType || 'internal')
      : isMinimal ? 'internal' : (formData.partyType || 'internal');
    const policyScope: PolicyScopeType = isRework
      ? (reason?.policyScope || 'both')
      : isMinimal ? 'both' : (formData.policyScope || 'both');
    const automationEnabled = isRework
      ? (reason?.automationEnabled || false)
      : isMinimal ? false : (formData.automationEnabled || false);
    const automationType = isRework
      ? reason?.automationType
      : isMinimal ? undefined : (automationEnabled ? (formData.automationType || 'auto_reassign') : undefined);
    const automationDays = isRework ? reason?.automationDays : (isMinimal ? undefined : formData.automationDays);
    const targetReasonValue = isRework
      ? reason?.targetReasonId
      : isMinimal ? undefined : (automationType === 'auto_resolve' ? undefined : formData.targetReason);
    const descriptionEn = isRework ? (reason?.descriptionEn || '') : isMinimal ? '' : (formData.descriptionEn || '');
    const descriptionTh = isRework ? (reason?.descriptionTh || '') : isMinimal ? '' : (formData.descriptionTh || '');
    const movesToCancellation = (isRework || isEndorsement) ? (formData.movesToCancellation || false) : false;

    if (editingConfig) {
      onUpdate(reworkConfigs.map(c =>
        c.id === editingConfig.id ? {
          ...c, ...formData,
          team: teamValue, stages, partyType, policyScope,
          descriptionEn, descriptionTh,
          automationEnabled, automationType, automationDays, targetReason: targetReasonValue,
          movesToCancellation,
          stickyEnabled: formData.stickyEnabled || false,
          stickyColumns: formData.stickyEnabled ? (formData.stickyColumns || []) : [],
          reasonId: isRework ? formData.reasonId : undefined,
          salesChannel: typesWithSalesChannel.includes(ct) ? formData.salesChannel : undefined,
          manualOverrideEnabled: (isRework || isEndorsement) ? (formData.manualOverrideEnabled || false) : false,
          manualOverrideTeam: (isRework || isEndorsement) && formData.manualOverrideEnabled ? (formData.manualOverrideTeam || '') : '',
        } : c
      ));
    } else {
      const newConfig: ReworkConfig = {
        id: String(Date.now()),
        configType: ct,
        descriptionTh,
        descriptionEn,
        team: teamValue,
        teamMembers: [],
        automationEnabled,
        automationType,
        automationDays,
        targetReason: targetReasonValue,
        assignment: formData.assignment || 'none',
        stages,
        movesToCancellation,
        partyType,
        policyScope,
        endorsementConfigType: isEndorsement ? formData.endorsementConfigType : undefined,
        endorsementConfigStatus: isEndorsement ? formData.endorsementConfigStatus : undefined,
        statusFilter: isStatusType ? formData.statusFilter : undefined,
        issuanceMethod: ct === 'policy' && statusesWithIssuanceMethod.includes(formData.statusFilter || '') ? formData.issuanceMethod : undefined,
        deliveryMethod: ct === 'policy' && statusesWithDeliveryMethod.includes(formData.statusFilter || '') ? formData.deliveryMethod : undefined,
        stickyEnabled: formData.stickyEnabled || false,
        stickyColumns: formData.stickyEnabled ? (formData.stickyColumns || []) : [],
        reasonId: isRework ? formData.reasonId : undefined,
        salesChannel: typesWithSalesChannel.includes(ct) ? formData.salesChannel : undefined,
        manualOverrideEnabled: (isRework || isEndorsement) ? (formData.manualOverrideEnabled || false) : false,
        manualOverrideTeam: (isRework || isEndorsement) && formData.manualOverrideEnabled ? (formData.manualOverrideTeam || '') : '',
      };
      onUpdate([...reworkConfigs, newConfig]);
    }
    setIsDialogOpen(false);
  };

  const handleFormStageToggle = (stage: PipelineStage) => {
    const cur = formData.stages || [];
    setFormData({ ...formData, stages: cur.includes(stage) ? cur.filter(s => s !== stage) : [...cur, stage] });
  };

  const handleStickyColumnToggle = (col: StickyColumnType) => {
    const cur = formData.stickyColumns || [];
    const newCols = cur.includes(col) ? cur.filter(c => c !== col) : [...cur, col];
    // Reset team if #1 sticky column changed
    const oldFirst = cur.length > 0 ? cur[0] : null;
    const newFirst = newCols.length > 0 ? newCols[0] : null;
    const teamReset = oldFirst !== newFirst ? '' : formData.team;
    setFormData({ ...formData, stickyColumns: newCols, team: teamReset });
  };

  // Helpers
  const getStageLabels = (stages: PipelineStage[]) => {
    if (!stages?.length) return '—';
    return stages.map(s => stageOptions.find(o => o.value === s)?.label || s).join(', ');
  };

  const getTeamDisplay = (c: ReworkConfig) => {
    if (c.hardCoded) return '—';
    return c.assignment === 'round_robin' ? (c.team || '—') : '—';
  };

  const getTypeTag = (c: ReworkConfig) => {
    switch (c.configType) {
      case 'endorsement':
        return c.endorsementConfigType === 'policy_cancellation'
          ? { label: 'Cancel', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
          : { label: 'Endorse', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
      case 'policy':
        return { label: 'Policy', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'lead':
        return { label: 'Lead', cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' };
      case 'renewal':
        return { label: 'Renewal', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
      default:
        return { label: 'Rework', cls: 'bg-muted text-muted-foreground' };
    }
  };

  const getReasonDisplay = (c: ReworkConfig) => {
    if (c.configType === 'endorsement') {
      const opt = endorsementStatusOptions.find(o => o.value === c.endorsementConfigStatus);
      return { primary: opt?.label || '—', secondary: opt?.th || '' };
    }
    if (typesWithStatus.includes(c.configType as ReworkConfigType) && c.statusFilter) {
      const opts = getStatusOptionsForType(c.configType);
      return { primary: opts.find(o => o.value === c.statusFilter)?.label || c.statusFilter, secondary: '' };
    }
    return { primary: c.descriptionEn, secondary: c.descriptionTh };
  };

  const getStickyDisplay = (c: ReworkConfig) => {
    if (c.hardCoded) return '—';
    if (!c.stickyEnabled) return 'No';
    const cols = c.stickyColumns || [];
    if (!cols.length) return 'No';
    return 'Yes';
  };

  const getMethodDisplay = (c: ReworkConfig) => {
    if (c.configType === 'policy' && c.issuanceMethod) {
      return issuanceMethodOptions.find(o => o.value === c.issuanceMethod)?.label || c.issuanceMethod;
    }
    if (c.configType === 'policy' && c.deliveryMethod) {
      return deliveryMethodOptions.find(o => o.value === c.deliveryMethod)?.label || c.deliveryMethod;
    }
    return '—';
  };

  const getAssignmentDisplay = (c: ReworkConfig) => {
    if (c.hardCoded) return 'Chatwoot';
    // Legacy rf_sc/rf values display nicely
    if (c.assignment === 'rf_sc') return 'RF/SC';
    if (c.assignment === 'rf') return 'RF';
    return assignmentOptions.find(o => o.value === c.assignment)?.label || c.assignment;
  };

  // Dedupe & pagination
  const uniqueConfigs = (() => {
    const seen = new Set<string>();
    const result: ReworkConfig[] = [];
    for (const c of reworkConfigs) {
      const key = c.configType === 'endorsement'
        ? `endorsement|${c.endorsementConfigType}|${c.endorsementConfigStatus}`
        : typesWithStatus.includes(c.configType as ReworkConfigType)
        ? `${c.configType}|${c.statusFilter}|${c.issuanceMethod || ''}|${c.deliveryMethod || ''}|${c.salesChannel || ''}`
        : `rework|${(c.descriptionTh || '').trim().toLowerCase()}|${(c.descriptionEn || '').trim().toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(c);
    }
    return result;
  })();

  const filteredConfigs = typeFilter === 'all'
    ? uniqueConfigs
    : uniqueConfigs.filter(c => {
        if (typeFilter === 'endorse') return c.configType === 'endorsement' && c.endorsementConfigType === 'policy_endorsement';
        if (typeFilter === 'cancel') return c.configType === 'endorsement' && c.endorsementConfigType === 'policy_cancellation';
        return c.configType === typeFilter;
      });

  const totalItems = filteredConfigs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedConfigs = filteredConfigs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const isReworkOnly = formData.configType === 'rework';
  const isMinimalType = typesWithMinimalForm.includes(formData.configType as ReworkConfigType);
  const showStatusSelector = typesWithStatus.includes(formData.configType as ReworkConfigType);
  const showMovesToCancellation = formData.configType === 'rework' || formData.configType === 'endorsement';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Assignment Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage assignment, rework, and endorsement configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="policy">Policy</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
              <SelectItem value="rework">Rework</SelectItem>
              <SelectItem value="endorse">Endorse</SelectItem>
              <SelectItem value="cancel">Cancel</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Config
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingConfig ? 'Edit Config' : 'Add New Config'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Type */}
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={formData.configType || '__none__'}
                  onValueChange={(v) => {
                    const ct = v === '__none__' ? undefined : v as ReworkConfigType;
                    setFormData({
                      ...defaultFormData,
                      configType: ct,
                      endorsementConfigType: ct === 'endorsement' ? 'policy_endorsement' : undefined,
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select type</SelectItem>
                    {configTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Endorsement fields */}
              {formData.configType === 'endorsement' && (
                <>
                  <div className="grid gap-2">
                    <Label>Endorsement Type</Label>
                    <Select
                      value={formData.endorsementConfigType || 'policy_endorsement'}
                      onValueChange={(v) => setFormData({ ...formData, endorsementConfigType: v as EndorsementType, endorsementConfigStatus: undefined })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {endorsementTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Endorsement Status</Label>
                    <Select
                      value={formData.endorsementConfigStatus || '__none__'}
                      onValueChange={(v) => setFormData({ ...formData, endorsementConfigStatus: v === '__none__' ? undefined : v as EndorsementStatus })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select status</SelectItem>
                        {endorsementStatusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label} / {o.th}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Status selector for Policy/Lead/Renewal */}
              {showStatusSelector && (
                <div className="grid gap-2">
                  <Label>{formData.configType === 'policy' ? 'Policy Status' : formData.configType === 'lead' ? 'Lead Status' : 'Renewal Status'}</Label>
                  <Select
                    value={formData.statusFilter || '__none__'}
                    onValueChange={(v) => setFormData({ ...formData, statusFilter: v === '__none__' ? undefined : v, issuanceMethod: undefined, deliveryMethod: undefined })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select status</SelectItem>
                      {getStatusOptionsForType(formData.configType).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Issuance Method */}
              {formData.configType === 'policy' && statusesWithIssuanceMethod.includes(formData.statusFilter || '') && (
                <div className="grid gap-2">
                  <Label>Issuance Method</Label>
                  <Select
                    value={formData.issuanceMethod || '__none__'}
                    onValueChange={(v) => setFormData({ ...formData, issuanceMethod: v === '__none__' ? undefined : v as IssuanceMethod })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select method</SelectItem>
                      {issuanceMethodOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Delivery Method */}
              {formData.configType === 'policy' && statusesWithDeliveryMethod.includes(formData.statusFilter || '') && (
                <div className="grid gap-2">
                  <Label>Delivery Method</Label>
                  <Select
                    value={formData.deliveryMethod || '__none__'}
                    onValueChange={(v) => setFormData({ ...formData, deliveryMethod: v === '__none__' ? undefined : v as DeliveryMethodType })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select delivery method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select delivery method</SelectItem>
                      {selectableDeliveryMethodOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Rework Reason selector — searchable since the list grows over time */}
              {isReworkOnly && (
                <div className="grid gap-2">
                  <Label>Rework Reason</Label>
                  <SearchableReasonSelect
                    configs={reworkReasons}
                    value={formData.reasonId || ''}
                    onValueChange={(v) => setFormData({ ...formData, reasonId: v || undefined })}
                    placeholder="Select rework reason"
                    triggerClassName="h-10 text-sm"
                  />
                </div>
              )}

              {/* Sales Channel — Lead / Policy / Renewal only (SS or NSS, required) */}
              {typesWithSalesChannel.includes(formData.configType as ReworkConfigType) && (
                <div className="grid gap-2">
                  <Label>Sales Channel</Label>
                  <Select
                    value={formData.salesChannel ?? ''}
                    onValueChange={(v) => setFormData({ ...formData, salesChannel: v as SalesChannelScope })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select SS or NSS" /></SelectTrigger>
                    <SelectContent>
                      {salesChannelOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.configType && (
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-0.5">
                      <Label>Sticky Check</Label>
                      <p className="text-xs text-muted-foreground">Check existing assignee columns before fallback assignment</p>
                    </div>
                    <Switch
                      checked={formData.stickyEnabled || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, stickyEnabled: checked, stickyColumns: checked ? (formData.stickyColumns || []) : [] })}
                    />
                  </div>
                  {formData.stickyEnabled && (
                    <div className="grid gap-2 mb-3">
                      <Label>Sticky Column(s) <span className="text-xs text-muted-foreground font-normal">(order matters — first match wins)</span></Label>
                      <div className="border rounded-md p-3 space-y-2">
                        {stickyColumnOptions.map(col => (
                          <div key={col.value} className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded" onClick={() => handleStickyColumnToggle(col.value)}>
                            <Checkbox checked={(formData.stickyColumns || []).includes(col.value)} onCheckedChange={() => handleStickyColumnToggle(col.value)} />
                            <span className="text-sm">{col.label}</span>
                            {(formData.stickyColumns || []).includes(col.value) && (
                              <span className="text-xs text-muted-foreground ml-auto">#{(formData.stickyColumns || []).indexOf(col.value) + 1}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {(formData.stickyColumns || []).length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Check order: {(formData.stickyColumns || []).join(' → ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Assignment Logic */}
              {formData.configType && (
                <div className="grid gap-2">
                  <Label>Assignment Logic {formData.stickyEnabled ? '(Fallback)' : ''}</Label>
                  <Select
                    value={formData.assignment || 'none'}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      assignment: v as AssignmentType,
                      team: '',
                    })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {assignmentOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.assignment === 'round_robin' ? 'Distributes tasks among selected team members'
                      : formData.assignment === 'requestor' ? 'Assigns to whoever created the request'
                      : 'No assignment — owner is empty'}
                  </p>
                </div>
              )}


              {/* Team for Round-Robin */}
              {formData.assignment === 'round_robin' && (
                <div className="grid gap-2">
                  <Label>Team</Label>
                  {(() => {
                    // If sticky enabled and columns selected, filter teams by #1 sticky column mapping
                    const firstStickyCol = formData.stickyEnabled && (formData.stickyColumns || []).length > 0
                      ? formData.stickyColumns![0]
                      : null;
                    const availableTeams = firstStickyCol
                      ? teamEntries.filter(t => t.stickyColumn === firstStickyCol)
                      : teamEntries;
                    return (
                      <>
                        <Select value={formData.team || '__none__'} onValueChange={(v) => setFormData({ ...formData, team: v === '__none__' ? '' : v })}>
                          <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Select team</SelectItem>
                            {availableTeams.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {firstStickyCol && (
                          <p className="text-xs text-muted-foreground">
                            Filtered by sticky column: <span className="font-medium">{firstStickyCol}</span>
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Stages, Automation moved to Rework Reasons page */}


              {/* Manual Override — independent of assignment logic. When enabled,
                  the user picks the case owner AFTER resolve via a team picker. */}
              {showMovesToCancellation && (
                <div className="border-t pt-4 mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Manual Override</Label>
                      <p className="text-xs text-muted-foreground">Pick the case owner after resolve.</p>
                    </div>
                    <Switch
                      checked={formData.manualOverrideEnabled || false}
                      onCheckedChange={(v) => setFormData({ ...formData, manualOverrideEnabled: v, manualOverrideTeam: v ? formData.manualOverrideTeam : '' })}
                    />
                  </div>
                  {formData.manualOverrideEnabled && (
                    <div className="grid gap-2">
                      <Label>Manual Override Team</Label>
                      <p className="text-xs text-muted-foreground">Members appear in the rework dialog picker.</p>
                      <Select
                        value={formData.manualOverrideTeam || '__none__'}
                        onValueChange={(v) => setFormData({ ...formData, manualOverrideTeam: v === '__none__' ? '' : v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select team</SelectItem>
                          {teamEntries.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Moves to Cancellation - Rework & Endorsement only */}
              {showMovesToCancellation && (
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Moves to Cancellation</Label>
                      <p className="text-xs text-muted-foreground">When enabled, affected leads move to Cancellation tab</p>
                    </div>
                    <Switch checked={formData.movesToCancellation || false} onCheckedChange={(v) => setFormData({ ...formData, movesToCancellation: v })} />
                  </div>
                </div>
              )}

              {/* Automation moved to Rework Reasons page */}


            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingConfig ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Table */}
      <TooltipProvider>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="data-table-header px-4 py-3 text-center">Type</th>
                <th className="data-table-header px-4 py-3 text-left min-w-[220px]">Status / Reason</th>
                <th className="data-table-header px-4 py-3 text-center">Channel</th>
                <th className="data-table-header px-4 py-3 text-left">Sticky</th>
                <th className="data-table-header px-4 py-3 text-left">Assignment Logic</th>
                <th className="data-table-header px-4 py-3 text-left">Teams</th>
                <th className="data-table-header px-4 py-3 text-center">Method</th>
                <th className="data-table-header px-4 py-3 text-center">Cancellation</th>
                <th className="data-table-header px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedConfigs.map(config => {
                const tag = getTypeTag(config);
                const reason = getReasonDisplay(config);
                const isRw = config.configType === 'rework';
                return (
                  <tr key={config.id} className={`data-table-row ${config.hardCoded ? 'opacity-60' : ''}`}>
                    {/* TYPE */}
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${tag.cls}`}>{tag.label}</span>
                    </td>
                    {/* STATUS/REASON */}
                    <td className="px-4 py-3 text-sm min-w-[220px] max-w-[320px]">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground truncate" title={reason.primary}>{reason.primary}</div>
                        {reason.secondary && <div className="text-xs text-muted-foreground truncate" title={reason.secondary}>{reason.secondary}</div>}
                      </div>
                    </td>
                    {/* CHANNEL (SS/NSS/Both) — only for lead/policy/renewal */}
                    <td className="px-4 py-3 text-sm text-center">
                      {typesWithSalesChannel.includes(config.configType as ReworkConfigType) && config.salesChannel && config.salesChannel !== 'both' ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${salesChannelBadgeCls[config.salesChannel]}`}>
                          {config.salesChannel.toUpperCase()}
                        </span>
                      ) : '—'}
                    </td>
                    {/* STICKY */}
                    <td className="px-4 py-3 text-sm">{getStickyDisplay(config)}</td>
                    {/* ASSIGNMENT LOGIC */}
                    <td className="px-4 py-3 text-sm">{getAssignmentDisplay(config)}</td>
                    {/* TEAMS */}
                    <td className="px-4 py-3 text-sm">{getTeamDisplay(config)}</td>
                    {/* METHOD */}
                    <td className="px-4 py-3 text-sm text-center">
                      {getMethodDisplay(config) !== '—' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {getMethodDisplay(config)}
                        </span>
                      ) : '—'}
                    </td>
                    {/* STAGES, PARTY, VMI/CMI moved to Rework Reasons page */}
                    {/* CANCELLATION */}
                    <td className="px-4 py-3 text-sm text-center">
                      {(isRw || config.configType === 'endorsement') ? (
                        <span className={config.movesToCancellation ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}>
                          {config.movesToCancellation ? 'ON' : 'OFF'}
                        </span>
                      ) : '—'}
                    </td>
                    {/* AUTOMATION, THRESHOLD, TARGET STATUS moved to Rework Reasons page */}
                    {/* ACTIONS */}
                    <td className="px-4 py-3">
                      {config.hardCoded ? (
                        <div className="flex items-center justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[280px]">
                              <p>Delivery assignment for Print by FairDee is handled by Chatwoot printing logic and cannot be configured here.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDialog(config)} className="h-8 w-8 p-0">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(config.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          onPageChange={(p) => setCurrentPage(p)}
          onRowsPerPageChange={(r) => { setRowsPerPage(r); setCurrentPage(1); }}
        />
      </div>
      </TooltipProvider>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this configuration? Existing records will retain reference to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
