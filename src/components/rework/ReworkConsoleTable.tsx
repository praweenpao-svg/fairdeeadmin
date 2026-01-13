import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ReworkConfig, AssignmentType, PipelineStage } from '@/types/pipeline';
import { useTeamsStore } from '@/stores/teamsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
];

const stageOptions: { value: PipelineStage; label: string }[] = [
  { value: 'to_pay', label: 'To Pay' },
  { value: 'to_report', label: 'To Report' },
  { value: 'to_issue', label: 'To Issue' },
  { value: 'to_deliver', label: 'To Deliver' },
  { value: 'completed', label: 'Completed' },
];

export function ReworkConsoleTable({ reworkConfigs, onUpdate }: ReworkConsoleTableProps) {
  const { teams } = useTeamsStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReworkConfig | null>(null);

  const [formData, setFormData] = useState<Partial<ReworkConfig>>({
    descriptionTh: '',
    descriptionEn: '',
    team: '',
    assignment: 'rf_sc',
    stages: [],
    automationEnabled: false,
    automationDays: undefined,
    targetReason: undefined,
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
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdate(reworkConfigs.filter((config) => config.id !== id));
  };

  const handleSave = () => {
    // If RF/SC, clear team since it's not used
    const teamValue = formData.assignment === 'rf_sc' ? '' : (formData.team || '');
    
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
    if (config.assignment === 'rf_sc') {
      return '-';
    }
    return config.team || '-';
  };

  const getTargetReasonLabel = (targetReasonId?: string) => {
    if (!targetReasonId) return '-';
    const targetConfig = reworkConfigs.find(c => c.id === targetReasonId);
    return targetConfig?.descriptionEn || '-';
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
                  <Label htmlFor="assignment">Assignment Logic</Label>
                  <Select 
                    value={formData.assignment || 'rf_sc'} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      assignment: value as AssignmentType,
                      team: value === 'rf_sc' ? '' : formData.team 
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
                </div>

                {/* Date Automation Section */}
                <div className="border-t pt-4 mt-2">
                  <h4 className="text-sm font-medium mb-3">Date Automation (Self-Healing)</h4>
                  
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
                            {reworkConfigs
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
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="data-table-header px-4 py-3 text-left">Description (TH)</th>
              <th className="data-table-header px-4 py-3 text-left">Description (EN)</th>
              <th className="data-table-header px-4 py-3 text-left">Assignment Logic</th>
              <th className="data-table-header px-4 py-3 text-left">Teams</th>
              <th className="data-table-header px-4 py-3 text-left">Stages</th>
              <th className="data-table-header px-4 py-3 text-center">Auto-Move</th>
              <th className="data-table-header px-4 py-3 text-center">Threshold</th>
              <th className="data-table-header px-4 py-3 text-left">Target Status</th>
              <th className="data-table-header px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reworkConfigs.map((config) => (
              <tr key={config.id} className="data-table-row">
                <td className="px-4 py-3 text-sm">{config.descriptionTh}</td>
                <td className="px-4 py-3 text-sm">{config.descriptionEn}</td>
                <td className="px-4 py-3 text-sm">
                  {assignmentOptions.find(o => o.value === config.assignment)?.label || config.assignment}
                </td>
                <td className="px-4 py-3 text-sm">{getTeamDisplay(config)}</td>
                <td className="px-4 py-3 text-sm">{getStageLabels(config.stages || [])}</td>
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
    </div>
  );
}
