import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useTeamsStore } from '@/stores/teamsStore';
import { StickyColumnType } from '@/types/pipeline';

import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const stickyColumnOptions: { value: StickyColumnType; label: string }[] = [
  { value: 'RF', label: 'RF' },
  { value: 'SC', label: 'SC' },
  { value: 'DE', label: 'DE' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Delivery', label: 'Delivery' },
];

export function TeamListTable() {
  const { teamEntries, addTeam, updateTeam, deleteTeam } = useTeamsStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newStickyColumn, setNewStickyColumn] = useState<StickyColumnType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editOriginalName, setEditOriginalName] = useState('');
  const [editStickyColumn, setEditStickyColumn] = useState<StickyColumnType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleAdd = () => {
    const name = newTeamName.trim();
    if (!name) {
      toast({ title: 'Validation Error', description: 'Team name is required.', variant: 'destructive' });
      return;
    }
    if (teamEntries.some(t => t.name === name)) {
      toast({ title: 'Already exists', description: `Team "${name}" already exists.`, variant: 'destructive' });
      return;
    }
    addTeam(name, newStickyColumn);
    setNewTeamName('');
    setNewStickyColumn(null);
    setAddDialogOpen(false);
  };

  const openEdit = (entry: { name: string; stickyColumn: StickyColumnType | null }) => {
    setEditOriginalName(entry.name);
    setEditName(entry.name);
    setEditStickyColumn(entry.stickyColumn);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    const name = editName.trim();
    if (!name) {
      toast({ title: 'Validation Error', description: 'Team name is required.', variant: 'destructive' });
      return;
    }
    if (name !== editOriginalName && teamEntries.some(t => t.name === name)) {
      toast({ title: 'Already exists', description: `Team "${name}" already exists.`, variant: 'destructive' });
      return;
    }
    updateTeam(editOriginalName, name, editStickyColumn);
    setEditDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteTeam(deleteTarget);
      setDeleteTarget(null);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Team List</h2>
          <p className="text-sm text-muted-foreground">Manage teams and their sticky column mappings</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Team
        </Button>
      </div>

      {/* Team table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="data-table-header px-4 py-3 text-left">#</th>
                <th className="data-table-header px-4 py-3 text-left">Team Name</th>
                <th className="data-table-header px-4 py-3 text-left">Sticky Column</th>
                
                <th className="data-table-header px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamEntries.map((entry, index) => {
                return (
                  <tr key={entry.name} className="data-table-row">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{entry.name}</td>
                    <td className="px-4 py-3 text-sm">
                      {entry.stickyColumn ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {entry.stickyColumn}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {memberCount > 0 ? (
                        <span className="text-muted-foreground" title={memberNames.join(', ')}>
                          {memberCount} ({memberNames.join(', ')})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(entry)} className="h-8 w-8 p-0">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(entry.name)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {teamEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No teams configured. Add a team above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Team Modal */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Team</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Team Name</Label>
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sticky Column</Label>
              <Select
                value={newStickyColumn || '__none__'}
                onValueChange={(v) => setNewStickyColumn(v === '__none__' ? null : v as StickyColumnType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sticky column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Unselected —</SelectItem>
                  {stickyColumnOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Team</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Team Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Team Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Team name" />
            </div>
            <div className="grid gap-2">
              <Label>Sticky Column</Label>
              <Select
                value={editStickyColumn || '__none__'}
                onValueChange={(v) => setEditStickyColumn(v === '__none__' ? null : v as StickyColumnType)}
              >
                <SelectTrigger><SelectValue placeholder="Select sticky column" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Unselected —</SelectItem>
                  {stickyColumnOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget}"? Staff members in this team will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
