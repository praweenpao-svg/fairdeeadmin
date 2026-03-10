import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ReworkConfig, AssignmentType, PipelineStage, ReworkPartyType, PolicyScopeType, ReworkConfigType, EndorsementType, EndorsementStatus, AutomationType, IssuanceMethod, DeliveryMethodType } from '@/types/pipeline';
import { useTeamsStore } from '@/stores/teamsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

interface ReworkConsoleTableProps {
  reworkConfigs: ReworkConfig[];
  onUpdate: (configs: ReworkConfig[]) => void;
}

const assignmentOptions: { value: AssignmentType; label: string }[] = [
  { value: 'rf_sc', label: 'RF/SC' },
  { value: 'rf', label: 'RF' },
  { value: 'round_robin', label: 'Round-Robin' },
  { value: 'requestor', label: 'Requestor' },
  { value: 'none', label: '-' },
];

const stageOptions: { value: PipelineStage; label: string }[] = [
  { value: 'to_pay', label: 'To Pay Premium' },
  { value: 'to_report', label: 'To Report Sale' },
  { value: 'to_issue', label: 'To Issue Policy' },
  { value: 'to_deliver', label: 'To Deliver Policy' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancellation' },
];

const partyTypeOptions: { value: ReworkPartyType; label: string }[] = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
];

const policyScopeOptions: { value: PolicyScopeType; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'vmi', label: 'VMI Only' },
  { value: 'cmi', label: 'CMI Only' },
];

const configTypeOptions: { value: ReworkConfigType; label: string }[] = [
  { value: 'rework', label: 'Rework' },
  { value: 'endorsement', label: 'Endorsement' },
  { value: 'policy', label: 'Policy' },
  { value: 'lead', label: 'Lead' },
  { value: 'renewal', label: 'Renewal' },
];

const endorsementTypeOptions: { value: EndorsementType; label: string }[] = [
  { value: 'policy_endorsement', label: 'Policy Endorsement' },
  { value: 'policy_cancellation', label: 'Policy Cancellation' },
];

const endorsementStatusOptions: { value: EndorsementStatus; label: string }[] = [
  { value: 'request_created', label: 'Request Created' },
  { value: 'request_submitted', label: 'Request Submitted' },
  { value: 'request_approved', label: 'Request Approved' },
  { value: 'pending_on_ops', label: 'Pending on Ops' },
  { value: 'pending_finance', label: 'Pending Finance' },
  { value: 'invalid', label: 'Invalid' },
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

// Statuses that have a dynamic method sub-field
const statusesWithIssuanceMethod = ['pending_issuance'];
const statusesWithDeliveryMethod = ['policy_issued', 'policy_shipped'];

// Status options per config type
const policyStatusOptions: { value: string; label: string }[] = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'pending_issuance', label: 'Pending Issuance' },
  { value: 'policy_issued', label: 'Policy Issued' },
  { value: 'policy_shipped', label: 'Policy Shipped' },
  { value: 'policy_delivered', label: 'Policy Delivered' },
  { value: 'policy_cancelled', label: 'Policy Cancelled' },
];

const leadStatusOptions: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'docs_missing', label: 'Docs Missing' },
  { value: 'waiting_for_insurer', label: 'Waiting for Insurer' },
  { value: 'partially_added', label: 'Partially Added' },
  { value: 'completed', label: 'Completed' },
  { value: 'quotation_shared', label: 'Quotation Shared' },
  { value: 'invalid', label: 'Invalid' },
];

const renewalStatusOptions: { value: string; label: string }[] = [
  { value: 'price_pending', label: 'Price Pending' },
  { value: 'revision_pending', label: 'Revision Pending' },
  { value: 'renewal_rejected', label: 'Renewal Rejected' },
  { value: 'price_ready', label: 'Price Ready' },
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

// Helper function to check if a rework reason moves leads to Cancellation tab
export function isCancellationReworkReason(reasonId: string, reworkConfigs: ReworkConfig[]): boolean {
  const config = reworkConfigs.find(c => c.id === reasonId);
  return config?.movesToCancellation === true;
}

// Filter out 'to_convert' from any stages array (not allowed in rework console)
const sanitizeStages = (stages: PipelineStage[]): PipelineStage[] => {
  return stages.filter(s => s !== 'to_convert');
};

// Types that show status selector
const typesWithStatus: ReworkConfigType[] = ['policy', 'lead', 'renewal'];
// Types that hide TH/EN description, party, policy scope, stages, automation
const typesWithMinimalForm: ReworkConfigType[] = ['endorsement', 'policy', 'lead', 'renewal'];

export function ReworkConsoleTable({ reworkConfigs, onUpdate }: ReworkConsoleTableProps) {
  const { teams } = useTeamsStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReworkConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState<Partial<ReworkConfig>>({
    configType: 'rework',
    descriptionTh: '',
    descriptionEn: '',
    team: '',
    assignment: 'rf_sc',
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
  });

  const openDialog = (config?: ReworkConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({ ...config });
    } else {
      setEditingConfig(null);
      setFormData({
        configType: 'rework',
        descriptionTh: '',
        descriptionEn: '',
        team: '',
        assignment: 'rf_sc',
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
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdate(reworkConfigs.filter((config) => config.id !== id));
  };

  const handleSave = () => {
    const isEndorsement = formData.configType === 'endorsement';
    const isMinimal = typesWithMinimalForm.includes(formData.configType as ReworkConfigType);
    const teamValue = formData.assignment === 'round_robin' ? (formData.team || '') : '';

    // Check for duplicate endorsement status
    if (isEndorsement) {
      const duplicate = reworkConfigs.some(
        c => c.configType === 'endorsement'
          && c.endorsementConfigType === formData.endorsementConfigType
          && c.endorsementConfigStatus === formData.endorsementConfigStatus
          && c.id !== editingConfig?.id
      );
      if (duplicate) {
        toast({
          title: 'Already exists',
          description: 'This endorsement status already exists for the selected type.',
          variant: 'destructive',
        });
        return;
      }
    }

    const stages = isMinimal ? allPostLeadStages : (formData.stages || []);
    const partyType = isMinimal ? 'internal' as ReworkPartyType : (formData.partyType || 'internal');
    const policyScope = isMinimal ? 'both' as PolicyScopeType : (formData.policyScope || 'both');
    const automationEnabled = isMinimal ? false : (formData.automationEnabled || false);
    const automationType = isMinimal ? undefined : (automationEnabled ? (formData.automationType || 'auto_reassign') : undefined);
    const movesToCancellation = formData.movesToCancellation || false;
    
    if (editingConfig) {
      onUpdate(
        reworkConfigs.map((config) =>
          config.id === editingConfig.id
            ? { ...config, ...formData, team: teamValue, stages, partyType, policyScope, automationEnabled, automationType, movesToCancellation }
            : config
        )
      );
    } else {
      const newConfig: ReworkConfig = {
        id: String(Date.now()),
        configType: formData.configType || 'rework',
        descriptionTh: isMinimal ? '' : (formData.descriptionTh || ''),
        descriptionEn: isMinimal ? '' : (formData.descriptionEn || ''),
        team: teamValue,
        teamMembers: [],
        automationEnabled,
        automationType,
        automationDays: isMinimal ? undefined : formData.automationDays,
        targetReason: isMinimal ? undefined : (automationType === 'auto_resolve' ? undefined : formData.targetReason),
        assignment: formData.assignment || 'rf_sc',
        stages,
        movesToCancellation,
        partyType,
        policyScope,
        endorsementConfigType: isEndorsement ? formData.endorsementConfigType : undefined,
        endorsementConfigStatus: isEndorsement ? formData.endorsementConfigStatus : undefined,
        stickyColumn: formData.stickyColumn,
        statusFilter: typesWithStatus.includes(formData.configType as ReworkConfigType) ? formData.statusFilter : undefined,
      };
      onUpdate([...reworkConfigs, newConfig]);
    }
    setIsDialogOpen(false);
  };

  const handleFormStageToggle = (stage: PipelineStage) => {
    const currentStages = formData.stages || [];
    const newStages = currentStages.includes(stage)
      ? currentStages.filter((s) => s !== stage)
      : [...currentStages, stage];
    setFormData({ ...formData, stages: newStages });
  };

  const getStageLabels = (stages: PipelineStage[]) => {
    if (!stages || stages.length === 0) return '-';
    return stages.map(s => stageOptions.find(opt => opt.value === s)?.label || s).join(', ');
  };

  const getTeamDisplay = (config: ReworkConfig) => {
    if (config.assignment !== 'round_robin') return '-';
    return config.team || '-';
  };

  const getTargetReasonLabel = (targetReasonId?: string): { en: string; th: string } | null => {
    if (!targetReasonId) return null;
    const targetConfig = uniqueConfigs.find(c => c.id === targetReasonId);
    if (!targetConfig) return null;
    return { en: targetConfig.descriptionEn, th: targetConfig.descriptionTh };
  };

  const getTypeTag = (config: ReworkConfig) => {
    switch (config.configType) {
      case 'endorsement':
        return config.endorsementConfigType === 'policy_cancellation'
          ? { label: 'Cancel', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
          : { label: 'Endorse', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
      case 'policy':
        return { label: 'Policy', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'lead':
        return { label: 'Lead', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
      case 'renewal':
        return { label: 'Renewal', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
      default:
        return { label: 'Rework', className: 'bg-muted text-muted-foreground' };
    }
  };

  const getReasonDisplay = (config: ReworkConfig) => {
    if (config.configType === 'endorsement') {
      return {
        primary: endorsementStatusOptions.find(o => o.value === config.endorsementConfigStatus)?.label || '-',
        secondary: config.endorsementConfigStatus === 'request_created' ? 'สร้างคำขอแล้ว'
          : config.endorsementConfigStatus === 'request_submitted' ? 'ส่งคำขอแล้ว'
          : config.endorsementConfigStatus === 'request_approved' ? 'อนุมัติคำขอแล้ว'
          : config.endorsementConfigStatus === 'pending_on_ops' ? 'รอดำเนินการ OPS'
          : config.endorsementConfigStatus === 'pending_finance' ? 'รอการเงิน'
          : config.endorsementConfigStatus === 'invalid' ? 'ไม่ถูกต้อง'
          : '-',
      };
    }
    if (typesWithStatus.includes(config.configType as ReworkConfigType) && config.statusFilter) {
      const statusOpts = getStatusOptionsForType(config.configType);
      const statusLabel = statusOpts.find(o => o.value === config.statusFilter)?.label || config.statusFilter;
      return { primary: statusLabel, secondary: '' };
    }
    return { primary: config.descriptionEn, secondary: config.descriptionTh };
  };

  // Pagination (dedupe)
  const uniqueConfigs = (() => {
    const seen = new Set<string>();
    const result: ReworkConfig[] = [];
    for (const c of reworkConfigs) {
      const key = c.configType === 'endorsement'
        ? `endorsement|${c.endorsementConfigType}|${c.endorsementConfigStatus}`
        : typesWithStatus.includes(c.configType as ReworkConfigType)
        ? `${c.configType}|${c.statusFilter}`
        : `${(c.descriptionTh || '').trim().toLowerCase()}|${(c.descriptionEn || '').trim().toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(c);
    }
    return result;
  })();

  const totalItems = uniqueConfigs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedConfigs = uniqueConfigs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const isReworkOnly = formData.configType === 'rework';
  const isMinimalType = typesWithMinimalForm.includes(formData.configType as ReworkConfigType);
  const showStatusSelector = typesWithStatus.includes(formData.configType as ReworkConfigType);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rework Console</h2>
          <p className="text-sm text-muted-foreground">
            Manage rework reasons and team assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Reason
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? 'Edit Reason' : 'Add New Reason'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Type selector */}
                <div className="grid gap-2">
                  <Label htmlFor="configType">Type</Label>
                  <Select 
                    value={formData.configType || 'rework'} 
                    onValueChange={(value) => {
                      const ct = value as ReworkConfigType;
                      setFormData({ 
                        ...formData, 
                        configType: ct,
                        endorsementConfigType: ct === 'endorsement' ? (formData.endorsementConfigType || 'policy_endorsement') : undefined,
                        endorsementConfigStatus: ct === 'endorsement' ? (formData.endorsementConfigStatus || 'request_created') : undefined,
                        statusFilter: typesWithStatus.includes(ct) ? undefined : undefined,
                        movesToCancellation: ct === 'endorsement' ? false : formData.movesToCancellation,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {configTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Endorsement-specific fields */}
                {formData.configType === 'endorsement' && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="endorsementConfigType">Endorsement Type</Label>
                      <Select 
                        value={formData.endorsementConfigType || 'policy_endorsement'} 
                        onValueChange={(value) => {
                          const newType = value as EndorsementType;
                          const usedStatuses = reworkConfigs
                            .filter(c => c.configType === 'endorsement' && c.endorsementConfigType === newType && c.id !== editingConfig?.id)
                            .map(c => c.endorsementConfigStatus);
                          const firstAvailable = endorsementStatusOptions.find(o => !usedStatuses.includes(o.value));
                          setFormData({ 
                            ...formData, 
                            endorsementConfigType: newType,
                            endorsementConfigStatus: firstAvailable?.value || formData.endorsementConfigStatus,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select endorsement type" />
                        </SelectTrigger>
                        <SelectContent>
                          {endorsementTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endorsementConfigStatus">Endorsement Status</Label>
                      <Select 
                        value={formData.endorsementConfigStatus || 'request_created'} 
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          endorsementConfigStatus: value as EndorsementStatus
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select endorsement status" />
                        </SelectTrigger>
                        <SelectContent>
                          {endorsementStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Status selector for Policy/Lead/Renewal types */}
                {showStatusSelector && (
                  <div className="grid gap-2">
                    <Label htmlFor="statusFilter">Status</Label>
                    <Select 
                      value={formData.statusFilter || '__none__'} 
                      onValueChange={(value) => setFormData({ ...formData, statusFilter: value === '__none__' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select status</SelectItem>
                        {getStatusOptionsForType(formData.configType).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* TH/EN Description - only for Rework */}
                {isReworkOnly && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="descriptionTh">Description (TH)</Label>
                      <Input
                        id="descriptionTh"
                        className="bg-card"
                        value={formData.descriptionTh}
                        onChange={(e) => setFormData({ ...formData, descriptionTh: e.target.value })}
                        placeholder="Enter Thai description"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="descriptionEn">Description (EN)</Label>
                      <Input
                        id="descriptionEn"
                        className="bg-card"
                        value={formData.descriptionEn}
                        onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                        placeholder="Enter English description"
                      />
                    </div>
                  </>
                )}

                {/* Party Type - only for Rework */}
                {isReworkOnly && (
                  <div className="grid gap-2">
                    <Label htmlFor="partyType">Party Type</Label>
                    <Select 
                      value={formData.partyType || 'internal'} 
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        partyType: value as ReworkPartyType
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select party type" />
                      </SelectTrigger>
                      <SelectContent>
                        {partyTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.partyType === 'internal' 
                        ? 'Issues handled within the organization (AST, OPS, etc.)'
                        : 'Issues involving external parties (Insurers, Customers, etc.)'}
                    </p>
                  </div>
                )}

                {/* Policy Scope - only for Rework */}
                {isReworkOnly && (
                  <div className="grid gap-2">
                    <Label htmlFor="policyScope">Policy Scope</Label>
                    <Select 
                      value={formData.policyScope || 'both'} 
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        policyScope: value as PolicyScopeType
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy scope" />
                      </SelectTrigger>
                      <SelectContent>
                        {policyScopeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Assignment Logic */}
                <div className="grid gap-2">
                  <Label htmlFor="assignment">Assignment Logic</Label>
                  <Select 
                    value={formData.assignment || 'rf_sc'} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      assignment: value as AssignmentType,
                      team: value === 'round_robin' ? formData.team : '' 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignment logic" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.assignment === 'rf_sc' 
                      ? 'Assigns to SC person if claimed, otherwise RF person'
                      : formData.assignment === 'rf'
                      ? 'Always assigns to RF person regardless of SC assignment'
                      : formData.assignment === 'requestor'
                      ? 'Assigns to whoever created the request'
                      : formData.assignment === 'none'
                      ? 'No owner assignment'
                      : 'Distributes tasks fairly among selected team members'}
                  </p>
                </div>

                {/* Team for Round-Robin */}
                {formData.assignment === 'round_robin' && (
                  <div className="grid gap-2">
                    <Label htmlFor="team">Team</Label>
                    <Select 
                      value={formData.team || '__none__'} 
                      onValueChange={(value) => setFormData({ ...formData, team: value === '__none__' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select team</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Sticky Column */}
                <div className="grid gap-2">
                  <Label htmlFor="stickyColumn">Sticky</Label>
                  <Select 
                    value={formData.stickyColumn || '__none__'} 
                    onValueChange={(value) => setFormData({ ...formData, stickyColumn: value === '__none__' ? undefined : value as StickyColumnType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sticky column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {stickyColumnOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    If set, checks this column for an existing assignee before using assignment logic
                  </p>
                </div>

                {/* Stages - only for Rework */}
                {isReworkOnly && (
                  <div className="grid gap-2">
                    <Label>Stages</Label>
                    <div className="border rounded-md p-3 space-y-2">
                      {stageOptions.map((stage) => (
                        <div
                          key={stage.value}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                          onClick={() => handleFormStageToggle(stage.value)}
                        >
                          <Checkbox
                            checked={(formData.stages || []).includes(stage.value)}
                            onCheckedChange={() => handleFormStageToggle(stage.value)}
                          />
                          <span className="text-sm">{stage.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Moves to Cancellation */}
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="movesToCancellation">Moves to Cancellation</Label>
                      <p className="text-xs text-muted-foreground">
                        When selected, leads with this rework will move to Cancellation tab
                      </p>
                    </div>
                    <Switch
                      id="movesToCancellation"
                      checked={formData.movesToCancellation || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, movesToCancellation: checked })}
                    />
                  </div>
                </div>

                {/* Automation Section - only for Rework */}
                {isReworkOnly && (
                  <div className="border-t pt-4 mt-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="automationEnabled">Enable Automation</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically act after threshold days
                        </p>
                      </div>
                      <Switch
                        id="automationEnabled"
                        checked={formData.automationEnabled || false}
                        onCheckedChange={(checked) => setFormData({ 
                          ...formData, 
                          automationEnabled: checked,
                          automationType: checked ? (formData.automationType || 'auto_reassign') : undefined,
                        })}
                      />
                    </div>

                    {formData.automationEnabled && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Automation Type</Label>
                          <Select 
                            value={formData.automationType || 'auto_reassign'} 
                            onValueChange={(value) => setFormData({ 
                              ...formData, 
                              automationType: value as AutomationType,
                              targetReason: value === 'auto_resolve' ? undefined : formData.targetReason,
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto_reassign">Auto-Reassign</SelectItem>
                              <SelectItem value="auto_resolve">Auto-Resolve</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {formData.automationType === 'auto_resolve'
                              ? 'Auto-resolves the rework entry and re-runs status & stage waterfall'
                              : 'Reassigns the rework to a different target reason after threshold'}
                          </p>
                        </div>

                        {(formData.automationType || 'auto_reassign') === 'auto_reassign' && (
                          <>
                            <div className="grid gap-2">
                              <Label htmlFor="automationDays">Threshold (Days)</Label>
                              <Input
                                id="automationDays"
                                type="number"
                                min={1}
                                value={formData.automationDays || ''}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  automationDays: e.target.value ? parseInt(e.target.value) : undefined 
                                })}
                                placeholder="Enter number of days"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="targetReason">Target Status</Label>
                              <Select 
                                value={formData.targetReason || '__none__'} 
                                onValueChange={(value) => setFormData({ 
                                  ...formData, 
                                  targetReason: value === '__none__' ? undefined : value 
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select target rework reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Select target reason</SelectItem>
                                  {uniqueConfigs
                                    .filter(c => c.id !== editingConfig?.id)
                                    .map((config) => (
                                      <SelectItem key={config.id} value={config.id}>
                                        {config.descriptionEn}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Where the record moves after threshold is reached
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingConfig ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="data-table-header px-4 py-3 text-center">Type</th>
                <th className="data-table-header px-4 py-3 text-left min-w-[280px]">Reason</th>
                <th className="data-table-header px-4 py-3 text-left">Assignment Logic</th>
                <th className="data-table-header px-4 py-3 text-left">Teams</th>
                <th className="data-table-header px-4 py-3 text-center">Sticky</th>
                <th className="data-table-header px-4 py-3 text-left">Stages</th>
                <th className="data-table-header px-4 py-3 text-center">Party</th>
                <th className="data-table-header px-4 py-3 text-center">VMI/CMI</th>
                <th className="data-table-header px-4 py-3 text-center">Cancellation</th>
                <th className="data-table-header px-4 py-3 text-center">Automation</th>
                <th className="data-table-header px-4 py-3 text-center">Threshold</th>
                <th className="data-table-header px-4 py-3 text-left">Target / Action</th>
                <th className="data-table-header px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedConfigs.map((config) => {
                const tag = getTypeTag(config);
                const reason = getReasonDisplay(config);
                return (
                  <tr key={config.id} className="data-table-row">
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${tag.className}`}>
                        {tag.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm min-w-[280px]">
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{reason.primary}</div>
                        {reason.secondary && <div className="text-xs text-muted-foreground">{reason.secondary}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {assignmentOptions.find(o => o.value === config.assignment)?.label || config.assignment}
                    </td>
                    <td className="px-4 py-3 text-sm">{getTeamDisplay(config)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      {config.stickyColumn ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground uppercase">
                          {config.stickyColumn}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {config.configType !== 'rework' ? '-' : getStageLabels(config.stages || [])}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {config.partyType === 'external' ? 'External' : 'Internal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        config.policyScope === 'vmi' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : config.policyScope === 'cmi'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {config.policyScope === 'vmi' ? 'VMI' : config.policyScope === 'cmi' ? 'CMI' : 'Both'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={config.movesToCancellation ? 'text-green-500' : 'text-muted-foreground'}>
                        {config.movesToCancellation ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {config.automationEnabled ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {config.automationType === 'auto_resolve' ? 'Resolve' : 'Reassign'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">OFF</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {config.automationEnabled && config.automationType === 'auto_reassign' && config.automationDays ? `${config.automationDays} days` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(() => {
                        if (!config.automationEnabled) return '-';
                        if (config.automationType === 'auto_resolve') {
                          return (
                            <span className="text-xs text-muted-foreground italic">
                              Auto-resolve on selected date
                            </span>
                          );
                        }
                        const target = getTargetReasonLabel(config.targetReason);
                        if (!target) return '-';
                        return (
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{target.en}</div>
                            <div className="text-xs text-muted-foreground">{target.th}</div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(config)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </div>
    </div>
  );
}
