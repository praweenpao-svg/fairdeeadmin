import { useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { ReworkConfig } from '@/types/pipeline';
import { teams } from '@/data/mockLeads';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

interface AdminReworkLogProps {
  reworkConfigs: ReworkConfig[];
  onUpdate: (configs: ReworkConfig[]) => void;
}

export function AdminReworkLog({ reworkConfigs, onUpdate }: AdminReworkLogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReworkConfig | null>(null);
  const [newMember, setNewMember] = useState('');

  const [formData, setFormData] = useState<Partial<ReworkConfig>>({
    descriptionTh: '',
    descriptionEn: '',
    team: '',
    teamMembers: [],
    automationEnabled: false,
    automationDays: undefined,
    targetReason: '',
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
        teamMembers: [],
        automationEnabled: false,
        automationDays: undefined,
        targetReason: '',
      });
    }
    setIsDialogOpen(true);
  };

  const toggleAutomation = (id: string) => {
    onUpdate(
      reworkConfigs.map((config) =>
        config.id === id
          ? { ...config, automationEnabled: !config.automationEnabled }
          : config
      )
    );
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
        teamMembers: formData.teamMembers || [],
        automationEnabled: formData.automationEnabled || false,
        automationDays: formData.automationDays,
        targetReason: formData.targetReason,
      };
      onUpdate([...reworkConfigs, newConfig]);
    }
    setIsDialogOpen(false);
  };

  const addTeamMember = () => {
    if (newMember.trim() && !formData.teamMembers?.includes(newMember.trim())) {
      setFormData({
        ...formData,
        teamMembers: [...(formData.teamMembers || []), newMember.trim()],
      });
      setNewMember('');
    }
  };

  const removeTeamMember = (member: string) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers?.filter((m) => m !== member) || [],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Admin Rework Log</h2>
          <p className="text-sm text-muted-foreground">
            Manage rework reasons, team assignments, and automation settings
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
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
                  value={formData.team} 
                  onValueChange={(value) => setFormData({ ...formData, team: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Members Management */}
              <div className="grid gap-2">
                <Label>Team Members (Assignees)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    placeholder="Add team member name"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
                  />
                  <Button type="button" variant="outline" onClick={addTeamMember}>
                    Add
                  </Button>
                </div>
                {formData.teamMembers && formData.teamMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.teamMembers.map((member) => (
                      <Badge key={member} variant="secondary" className="gap-1">
                        {member}
                        <button
                          type="button"
                          onClick={() => removeTeamMember(member)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="automation">Enable Automation</Label>
                <Switch 
                  id="automation" 
                  checked={formData.automationEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, automationEnabled: checked })}
                />
              </div>
              
              {formData.automationEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="days">Days</Label>
                    <Input
                      id="days"
                      type="number"
                      value={formData.automationDays || ''}
                      onChange={(e) => setFormData({ ...formData, automationDays: parseInt(e.target.value) || undefined })}
                      placeholder="Number of days"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetReason">Target Reason</Label>
                    <Select 
                      value={formData.targetReason || ''}
                      onValueChange={(value) => setFormData({ ...formData, targetReason: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document_incomplete">Document Incomplete</SelectItem>
                        <SelectItem value="payment_issue">Payment Issue</SelectItem>
                        <SelectItem value="verification_failed">Verification Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="data-table-header px-4 py-3 text-left">Description (TH)</th>
              <th className="data-table-header px-4 py-3 text-left">Description (EN)</th>
              <th className="data-table-header px-4 py-3 text-left">Team</th>
              <th className="data-table-header px-4 py-3 text-left">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Team Members
                </div>
              </th>
              <th className="data-table-header px-4 py-3 text-center">Automation</th>
              <th className="data-table-header px-4 py-3 text-center">Days</th>
              <th className="data-table-header px-4 py-3 text-left">Target Reason</th>
              <th className="data-table-header px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reworkConfigs.map((config) => (
              <tr key={config.id} className="data-table-row">
                <td className="px-4 py-3 text-sm">{config.descriptionTh}</td>
                <td className="px-4 py-3 text-sm">{config.descriptionEn}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant="outline">{config.team}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {config.teamMembers.slice(0, 2).map((member) => (
                      <Badge key={member} variant="secondary" className="text-xs">
                        {member}
                      </Badge>
                    ))}
                    {config.teamMembers.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{config.teamMembers.length - 2}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Switch
                    checked={config.automationEnabled}
                    onCheckedChange={() => toggleAutomation(config.id)}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {config.automationEnabled ? config.automationDays || '-' : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {config.automationEnabled ? config.targetReason || '-' : '-'}
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
