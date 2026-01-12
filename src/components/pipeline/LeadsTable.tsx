import { useState } from 'react';
import { 
  ExternalLink, 
  MoreVertical,
  ArrowUpDown,
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
  ],
  to_report: [
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'de_in_progress', label: 'DE in Progress' },
  ],
  to_issue: [
    { value: 'pending_issuance', label: 'Pending Issuance' },
  ],
  to_deliver: [
    { value: 'policy_issued', label: 'Policy Issued' },
  ],
  completed: [
    { value: 'policy_issued', label: 'Policy Issued' },
    { value: 'policy_shipped', label: 'Policy Shipped' },
    { value: 'policy_delivered', label: 'Policy Delivered' },
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

// Helper to get staff members by team
function getStaffByTeam(team: string) {
  return mockStaffMembers.filter(staff => staff.team === team);
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

export function LeadsTable({ leads, stage, leadTypeFilter, reworkConfigs, onLeadUpdate }: LeadsTableProps) {
  const [reworkDialogOpen, setReworkDialogOpen] = useState(false);
  const [reworkHistoryDialogOpen, setReworkHistoryDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [pendingReworkReasonId, setPendingReworkReasonId] = useState<string | null>(null);

  const handleReworkSelectChange = (leadId: string, reasonId: string | null) => {
    if (reasonId && reasonId !== 'none') {
      const lead = leads.find(l => l.id === leadId);
      setSelectedLead(lead || null);
      setPendingReworkReasonId(reasonId);
      setReworkDialogOpen(true);
    } else {
      // Clear rework
      onLeadUpdate?.(leadId, {
        reworkRequired: false,
        reworkReasonId: undefined,
        assignedTo: undefined,
      });
    }
  };

  const handleReworkConfirm = (details: string, attachments: ReworkAttachment[]) => {
    if (!selectedLead || !pendingReworkReasonId) return;

    const reworkConfig = reworkConfigs.find(r => r.id === pendingReworkReasonId);
    const reasonLabel = reworkConfig?.descriptionEn || 'Unknown';
    
    // Create new history entry
    const historyEntry: ReworkHistoryEntry = {
      id: crypto.randomUUID(),
      reasonId: pendingReworkReasonId,
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
    };

    let assignedOwner: string | undefined;
    if (reworkConfig && reworkConfig.assignment === 'round_robin') {
      assignedOwner = getNextRoundRobinStaff(reworkConfig.team);
    }

    onLeadUpdate?.(selectedLead.id, {
      reworkRequired: true,
      reworkReasonId: pendingReworkReasonId,
      assignedTo: assignedOwner,
      reworkHistory: [...selectedLead.reworkHistory, historyEntry],
    });

    setSelectedLead(null);
    setPendingReworkReasonId(null);
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

  // Sort leads to show rework required first
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (a.reworkRequired && !b.reworkRequired) return -1;
    if (!a.reworkRequired && b.reworkRequired) return 1;
    return 0;
  });

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <th className="data-table-header px-4 py-3 text-left">
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown className="w-3.5 h-3.5" />
      </button>
    </th>
  );

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="data-table-header w-10 px-4 py-3"></th>
                <SortableHeader column="leads">Leads</SortableHeader>
                <SortableHeader column="agent">Agent</SortableHeader>
                <SortableHeader column="createdOn">Created on</SortableHeader>
                <th className="data-table-header px-4 py-3 text-left">Vehicle details</th>
                <SortableHeader column="status">Status</SortableHeader>
                <th className="data-table-header px-4 py-3 text-left">Rework status</th>
                <th className="data-table-header px-4 py-3 text-left">Owner</th>
                <th className="data-table-header w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No leads found for this stage
                  </td>
                </tr>
              ) : (
                sortedLeads.map((lead) => (
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
                      <Select defaultValue={lead.saleStatus || defaultStatusByStage[stage]}>
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
                    </td>
                    <td className="px-4 py-3">
                      <Select 
                        value={lead.reworkReasonId || 'none'}
                        onValueChange={(value) => handleReworkSelectChange(lead.id, value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="w-[220px] h-8 text-xs">
                          <SelectValue placeholder="No rework" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No rework</SelectItem>
                          {reworkConfigs.map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.descriptionEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const currentRework = lead.reworkReasonId 
                          ? reworkConfigs.find(r => r.id === lead.reworkReasonId)
                          : null;
                        
                        if (!currentRework) {
                          return <span className="text-xs text-muted-foreground">-</span>;
                        }
                        
                        // For round robin assignment, show the assigned owner as read-only
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-sm px-2 py-1 bg-muted rounded">
                              {lead.assignedTo || 'Unassigned'}
                            </span>
                          </div>
                        );
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
      </div>

      {/* Rework Dialog */}
      <ReworkDialog
        open={reworkDialogOpen}
        onOpenChange={(open) => {
          setReworkDialogOpen(open);
          if (!open) {
            setSelectedLead(null);
            setPendingReworkReasonId(null);
          }
        }}
        reasonLabel={reworkConfigs.find(r => r.id === pendingReworkReasonId)?.descriptionEn || ''}
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
      />
    </>
  );
}
