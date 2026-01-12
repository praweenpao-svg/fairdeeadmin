import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  MoreVertical,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  X
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

interface LeadsTableProps {
  leads: Lead[];
  stage: PipelineStage;
  leadTypeFilter?: LeadType;
  reworkConfigs: ReworkConfig[];
  onLeadUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

const statusOptions = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'de_in_progress', label: 'DE in Progress' },
  { value: 'ready_for_de', label: 'Ready For DE' },
  { value: 'pending_issuance', label: 'Pending Issuance' },
  { value: 'policy_issued', label: 'Policy Issued' },
];

function LeadTypeBadge({ type }: { type: LeadType }) {
  const config = {
    new_leads: { label: 'Agent', className: 'lead-badge-agent' },
    coa: { label: 'COA', className: 'lead-badge-coa' },
    renewals: { label: 'Renewal', className: 'lead-badge-renewal' },
  };
  const { label, className } = config[type];
  return <span className={cn('lead-badge', className)}>{label}</span>;
}

function ReworkStatusCell({ 
  lead, 
  reworkConfigs,
  onReworkChange,
  onAssigneeChange
}: { 
  lead: Lead; 
  reworkConfigs: ReworkConfig[];
  onReworkChange: (reasonId: string | null) => void;
  onAssigneeChange: (assignee: string | null) => void;
}) {
  const currentRework = lead.reworkReasonId 
    ? reworkConfigs.find(r => r.id === lead.reworkReasonId) 
    : null;

  const teamMembers = currentRework?.teamMembers || [];

  // No rework - show clean status
  if (!lead.reworkRequired && !lead.reworkReasonId) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <CheckCircle className="w-4 h-4 text-success" />
        <span className="text-xs">No rework</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Rework indicator with reason */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-warning/10 border border-warning/20">
        <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-warning truncate">
            {currentRework?.descriptionEn || 'Pending'}
          </span>
          {lead.assignedTo && (
            <span className="text-[10px] text-muted-foreground truncate">
              → {lead.assignedTo}
            </span>
          )}
        </div>
      </div>

      {/* Quick actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <MoreVertical className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Change Reason
          </div>
          {reworkConfigs.map((config) => (
            <DropdownMenuItem 
              key={config.id}
              onClick={() => onReworkChange(config.id)}
              className={cn(
                "text-xs",
                lead.reworkReasonId === config.id && "bg-accent"
              )}
            >
              {config.descriptionEn}
            </DropdownMenuItem>
          ))}
          <div className="my-1 border-t" />
          {currentRework && teamMembers.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Assign to ({currentRework.team})
              </div>
              {teamMembers.map((member) => (
                <DropdownMenuItem 
                  key={member}
                  onClick={() => onAssigneeChange(member)}
                  className={cn(
                    "text-xs",
                    lead.assignedTo === member && "bg-accent"
                  )}
                >
                  {member}
                </DropdownMenuItem>
              ))}
              <div className="my-1 border-t" />
            </>
          )}
          <DropdownMenuItem 
            onClick={() => onReworkChange(null)}
            className="text-xs text-success"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-2" />
            Clear Rework
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
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
    onLeadUpdate?.(leadId, {
      reworkRequired: !!reasonId,
      reworkReasonId: reasonId || undefined,
      assignedTo: undefined,
    });
  };

  const handleAssigneeChange = (leadId: string, assignee: string | null) => {
    onLeadUpdate?.(leadId, {
      assignedTo: assignee || undefined,
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
              <SortableHeader column="createdOn">Created On</SortableHeader>
              <th className="data-table-header px-4 py-3 text-left">Vehicle Details</th>
              <SortableHeader column="status">Status</SortableHeader>
              <th className="data-table-header px-4 py-3 text-left">Rework Status</th>
              <th className="data-table-header w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
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
                    <Select defaultValue={lead.saleStatus}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <ReworkStatusCell 
                      lead={lead} 
                      reworkConfigs={reworkConfigs}
                      onReworkChange={(reasonId) => handleReworkChange(lead.id, reasonId)}
                      onAssigneeChange={(assignee) => handleAssigneeChange(lead.id, assignee)}
                    />
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
