import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ReworkConfig, AssignmentType, PipelineStage, ReworkPartyType, PolicyScopeType } from '@/types/pipeline';
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
  { value: 'round_robin', label: 'Round-Robin' },
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
    descriptionTh: '',
    descriptionEn: '',
    team: '',
    assignment: 'rf_sc',
    stages: [],
    automationEnabled: false,
    automationDays: undefined,
    targetReason: undefined,
    movesToCancellation: false,
    partyType: 'internal',
    policyScope: 'both',
  });

  const openDialog = (config?: ReworkConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({ ...config });
    } else {
      setEditingConfig(null);
      setFormData({
        descriptionTh: '',
        descriptionEn: '',
        team: '',
        assignment: 'rf_sc',
        stages: [],
        automationEnabled: false,
        automationDays: undefined,
        targetReason: undefined,
        movesToCancellation: false,
        partyType: 'internal',
        policyScope: 'both',
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdate(reworkConfigs.filter((config) => config.id !== id));
  };

  const handleSave = () => {
    // If RF/SC or none, clear team since it's not used
    const teamValue = formData.assignment === 'rf_sc' || formData.assignment === 'none' ? '' : (formData.team || '');
    
    if (editingConfig) {
      onUpdate(
        reworkConfigs.map((config) =>
          config.id === editingConfig.id
            ? { ...config, ...formData, team: teamValue }
            : config
        )
      );
    } else {
      const newConfig: ReworkConfig = {
        id: String(Date.now()),
        descriptionTh: formData.descriptionTh || '',
        descriptionEn: formData.descriptionEn || '',
        team: teamValue,
        teamMembers: [],
        automationEnabled: formData.automationEnabled || false,
        automationDays: formData.automationDays,
        targetReason: formData.targetReason,
        assignment: formData.assignment || 'rf_sc',
        stages: formData.stages || [],
        movesToCancellation: formData.movesToCancellation || false,
        partyType: formData.partyType || 'internal',
        policyScope: formData.policyScope || 'both',
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
    if (config.assignment === 'rf_sc' || config.assignment === 'none') {
      return '-';
    }
    return config.team || '-';
  };

  const getTargetReasonLabel = (targetReasonId?: string) => {
    if (!targetReasonId) return '-';
    const targetConfig = uniqueConfigs.find(c => c.id === targetReasonId);
    if (!targetConfig) return '-';
    return targetConfig.descriptionEn;
  };

  // Pagination (dedupe by descriptions so "ซ้ำ" doesn't show in console)
  const uniqueConfigs = (() => {
    const seen = new Set<string>();
    const result: ReworkConfig[] = [];
    for (const c of reworkConfigs) {
      const key = `${(c.descriptionTh || '').trim().toLowerCase()}|${(c.descriptionEn || '').trim().toLowerCase()}`;
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
                Add Rework Reason
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? 'Edit Rework Reason' : 'Add New Rework Reason'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="descriptionTh">Description (TH)</Label>
                  <Input
                    id="descriptionTh"
                    value={formData.descriptionTh}
                    onChange={(e) => setFormData({ ...formData, descriptionTh: e.target.value })}
                    placeholder="Enter Thai description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descriptionEn">Description (EN)</Label>
                  <Input
                    id="descriptionEn"
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    placeholder="Enter English description"
                  />
                </div>
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
                <div className="grid gap-2">
                  <Label htmlFor="assignment">Assignment Logic</Label>
                  <Select 
                    value={formData.assignment || 'rf_sc'} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      assignment: value as AssignmentType,
                      team: value === 'rf_sc' || value === 'none' ? '' : formData.team 
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

                {/* Moves to Cancellation Section */}
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
                </div>

                {/* Date Automation Section */}
                <div className="border-t pt-4 mt-2">
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="automationEnabled">Enable Auto-Move</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically escalate after threshold days
                      </p>
                    </div>
                    <Switch
                      id="automationEnabled"
                      checked={formData.automationEnabled || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, automationEnabled: checked })}
                    />
                  </div>

                  {formData.automationEnabled && (
                    <div className="grid gap-4">
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
                    </div>
                  )}
                </div>
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
                <th className="data-table-header px-4 py-3 text-left min-w-[280px]">
                  Rework Reason
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
                  Auto-Move
                </th>
                <th className="data-table-header px-4 py-3 text-center">
                  Threshold
                </th>
                <th className="data-table-header px-4 py-3 text-left">
                  Target Status
                </th>
                <th className="data-table-header px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedConfigs.map((config) => (
                <tr key={config.id} className="data-table-row">
                  <td className="px-4 py-3 text-sm min-w-[280px]">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{config.descriptionEn}</div>
                      <div className="text-xs text-muted-foreground">{config.descriptionTh}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {assignmentOptions.find(o => o.value === config.assignment)?.label || config.assignment}
                  </td>
                  <td className="px-4 py-3 text-sm">{getTeamDisplay(config)}</td>
                  <td className="px-4 py-3 text-sm">{getStageLabels(config.stages || [])}</td>
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
                    <span className={config.movesToCancellation ? 'text-destructive' : 'text-muted-foreground'}>
                      {config.movesToCancellation ? 'YES' : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={config.automationEnabled ? 'text-green-500' : 'text-muted-foreground'}>
                      {config.automationEnabled ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {config.automationEnabled && config.automationDays ? `${config.automationDays} days` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {config.automationEnabled ? getTargetReasonLabel(config.targetReason) : '-'}
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
