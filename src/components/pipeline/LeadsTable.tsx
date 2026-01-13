import { useState } from 'react';
import { 
  ExternalLink, 
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { Lead, PipelineStage, LeadType, ReworkConfig, CreatedByType, ReworkAttachment, ReworkHistoryEntry } from '@/types/pipeline';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { TablePagination } from '@/components/ui/table-pagination';
import { mockStaffMembers } from '@/data/mockStaff';
import { ReworkDialog } from './ReworkDialog';
import { ReworkHistoryDialog } from './ReworkHistoryDialog';

interface LeadsTableProps {
  leads: Lead[];
  stage: PipelineStage;
  leadTypeFilter?: LeadType;
  reworkConfigs: ReworkConfig[];
  onLeadUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

const statusOptionsByStage: Record<PipelineStage, { value: string; label: string }[]> = {
  to_pay: [
    { value: 'pending', label: 'Pending' },
    { value: 'waiting_for_insurer', label: 'Waiting for Insurer' },
    { value: 'partially_added', label: 'Partially Added' },
    { value: 'completed', label: 'Completed' },
    { value: 'quotation_shared', label: 'Quotation Shared With Agent' },
    { value: 'invalid', label: 'Invalid' },
    { value: 'rework_required', label: 'Rework Required' },
  ],
  to_report: [
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'de_in_progress', label: 'DE in Progress' },
    { value: 'rework_required', label: 'Rework Required' },
  ],
  to_issue: [
    { value: 'pending_issuance', label: 'Pending Issuance' },
    { value: 'rework_required', label: 'Rework Required' },
  ],
  to_deliver: [
    { value: 'policy_issued', label: 'Policy Issued' },
    { value: 'rework_required', label: 'Rework Required' },
  ],
  completed: [
    { value: 'policy_issued', label: 'Policy Issued' },
    { value: 'policy_shipped', label: 'Policy Shipped' },
    { value: 'policy_delivered', label: 'Policy Delivered' },
    { value: 'rework_required', label: 'Rework Required' },
  ],
};

const defaultStatusByStage: Record<PipelineStage, string> = {
  to_pay: 'pending',
  to_report: 'pending_review',
  to_issue: 'pending_issuance',
  to_deliver: 'policy_issued',
  completed: 'policy_delivered',
};

function CreatedByBadge({ createdBy }: { createdBy: CreatedByType }) {
  const config = {
    agent: { label: 'Agent', className: 'lead-badge-agent' },
    admin: { label: 'Admin', className: 'lead-badge-admin' },
  };
  const { label, className } = config[createdBy];
  return <span className={cn('lead-badge', className)}>{label}</span>;
}

// Helper to get staff members by team (based on fixed rosters)
const teamRosters: Record<string, string[]> = {
  'AST RF': ['Ricky', 'Jenny', 'Tommy'],
  'AST SC': ['Lisa', 'Mike', 'Nina'],
  'DE': ['Oscar', 'Paula', 'Quinn'],
  'Admin': ['Rachel', 'Sam', 'Tina'],
};

function getStaffByTeam(team: string) {
  const roster = teamRosters[team];
  if (!roster) return mockStaffMembers.filter((staff) => staff.team === team);

  return mockStaffMembers.filter((staff) => roster.includes(staff.name));
}

// Get RF staff (AST RF team)
function getRFStaff() {
  return mockStaffMembers.filter(staff => staff.team === 'AST RF');
}

// Get SC staff (AST SC team)
function getSCStaff() {
  return mockStaffMembers.filter(staff => staff.team === 'AST SC');
}

// Get DE staff (DE team)
function getDEStaff() {
  return mockStaffMembers.filter(staff => staff.team === 'DE');
}

// Round robin state per team
const roundRobinIndexes: Record<string, number> = {};

// Get next staff member via round robin for a team
function getNextRoundRobinStaff(team: string): string | undefined {
  const teamStaff = getStaffByTeam(team);
  if (teamStaff.length === 0) return undefined;
  
  if (!(team in roundRobinIndexes)) {
    roundRobinIndexes[team] = 0;
  }
  
  const staff = teamStaff[roundRobinIndexes[team] % teamStaff.length];
  roundRobinIndexes[team] = (roundRobinIndexes[team] + 1) % teamStaff.length;
  
  return staff.name;
}

// Get next DE staff via round robin
function getNextDERoundRobin(): string | undefined {
  return getNextRoundRobinStaff('DE');
}

export function LeadsTable({ leads, stage, leadTypeFilter, reworkConfigs, onLeadUpdate }: LeadsTableProps) {
  const [reworkDialogOpen, setReworkDialogOpen] = useState(false);
  const [reworkHistoryDialogOpen, setReworkHistoryDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Check if we should show DE column (all stages except to_pay)
  const showDEColumn = stage !== 'to_pay';

  // Filter rework configs by current stage
  const stageReworkConfigs = reworkConfigs.filter(config => config.stages.includes(stage));

  const handleStatusChange = (lead: Lead, newStatus: string) => {
    if (newStatus === 'rework_required') {
      setSelectedLead(lead);
      setReworkDialogOpen(true);
    } else {
      // When status changes to pending_review at To Report, assign DE
      const updates: Partial<Lead> = {
        saleStatus: newStatus as Lead['saleStatus'],
        reworkRequired: false,
        reworkReasonId: undefined,
        assignedTo: undefined,
      };

      // Auto-assign DE when entering pending_review at To Report stage
      if (stage === 'to_report' && newStatus === 'pending_review' && !lead.deAssignee) {
        updates.deAssignee = getNextDERoundRobin();
      }

      onLeadUpdate?.(lead.id, updates);
    }
  };

  const handleReworkConfirm = (reasonId: string, details: string, attachments: ReworkAttachment[]) => {
    if (!selectedLead || !reasonId) return;

    // Store current status before marking as rework required
    const previousStatus = selectedLead.saleStatus;
    
    const reworkConfig = reworkConfigs.find(r => r.id === reasonId);
    const reasonLabel = reworkConfig?.descriptionEn || 'Unknown';
    
    const newHistoryEntry: ReworkHistoryEntry = {
      id: crypto.randomUUID(),
      reasonId,
      reasonLabel,
      details,
      attachments,
      savedBy: 'Akshay Bazad',
      savedAt: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      previousStatus,
    };

    // Determine assigned owner based on assignment type
    let assignedOwner: string | undefined;
    if (reworkConfig) {
      if (reworkConfig.assignment === 'round_robin') {
        assignedOwner = getNextRoundRobinStaff(reworkConfig.team);
      } else if (reworkConfig.assignment === 'rf_sc') {
        // RF/SC assignment: prefer SC, fallback to RF
        assignedOwner = selectedLead.scAssignee || selectedLead.rfAssignee;
      }
    }

    onLeadUpdate?.(selectedLead.id, {
      reworkRequired: true,
      reworkReasonId: reasonId,
      assignedTo: assignedOwner,
      reworkHistory: [...selectedLead.reworkHistory, newHistoryEntry],
    });

    setSelectedLead(null);
  };

  const handleResolveRework = (entryId: string) => {
    if (!selectedLead) return;

    const entryIndex = selectedLead.reworkHistory.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;

    const entry = selectedLead.reworkHistory[entryIndex];
    const resolvedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Update the history entry with resolved status
    const updatedHistory = [...selectedLead.reworkHistory];
    updatedHistory[entryIndex] = {
      ...entry,
      resolved: true,
      resolvedAt,
      resolvedBy: 'Akshay Bazad',
    };

    // Check if this is the latest unresolved rework entry
    const hasOtherUnresolvedRework = updatedHistory.some(
      (e, idx) => idx !== entryIndex && !e.resolved
    );

    // Restore previous status if no other unresolved rework exists
    const updates: Partial<Lead> = {
      reworkHistory: updatedHistory,
    };

    if (!hasOtherUnresolvedRework) {
      updates.reworkRequired = false;
      updates.reworkReasonId = undefined;
      updates.assignedTo = undefined;
      // Restore to previous status or default for this stage
      updates.saleStatus = entry.previousStatus || defaultStatusByStage[stage] as Lead['saleStatus'];
    }

    // Update selectedLead state immediately so the dialog reflects the change
    setSelectedLead({
      ...selectedLead,
      ...updates,
    });

    onLeadUpdate?.(selectedLead.id, updates);
  };

  const handleReassignRework = (entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => {
    if (!selectedLead) return;

    const entryIndex = selectedLead.reworkHistory.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;

    const entry = selectedLead.reworkHistory[entryIndex];
    const newReworkConfig = reworkConfigs.find(r => r.id === newReasonId);
    const newReasonLabel = newReworkConfig?.descriptionEn || 'Unknown';

    const resolvedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Mark original entry as resolved (reassigned)
    const updatedHistory = [...selectedLead.reworkHistory];
    updatedHistory[entryIndex] = {
      ...entry,
      resolved: true,
      resolvedAt,
      resolvedBy: 'Akshay Bazad (Reassigned)',
    };

    // Create new rework entry with the new reason
    const newHistoryEntry: ReworkHistoryEntry = {
      id: crypto.randomUUID(),
      reasonId: newReasonId,
      reasonLabel: newReasonLabel,
      details: details || `Reassigned from: ${entry.reasonLabel}`,
      attachments,
      savedBy: 'Akshay Bazad',
      savedAt: resolvedAt,
      previousStatus: entry.previousStatus, // Keep the original previous status
    };

    // Determine new assigned owner based on assignment type
    let assignedOwner: string | undefined;
    if (newReworkConfig) {
      if (newReworkConfig.assignment === 'round_robin') {
        assignedOwner = getNextRoundRobinStaff(newReworkConfig.team);
      } else if (newReworkConfig.assignment === 'rf_sc') {
        assignedOwner = selectedLead.scAssignee || selectedLead.rfAssignee;
      }
    }

    const updates: Partial<Lead> = {
      reworkHistory: [...updatedHistory, newHistoryEntry],
      reworkReasonId: newReasonId,
      assignedTo: assignedOwner,
    };

    // Update selectedLead state immediately so the dialog reflects the change
    setSelectedLead({
      ...selectedLead,
      ...updates,
    });

    onLeadUpdate?.(selectedLead.id, updates);
  };

  const handleOpenReworkHistory = (lead: Lead) => {
    setSelectedLead(lead);
    setReworkHistoryDialogOpen(true);
  };

  // Filter leads based on lead type
  let filteredLeads = leads;
  if (leadTypeFilter) {
    filteredLeads = leads.filter((lead) => lead.leadType === leadTypeFilter);
  }

  // Sort leads by timestamp (most recent first), then rework required
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    // First, sort by createdOn date (most recent first)
    const dateA = new Date(a.createdOn).getTime();
    const dateB = new Date(b.createdOn).getTime();
    if (dateB !== dateA) return dateB - dateA;
    
    // Then prioritize rework required
    if (a.reworkRequired && !b.reworkRequired) return -1;
    if (!a.reworkRequired && b.reworkRequired) return 1;
    return 0;
  });

  // Pagination
  const totalItems = sortedLeads.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedLeads = sortedLeads.slice(
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

  // Get owner based on stage and rework status
  const getOwner = (lead: Lead): string | undefined => {
    // If rework is required, assignedTo takes priority
    if (lead.reworkRequired && lead.assignedTo) {
      return lead.assignedTo;
    }

    // Stage-specific ownership logic
    if (stage === 'to_pay') {
      // To Pay: SC if available, else RF
      return lead.scAssignee || lead.rfAssignee;
    } else {
      // All other stages: DE is the owner (unless rework)
      return lead.deAssignee;
    }
  };

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="data-table-header w-10 px-4 py-3"></th>
                <th className="data-table-header px-4 py-3 text-left">Leads</th>
                <th className="data-table-header px-4 py-3 text-left">Agent</th>
                <th className="data-table-header px-4 py-3 text-left">Created on</th>
                <th className="data-table-header px-4 py-3 text-left">Vehicle details</th>
                <th className="data-table-header px-4 py-3 text-left">RF</th>
                <th className="data-table-header px-4 py-3 text-left">SC</th>
                {showDEColumn && (
                  <th className="data-table-header px-4 py-3 text-left">DE</th>
                )}
                <th className="data-table-header px-4 py-3 text-left">Status</th>
                <th className="data-table-header px-4 py-3 text-left">Owner</th>
                <th className="data-table-header w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={showDEColumn ? 11 : 10} className="px-4 py-12 text-center text-muted-foreground">
                    No leads found for this stage
                  </td>
                </tr>
              ) : (
              paginatedLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className={cn(
                      'data-table-row',
                      lead.reworkRequired && 'bg-warning/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-8 w-8 p-0',
                          lead.reworkHistory.length > 0 && 'text-warning hover:text-warning'
                        )}
                        onClick={() => handleOpenReworkHistory(lead)}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{lead.leadNumber}</span>
                        <CreatedByBadge createdBy={lead.createdBy} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <a
                          href="#"
                          className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
                        >
                          {lead.agentId}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-xs text-muted-foreground">{lead.agentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{lead.createdOn}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{lead.vehicleDetails || '-'}</span>
                        <span className="text-xs text-muted-foreground">N/A</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select 
                        value={lead.rfAssignee || '__none__'}
                        onValueChange={(value) => onLeadUpdate?.(lead.id, { rfAssignee: value === '__none__' ? undefined : value })}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Select RF" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-muted-foreground">
                            — Unassigned —
                          </SelectItem>
                          {getRFStaff().map((staff) => (
                            <SelectItem key={staff.id} value={staff.name}>
                              {staff.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Select 
                        value={lead.scAssignee || '__none__'}
                        onValueChange={(value) => onLeadUpdate?.(lead.id, { scAssignee: value === '__none__' ? undefined : value })}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Select SC" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-muted-foreground">
                            — Unassigned —
                          </SelectItem>
                          {getSCStaff().map((staff) => (
                            <SelectItem key={staff.id} value={staff.name}>
                              {staff.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    {showDEColumn && (
                      <td className="px-4 py-3">
                        <Select 
                          value={lead.deAssignee || '__none__'}
                          onValueChange={(value) => onLeadUpdate?.(lead.id, { deAssignee: value === '__none__' ? undefined : value })}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="Select DE" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-muted-foreground">
                              — Unassigned —
                            </SelectItem>
                            {getDEStaff().map((staff) => (
                              <SelectItem key={staff.id} value={staff.name}>
                                {staff.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {lead.reworkRequired ? (
                        <div 
                          className="w-[200px] h-8 text-xs border border-warning text-warning rounded-md px-3 flex items-center cursor-pointer hover:bg-warning/10"
                          onClick={() => handleOpenReworkHistory(lead)}
                        >
                          Rework Required
                        </div>
                      ) : (
                        <Select 
                          value={lead.saleStatus || defaultStatusByStage[stage]}
                          onValueChange={(value) => handleStatusChange(lead, value)}
                        >
                          <SelectTrigger className="w-[200px] h-8 text-xs">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptionsByStage[stage].map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const owner = getOwner(lead);
                        if (owner) {
                          return (
                            <span className="text-sm px-2 py-1 bg-muted rounded">
                              {owner}
                            </span>
                          );
                        }
                        return <span className="text-xs text-muted-foreground">-</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
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

      {/* Rework Dialog */}
      <ReworkDialog
        open={reworkDialogOpen}
        onOpenChange={(open) => {
          setReworkDialogOpen(open);
          if (!open) {
            setSelectedLead(null);
          }
        }}
        reworkConfigs={stageReworkConfigs}
        onConfirm={handleReworkConfirm}
      />

      {/* Rework History Dialog */}
      <ReworkHistoryDialog
        open={reworkHistoryDialogOpen}
        onOpenChange={(open) => {
          setReworkHistoryDialogOpen(open);
          if (!open) {
            setSelectedLead(null);
          }
        }}
        leadNumber={selectedLead?.leadNumber || ''}
        history={selectedLead?.reworkHistory || []}
        reworkConfigs={stageReworkConfigs}
        onResolve={handleResolveRework}
        onReassign={handleReassignRework}
      />
    </>
  );
}
