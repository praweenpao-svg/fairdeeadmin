import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ReworkConfig } from '@/types/pipeline';
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

interface ReworkConsoleTableProps {
  reworkConfigs: ReworkConfig[];
  onUpdate: (configs: ReworkConfig[]) => void;
}

export function ReworkConsoleTable({ reworkConfigs, onUpdate }: ReworkConsoleTableProps) {
  const { teams } = useTeamsStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReworkConfig | null>(null);

  const [formData, setFormData] = useState<Partial<ReworkConfig>>({
    descriptionTh: '',
    descriptionEn: '',
    team: '',
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
              <th className="data-table-header px-4 py-3 text-left">Team</th>
              <th className="data-table-header px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reworkConfigs.map((config) => (
              <tr key={config.id} className="data-table-row">
                <td className="px-4 py-3 text-sm">{config.descriptionTh}</td>
                <td className="px-4 py-3 text-sm">{config.descriptionEn}</td>
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
