import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  MoreVertical,
  ArrowUpDown 
} from 'lucide-react';
import { Lead, PipelineStage, LeadType } from '@/types/pipeline';
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

function getDisplayStatus(status: string): string {
  const mapping: Record<string, string> = {
    docs_collected: 'Pending Review',
    docs_pending: 'Pending Review',
    docs_approved: 'Pending Issuance',
    pending_review: 'Pending Review',
    under_review: 'Under Review',
    de_in_progress: 'DE in Progress',
    ready_for_de: 'Ready For DE',
    pending_issuance: 'Pending Issuance',
    policy_issued: 'Policy Issued',
  };
  return mapping[status] || status;
}

function LeadTypeBadge({ type }: { type: LeadType }) {
  const config = {
    new_leads: { label: 'Agent', className: 'lead-badge-agent' },
    coa: { label: 'COA', className: 'lead-badge-coa' },
    renewals: { label: 'Renewal', className: 'lead-badge-renewal' },
  };
  const { label, className } = config[type];
  return <span className={cn('lead-badge', className)}>{label}</span>;
}

export function LeadsTable({ leads, stage, leadTypeFilter }: LeadsTableProps) {
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

  // Filter leads based on stage and lead type
  let filteredLeads = leads;
  if (stage === 'to_pay' && leadTypeFilter) {
    filteredLeads = leads.filter((lead) => lead.leadType === leadTypeFilter);
  }

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
              <SortableHeader column="rf">RF</SortableHeader>
              <SortableHeader column="sc">SC</SortableHeader>
              <SortableHeader column="status">Status</SortableHeader>
              <SortableHeader column="paymentStatus">Payment Status</SortableHeader>
              <th className="data-table-header w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                  No leads found for this stage
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="data-table-row">
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
          Showing 1 to {filteredLeads.length} of {filteredLeads.length} results
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
