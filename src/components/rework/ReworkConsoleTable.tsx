import { useState } from 'react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ReworkConsoleTableProps {
  reworkConfigs: ReworkConfig[];
  onUpdate: (configs: ReworkConfig[]) => void;
}

const assignmentOptions: { value: AssignmentType; label: string }[] = [
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'rf_sc', label: 'RF/SC' },
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
    assignment: 'round_robin',
    stages: [],
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
        assignment: 'round_robin',
        stages: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdate(reworkConfigs.filter((config) => config.id !== id));
  };

  const handleSave = () => {
    if (editingConfig) {
      onUpdate(
        reworkConfigs.map((config) =>
          config.id === editingConfig.id
            ? { ...config, ...formData }
            : config
        )
      );
    } else {
      const newConfig: ReworkConfig = {
        id: String(Date.now()),
        descriptionTh: formData.descriptionTh || '',
        descriptionEn: formData.descriptionEn || '',
        team: formData.team || '',
        teamMembers: [],
        automationEnabled: false,
        assignment: formData.assignment || 'round_robin',
        stages: formData.stages || [],
      };
      onUpdate([...reworkConfigs, newConfig]);
    }
    setIsDialogOpen(false);
  };

  const handleTeamChange = (configId: string, team: string | null) => {
    onUpdate(
      reworkConfigs.map((config) =>
        config.id === configId
          ? { ...config, team: team || '' }
          : config
      )
    );
  };

  const handleAssignmentChange = (configId: string, assignment: AssignmentType) => {
    onUpdate(
      reworkConfigs.map((config) =>
        config.id === configId
          ? { ...config, assignment }
          : config
      )
    );
  };

  const handleStageToggle = (configId: string, stage: PipelineStage) => {
    onUpdate(
      reworkConfigs.map((config) => {
        if (config.id === configId) {
          const currentStages = config.stages || [];
          const newStages = currentStages.includes(stage)
            ? currentStages.filter((s) => s !== stage)
            : [...currentStages, stage];
          return { ...config, stages: newStages };
        }
        return config;
      })
    );
  };

  const getStageLabels = (stages: PipelineStage[]) => {
    if (!stages || stages.length === 0) return 'Select stages';
    if (stages.length === 1) {
      return stageOptions.find((s) => s.value === stages[0])?.label || stages[0];
    }
    return `${stages.length} stages selected`;
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
                  <Label htmlFor="descriptionTh">Description (Thai)</Label>
                  <Input
                    id="descriptionTh"
                    value={formData.descriptionTh}
                    onChange={(e) => setFormData({ ...formData, descriptionTh: e.target.value })}
                    placeholder="Enter Thai description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descriptionEn">Description (English)</Label>
                  <Input
                    id="descriptionEn"
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    placeholder="Enter English description"
                  />
                </div>
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
                          Team {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <th className="data-table-header px-4 py-3 text-left">Stage</th>
              <th className="data-table-header px-4 py-3 text-left">Team</th>
              <th className="data-table-header px-4 py-3 text-left">Assignment</th>
              <th className="data-table-header px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reworkConfigs.map((config) => (
              <tr key={config.id} className="data-table-row">
                <td className="px-4 py-3 text-sm">{config.descriptionTh}</td>
                <td className="px-4 py-3 text-sm">{config.descriptionEn}</td>
                <td className="px-4 py-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-[160px] h-8 text-xs justify-between"
                      >
                        <span className="truncate">{getStageLabels(config.stages || [])}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-2 bg-popover" align="start">
                      <div className="space-y-2">
                        {stageOptions.map((stage) => (
                          <div
                            key={stage.value}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                            onClick={() => handleStageToggle(config.id, stage.value)}
                          >
                            <Checkbox
                              checked={(config.stages || []).includes(stage.value)}
                              onCheckedChange={() => handleStageToggle(config.id, stage.value)}
                            />
                            <span className="text-sm">{stage.label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={config.team || '__none__'}
                    onValueChange={(value) =>
                      handleTeamChange(config.id, value === '__none__' ? null : value)
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select team</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team} value={team}>
                          Team {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={config.assignment || 'round_robin'}
                    onValueChange={(value) =>
                      handleAssignmentChange(config.id, value as AssignmentType)
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Select assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
