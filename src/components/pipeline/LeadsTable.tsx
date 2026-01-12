import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  MoreVertical,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle
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

const paymentStatusOptions = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
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

function ReworkStatusBadge({ 
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

  if (!lead.reworkRequired && !lead.reworkReasonId) {
    return (
      <div className="flex items-center gap-1.5 text-success">
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Clear</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Rework Status Indicator */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-warning/15 text-warning border border-warning/30">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-semibold">Rework Required</span>
      </div>

      {/* Rework Reason Dropdown */}
      <Select 
        value={lead.reworkReasonId || ''} 
        onValueChange={(value) => onReworkChange(value || null)}
      >
        <SelectTrigger className="h-8 text-xs bg-warning/5 border-warning/30 hover:bg-warning/10">
          <SelectValue placeholder="Select reason" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Clear Rework</SelectItem>
          {reworkConfigs.map((config) => (
            <SelectItem key={config.id} value={config.id}>
              <div className="flex flex-col">
                <span>{config.descriptionEn}</span>
                <span className="text-xs text-muted-foreground">{config.team}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assignee Dropdown - only show when rework reason is selected */}
      {currentRework && teamMembers.length > 0 && (
        <Select 
          value={lead.assignedTo || ''} 
          onValueChange={(value) => onAssigneeChange(value || null)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={`Assign from ${currentRework.team}`} />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((member) => (
              <SelectItem key={member} value={member}>
                {member}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Show assigned person */}
      {lead.assignedTo && (
        <div className="text-xs text-muted-foreground">
          Assigned: <span className="font-medium text-foreground">{lead.assignedTo}</span>
        </div>
      )}
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
    const reworkConfig = reasonId ? reworkConfigs.find(r => r.id === reasonId) : null;
    onLeadUpdate?.(leadId, {
      reworkRequired: !!reasonId,
      reworkReasonId: reasonId || undefined,
      assignedTo: undefined, // Reset assignee when reason changes
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
              <th className="data-table-header px-4 py-3 text-left min-w-[200px]">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  Rework Status
                </div>
              </th>
              <SortableHeader column="rf">RF</SortableHeader>
              <SortableHeader column="sc">SC</SortableHeader>
              <SortableHeader column="status">Status</SortableHeader>
              <SortableHeader column="paymentStatus">Payment Status</SortableHeader>
              <th className="data-table-header w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
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
                    <ReworkStatusBadge 
                      lead={lead} 
                      reworkConfigs={reworkConfigs}
                      onReworkChange={(reasonId) => handleReworkChange(lead.id, reasonId)}
                      onAssigneeChange={(assignee) => handleAssigneeChange(lead.id, assignee)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm" className="text-xs">
                      Transfer RF
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm" className="text-xs">
                      Claim SC
                    </Button>
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
                    <Select defaultValue={lead.paymentStatus}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <DropdownMenuItem>Mark as Rework</DropdownMenuItem>
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
