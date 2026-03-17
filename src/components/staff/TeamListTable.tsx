import { useState } from 'react';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { useTeamsStore, TeamEntry } from '@/stores/teamsStore';
import { StickyColumnType } from '@/types/pipeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
  const { teamEntries, addTeam, updateTeam, updateTeamStickyColumn, deleteTeam } = useTeamsStore();
  const [newTeamName, setNewTeamName] = useState('');
  const [newStickyColumn, setNewStickyColumn] = useState<StickyColumnType | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editStickyColumn, setEditStickyColumn] = useState<StickyColumnType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleAdd = () => {
    if (newTeamName.trim()) {
      addTeam(newTeamName.trim(), newStickyColumn);
      setNewTeamName('');
      setNewStickyColumn(null);
    }
  };

  const startEdit = (index: number) => {
    const entry = teamEntries[index];
    setEditingIndex(index);
    setEditName(entry.name);
    setEditStickyColumn(entry.stickyColumn);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const oldName = teamEntries[editingIndex].name;
    if (editName.trim()) {
      updateTeam(oldName, editName.trim(), editStickyColumn);
    }
    setEditingIndex(null);
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
          <p className="text-sm text-muted-foreground">
            Manage teams and their sticky column mappings
          </p>
        </div>
      </div>

      {/* Add new team row */}
      <div className="flex items-center gap-2">
        <Input
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="New team name"
          className="max-w-[220px]"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Select
          value={newStickyColumn || '__none__'}
          onValueChange={(v) => setNewStickyColumn(v === '__none__' ? null : v as StickyColumnType)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sticky Column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No mapping</SelectItem>
            {stickyColumnOptions.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Add Team
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
                <th className="data-table-header px-4 py-3 text-center">Members</th>
                <th className="data-table-header px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamEntries.map((entry, index) => (
                <tr key={entry.name} className="data-table-row">
                  <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                  {editingIndex === index ? (
                    <>
                      <td className="px-4 py-3">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 max-w-[200px]"
                          autoFocus
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={editStickyColumn || '__none__'}
                          onValueChange={(v) => setEditStickyColumn(v === '__none__' ? null : v as StickyColumnType)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No mapping</SelectItem>
                            {stickyColumnOptions.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">—</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={handleSaveEdit} className="h-7 text-xs">
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)} className="h-7 w-7 p-0">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
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
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">—</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(index)} className="h-8 w-8 p-0">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(entry.name)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
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
