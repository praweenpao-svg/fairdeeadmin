import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ReworkConfig, AssignmentType, PipelineStage, ReworkPartyType, PolicyScopeType, ReworkConfigType, EndorsementType, EndorsementStatus, AutomationType } from '@/types/pipeline';
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
  { value: 'admin', label: 'Admin' },
  { value: 'delivery', label: 'Delivery' },
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

const allPostLeadStages: PipelineStage[] = ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed', 'cancelled'];

// Helper function to check if a rework reason moves leads to Cancellation tab
// This checks the movesToCancellation property on the config
export function isCancellationReworkReason(reasonId: string, reworkConfigs: ReworkConfig[]): boolean {
  const config = reworkConfigs.find(c => c.id === reasonId);
  return config?.movesToCancellation === true;
}

// Filter out 'to_convert' from any stages array (not allowed in rework console)
const sanitizeStages = (stages: PipelineStage[]): PipelineStage[] => {
  return stages.filter(s => s !== 'to_convert');
};

export function ReworkConsoleTable({ reworkConfigs, onUpdate }: ReworkConsoleTableProps) {
  const { teams } = useTeamsStore();
  // Rework Console is always in English, ignoring language toggle
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
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdate(reworkConfigs.filter((config) => config.id !== id));
  };

  const handleSave = () => {
    // If RF/SC, RF, Admin, Delivery, Requestor, or none, clear team since it's not used
    const teamValue = formData.assignment === 'rf_sc' || formData.assignment === 'rf' || formData.assignment === 'admin' || formData.assignment === 'delivery' || formData.assignment === 'requestor' || formData.assignment === 'none' ? '' : (formData.team || '');
    
    // For endorsement type, force pre-selected values
    const isEndorsement = formData.configType === 'endorsement';

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
    const stages = isEndorsement ? allPostLeadStages : (formData.stages || []);
    const partyType = isEndorsement ? 'internal' as ReworkPartyType : (formData.partyType || 'internal');
    const policyScope = isEndorsement ? 'both' as PolicyScopeType : (formData.policyScope || 'both');
    const automationEnabled = isEndorsement ? false : (formData.automationEnabled || false);
    const automationType = isEndorsement ? undefined : (automationEnabled ? (formData.automationType || 'auto_reassign') : undefined);
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
        descriptionTh: isEndorsement ? '' : (formData.descriptionTh || ''),
        descriptionEn: isEndorsement ? '' : (formData.descriptionEn || ''),
        team: teamValue,
        teamMembers: [],
        automationEnabled,
        automationType,
        automationDays: isEndorsement ? undefined : formData.automationDays,
        targetReason: isEndorsement ? undefined : (automationType === 'auto_resolve' ? undefined : formData.targetReason),
        assignment: formData.assignment || 'rf_sc',
        stages,
        movesToCancellation,
        partyType,
        policyScope,
        endorsementConfigType: isEndorsement ? formData.endorsementConfigType : undefined,
        endorsementConfigStatus: isEndorsement ? formData.endorsementConfigStatus : undefined,
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
    if (config.assignment === 'rf_sc' || config.assignment === 'rf' || config.assignment === 'admin' || config.assignment === 'delivery' || config.assignment === 'requestor' || config.assignment === 'none') {
      return '-';
    }
    return config.team || '-';
  };

  const getTargetReasonLabel = (targetReasonId?: string): { en: string; th: string } | null => {
    if (!targetReasonId) return null;
    const targetConfig = uniqueConfigs.find(c => c.id === targetReasonId);
    if (!targetConfig) return null;
    return { en: targetConfig.descriptionEn, th: targetConfig.descriptionTh };
  };

  // Pagination (dedupe by descriptions so "ซ้ำ" doesn't show in console)
  const uniqueConfigs = (() => {
    const seen = new Set<string>();
    const result: ReworkConfig[] = [];
    for (const c of reworkConfigs) {
      // For endorsements, use configType + endorsementType + status as key to avoid false dedup
      const key = c.configType === 'endorsement'
        ? `endorsement|${c.endorsementConfigType}|${c.endorsementConfigStatus}`
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

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
          {/* Add Rework Reason Button */}
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
                {/* Type selector - top-level identifier */}
                <div className="grid gap-2">
                  <Label htmlFor="configType">Type</Label>
                  <Select 
                    value={formData.configType || 'rework'} 
                    onValueChange={(value) => {
                      const isEndorsement = value === 'endorsement';
                      setFormData({ 
                        ...formData, 
                        configType: value as ReworkConfigType,
                        // Reset endorsement fields when switching away
                        endorsementConfigType: isEndorsement ? (formData.endorsementConfigType || 'policy_endorsement') : undefined,
                        endorsementConfigStatus: isEndorsement ? (formData.endorsementConfigStatus || 'request_created') : undefined,
                        // Pre-select defaults for endorsement
                        movesToCancellation: isEndorsement ? false : formData.movesToCancellation,
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
                          // Find first available status for new type
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

                {/* TH/EN Description - only for Rework */}
                {formData.configType !== 'endorsement' && (
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
                {formData.configType !== 'endorsement' && (
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
                {formData.configType !== 'endorsement' && (
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
                    <p className="text-xs text-muted-foreground">
                      {formData.policyScope === 'both' 
                        ? 'This reason applies to both VMI and CMI policies'
                        : formData.policyScope === 'vmi'
                        ? 'This reason applies only to VMI policies'
                        : 'This reason applies only to CMI policies'}
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="assignment">Assignment Logic</Label>
                  <Select 
                    value={formData.assignment || 'rf_sc'} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      assignment: value as AssignmentType,
                      team: value === 'rf_sc' || value === 'rf' || value === 'admin' || value === 'delivery' || value === 'requestor' || value === 'none' ? '' : formData.team 
                    })}
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
                      ? 'Assigns to whoever created the rework/endorsement request'
                      : formData.assignment === 'none'
                      ? 'No owner assignment for this rework reason'
                      : 'Distributes tasks fairly among selected team members'}
                  </p>
                </div>
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

                {/* Stages - only for Rework */}
                {formData.configType !== 'endorsement' && (
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

                {/* Moves to Cancellation Section - shown for both Rework and Endorsement */}
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
                {formData.configType !== 'endorsement' && (
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
                        {/* Automation Type Toggle */}
                        <div className="grid gap-2">
                          <Label>Automation Type</Label>
                          <Select 
                            value={formData.automationType || 'auto_reassign'} 
                            onValueChange={(value) => setFormData({ 
                              ...formData, 
                              automationType: value as AutomationType,
                              // Clear target reason when switching to auto_resolve
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

                        {/* Threshold Days - only for Auto-Reassign */}
                        {(formData.automationType || 'auto_reassign') === 'auto_reassign' && (
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
                        )}

                        {/* Target Reason - only for Auto-Move */}
                        {(formData.automationType || 'auto_reassign') === 'auto_reassign' && (
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
                <th className="data-table-header px-4 py-3 text-center">
                  Type
                </th>
                <th className="data-table-header px-4 py-3 text-left min-w-[280px]">
                  Reason
                </th>
                <th className="data-table-header px-4 py-3 text-left">
                  Assignment Logic
                </th>
                <th className="data-table-header px-4 py-3 text-left">
                  Teams
                </th>
                <th className="data-table-header px-4 py-3 text-left">
                  Stages
                </th>
                <th className="data-table-header px-4 py-3 text-center">
                  Party
                </th>
                <th className="data-table-header px-4 py-3 text-center">
                  VMI/CMI
                </th>
                <th className="data-table-header px-4 py-3 text-center">
                  Cancellation
                </th>
                <th className="data-table-header px-4 py-3 text-center">
                  Automation
                </th>
                <th className="data-table-header px-4 py-3 text-center">
                  Threshold
                </th>
                <th className="data-table-header px-4 py-3 text-left">
                  Target / Action
                </th>
                <th className="data-table-header px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedConfigs.map((config) => (
                <tr key={config.id} className="data-table-row">
                  <td className="px-4 py-3 text-sm text-center">
                    {config.configType === 'endorsement' ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        config.endorsementConfigType === 'policy_cancellation'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {config.endorsementConfigType === 'policy_cancellation' ? 'Cancel' : 'Endorse'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        Rework
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm min-w-[280px]">
                    {config.configType === 'endorsement' ? (
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">
                          {endorsementStatusOptions.find(o => o.value === config.endorsementConfigStatus)?.label || '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {config.endorsementConfigStatus === 'request_created' ? 'สร้างคำขอแล้ว'
                            : config.endorsementConfigStatus === 'request_submitted' ? 'ส่งคำขอแล้ว'
                            : config.endorsementConfigStatus === 'request_approved' ? 'อนุมัติคำขอแล้ว'
                            : config.endorsementConfigStatus === 'pending_on_ops' ? 'รอดำเนินการ OPS'
                            : config.endorsementConfigStatus === 'pending_finance' ? 'รอการเงิน'
                            : config.endorsementConfigStatus === 'invalid' ? 'ไม่ถูกต้อง'
                            : '-'}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{config.descriptionEn}</div>
                        <div className="text-xs text-muted-foreground">{config.descriptionTh}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {assignmentOptions.find(o => o.value === config.assignment)?.label || config.assignment}
                  </td>
                  <td className="px-4 py-3 text-sm">{getTeamDisplay(config)}</td>
                  <td className="px-4 py-3 text-sm">
                    {config.configType === 'endorsement' ? '-' : getStageLabels(config.stages || [])}
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
