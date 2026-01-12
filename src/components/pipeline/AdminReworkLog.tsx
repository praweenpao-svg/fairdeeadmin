import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ReworkConfig } from '@/types/pipeline';
import { mockReworkConfigs, teams } from '@/data/mockLeads';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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

export function AdminReworkLog() {
  const [reworkConfigs, setReworkConfigs] = useState<ReworkConfig[]>(mockReworkConfigs);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReworkConfig | null>(null);

  const toggleAutomation = (id: string) => {
    setReworkConfigs((prev) =>
      prev.map((config) =>
        config.id === id
          ? { ...config, automationEnabled: !config.automationEnabled }
          : config
      )
    );
  };

  const handleEdit = (config: ReworkConfig) => {
    setEditingConfig(config);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setReworkConfigs((prev) => prev.filter((config) => config.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Admin Rework Log</h2>
          <p className="text-sm text-muted-foreground">
            Manage rework reasons and automation settings
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingConfig(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rework Reason
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
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
                  defaultValue={editingConfig?.descriptionTh}
                  placeholder="Enter Thai description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descriptionEn">Description (English)</Label>
                <Input
                  id="descriptionEn"
                  defaultValue={editingConfig?.descriptionEn}
                  placeholder="Enter English description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team">Team</Label>
                <Select defaultValue={editingConfig?.team}>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="automation">Enable Automation</Label>
                <Switch id="automation" defaultChecked={editingConfig?.automationEnabled} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="days">Days</Label>
                  <Input
                    id="days"
                    type="number"
                    defaultValue={editingConfig?.automationDays}
                    placeholder="Number of days"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetReason">Target Reason</Label>
                  <Select defaultValue={editingConfig?.targetReason}>
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
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
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
                <td className="px-4 py-3 text-sm">{config.team}</td>
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
                      onClick={() => handleEdit(config)}
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
