import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';
import { Lead, PipelineStage, LeadType, ReworkConfig } from '@/types/pipeline';
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

function LeadTypeBadge({ type }: { type: LeadType }) {
  const config = {
    new_leads: { label: 'Agent', className: 'lead-badge-agent' },
    coa: { label: 'COA', className: 'lead-badge-coa' },
    renewals: { label: 'Renewal', className: 'lead-badge-renewal' },
  };
  const { label, className } = config[type];
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleReworkChange = (leadId: string, reasonId: string | null) => {
    if (reasonId) {
      const reworkConfig = reworkConfigs.find(r => r.id === reasonId);
      if (reworkConfig && reworkConfig.assignment === 'round_robin') {
        const assignedOwner = getNextRoundRobinStaff(reworkConfig.team);
        onLeadUpdate?.(leadId, {
          reworkRequired: true,
          reworkReasonId: reasonId,
          assignedTo: assignedOwner,
        });
        return;
      }
    }
    onLeadUpdate?.(leadId, {
      reworkRequired: !!reasonId,
      reworkReasonId: reasonId || undefined,
      assignedTo: undefined,
    });
  };

  // Filter leads based on stage and lead type
  let filteredLeads = leads;
  if (stage === 'to_pay' && leadTypeFilter) {
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
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown className="w-3.5 h-3.5" />
      </button>
    </th>
  );

  return (
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
                <>
                  <tr 
                    key={lead.id} 
                    className={cn(
                      'data-table-row',
                      lead.reworkRequired && 'bg-warning/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRow(lead.id)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        {expandedRows.has(lead.id) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{lead.leadNumber}</span>
                        <LeadTypeBadge type={lead.leadType} />
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
                        onValueChange={(value) => handleReworkChange(lead.id, value === 'none' ? null : value)}
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
                  {/* Expanded Row */}
                  {expandedRows.has(lead.id) && (
                    <tr key={`${lead.id}-expanded`} className="bg-muted/30">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left Column - Lead Details */}
                          <div className="space-y-3">
                            <div className="flex gap-8">
                              <div>
                                <span className="text-xs text-muted-foreground block">Last Status Update</span>
                                <span className="text-sm">2026-01-12T05:16:29.430Z</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground block">Created by</span>
                                <span className="text-sm">{lead.agentName}</span>
                              </div>
                            </div>
                            {lead.leadType === 'coa' && (
                              <>
                                <div className="flex gap-8">
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Type of Insured</span>
                                    <span className="text-sm">-</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block">Previous Insurer</span>
                                  <span className="text-sm">Bangkok Insurance</span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block">Created by</span>
                                  <span className="text-sm">{lead.agentName}</span>
                                </div>
                              </>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="cursor-pointer hover:text-foreground">📝 {lead.leadType === 'coa' ? 'Additional Notes' : 'Remarks'}</span>
                            </div>
                          </div>

                          {/* Right Column - Insurer Details */}
                          <div className="border-l border-border pl-6">
                            <div className="grid grid-cols-5 gap-4 text-xs">
                              <div className="font-medium text-muted-foreground">Insurer</div>
                              <div className="font-medium text-muted-foreground">1st Email Sent</div>
                              <div className="font-medium text-muted-foreground">Follow Up</div>
                              {lead.leadType === 'coa' ? (
                                <div className="font-medium text-muted-foreground">Insurer Status</div>
                              ) : (
                                <>
                                  <div className="font-medium text-muted-foreground">Insurance Class</div>
                                  <div className="font-medium text-muted-foreground">Garage Type</div>
                                </>
                              )}
                            </div>
                            <div className="grid grid-cols-5 gap-4 text-sm mt-2">
                              <div>
                                <span className="block">Bangkok Insurance</span>
                                <span className="text-xs text-muted-foreground">3 Days</span>
                              </div>
                              <div>
                                <span className="block text-xs">2026-01-09T13:50:37.049Z</span>
                                <span className="text-xs text-muted-foreground">2026-01-09T13:50:37.049Z</span>
                              </div>
                              <div>-</div>
                              {lead.leadType === 'coa' ? (
                                <div>
                                  <Select defaultValue="pending">
                                    <SelectTrigger className="w-[120px] h-7 text-xs">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="approved">Approved</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <>
                                  <div>type_1_insurance</div>
                                  <div>0</div>
                                </>
                              )}
                            </div>
                            {lead.leadType === 'coa' && (
                              <div className="mt-4">
                                <span className="text-xs font-medium text-muted-foreground block mb-2">COA Documents</span>
                                <div className="flex gap-2">
                                  <div className="flex items-center gap-1 px-2 py-1 bg-background border rounded text-xs">
                                    📄 Screenshot 2568-07-07 at 09.16.55.png
                                  </div>
                                  <div className="flex items-center gap-1 px-2 py-1 bg-background border rounded text-xs">
                                    📄 Screenshot 2568-07-14 at 14.11.47.png
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">
          Showing 1 to {sortedLeads.length} of {sortedLeads.length} results
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Page</span>
            <input
              type="number"
              defaultValue={1}
              className="w-12 h-8 text-center border border-border rounded bg-background"
            />
            <span>of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
