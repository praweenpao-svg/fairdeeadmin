import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Users } from 'lucide-react';
import { StaffMember, mockStaffMembers } from '@/data/mockStaff';
import { useTeamsStore } from '@/stores/teamsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function StaffTimingTable() {
  const [staff, setStaff] = useState<StaffMember[]>(mockStaffMembers);
  const { teams, addTeam, updateTeam, deleteTeam } = useTeamsStore();
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isAddTimingsOpen, setIsAddTimingsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState<{ index: number; name: string } | null>(null);

  const handleTeamChange = (staffId: string, team: string | null) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, team } : s))
    );
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
  };

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      addTeam(newTeamName.trim());
      setNewTeamName('');
    }
  };

  const handleEditTeam = (index: number, newName: string) => {
    const oldName = teams[index];
    updateTeam(oldName, newName);
    
    // Update staff members with the old team name
    setStaff((prev) =>
      prev.map((s) => (s.team === oldName ? { ...s, team: newName } : s))
    );
    setEditingTeam(null);
  };

  const handleDeleteTeam = (index: number) => {
    const teamToDelete = teams[index];
    deleteTeam(teamToDelete);
    
    // Clear team from staff members
    setStaff((prev) =>
      prev.map((s) => (s.team === teamToDelete ? { ...s, team: null } : s))
    );
  };

  const openEditStaff = (staffMember: StaffMember) => {
    setEditingStaff({ ...staffMember });
    setIsAddTimingsOpen(true);
  };

  const handleSaveStaff = () => {
    if (editingStaff) {
      setStaff((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? editingStaff : s))
      );
    }
    setIsAddTimingsOpen(false);
    setEditingStaff(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Staff Timing</h2>
          <p className="text-sm text-muted-foreground">
            Manage staff schedules and team assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Team Management Button */}
          <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Manage Teams</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Add new team */}
                <div className="flex gap-2">
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="New team name"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                  />
                  <Button onClick={handleAddTeam} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Team list */}
                <div className="space-y-2">
                  {teams.map((team, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/30"
                    >
                      {editingTeam?.index === index ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingTeam.name}
                            onChange={(e) =>
                              setEditingTeam({ ...editingTeam, name: e.target.value })
                            }
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTeam(index, editingTeam.name)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTeam(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium">{team}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTeam({ index, name: team })}
                              className="h-7 w-7 p-0"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTeam(index)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Timings Button */}
          <Dialog open={isAddTimingsOpen} onOpenChange={setIsAddTimingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setEditingStaff(null)}>Add Timings</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingStaff ? 'Edit Staff Timing' : 'Add Staff Timing'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Staff Name</Label>
                    <Input
                      value={editingStaff?.name || ''}
                      onChange={(e) =>
                        setEditingStaff((prev) =>
                          prev ? { ...prev, name: e.target.value } : null
                        )
                      }
                      placeholder="Staff name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      value={editingStaff?.email || ''}
                      onChange={(e) =>
                        setEditingStaff((prev) =>
                          prev ? { ...prev, email: e.target.value } : null
                        )
                      }
                      placeholder="email@fairdee.co.th"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Team</Label>
                  <Select
                    value={editingStaff?.team || '__none__'}
                    onValueChange={(value) =>
                      setEditingStaff((prev) =>
                        prev ? { ...prev, team: value === '__none__' ? null : value } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No team</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={editingStaff?.startTime?.slice(0, 5) || '09:00'}
                      onChange={(e) =>
                        setEditingStaff((prev) =>
                          prev ? { ...prev, startTime: e.target.value + ':00' } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={editingStaff?.endTime?.slice(0, 5) || '12:00'}
                      onChange={(e) =>
                        setEditingStaff((prev) =>
                          prev ? { ...prev, endTime: e.target.value + ':00' } : null
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Shift 2 Start Time</Label>
                    <Input
                      type="time"
                      value={editingStaff?.shift2StartTime?.slice(0, 5) || '13:00'}
                      onChange={(e) =>
                        setEditingStaff((prev) =>
                          prev ? { ...prev, shift2StartTime: e.target.value + ':00' } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Shift 2 End Time</Label>
                    <Input
                      type="time"
                      value={editingStaff?.shift2EndTime?.slice(0, 5) || '18:00'}
                      onChange={(e) =>
                        setEditingStaff((prev) =>
                          prev ? { ...prev, shift2EndTime: e.target.value + ':00' } : null
                        )
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddTimingsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveStaff}>
                  {editingStaff?.id ? 'Update' : 'Add'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="data-table-header px-4 py-3 text-left">Staff</th>
                <th className="data-table-header px-4 py-3 text-left">Email</th>
                <th className="data-table-header px-4 py-3 text-left">Team</th>
                <th className="data-table-header px-4 py-3 text-left">Start time</th>
                <th className="data-table-header px-4 py-3 text-left">End time</th>
                <th className="data-table-header px-4 py-3 text-left">Shift 2 start time</th>
                <th className="data-table-header px-4 py-3 text-left">Shift 2 end time</th>
                <th className="data-table-header px-4 py-3 text-center">Edit</th>
                <th className="data-table-header px-4 py-3 text-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="data-table-row">
                  <td className="px-4 py-3 text-sm font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={member.team || '__none__'}
                      onValueChange={(value) =>
                        handleTeamChange(member.id, value === '__none__' ? null : value)
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
                  <td className="px-4 py-3 text-sm">{member.startTime}</td>
                  <td className="px-4 py-3 text-sm">{member.endTime}</td>
                  <td className="px-4 py-3 text-sm">{member.shift2StartTime}</td>
                  <td className="px-4 py-3 text-sm">{member.shift2EndTime}</td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditStaff(member)}
                      className="h-7 px-3 text-xs text-primary border-primary hover:bg-primary/10"
                    >
                      Edit
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStaff(member.id)}
                      className="h-7 px-3 text-xs"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
