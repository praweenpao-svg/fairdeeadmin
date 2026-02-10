import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { FilterState } from './AllFiltersPanel';
import { mockStaffMembers } from '@/data/mockStaff';

// Mock agents from leads data
const mockAgents = [
  { id: 'FD-3460', name: 'Akshay Bazad' },
  { id: 'FM-5368', name: 'James Santes' },
  { id: 'FM-5369', name: 'Harriett Joyce' },
  { id: 'FM-5370', name: 'Jennifer Haines' },
  { id: 'FM-5371', name: 'Michael Chen' },
  { id: 'FM-5372', name: 'Sarah Wilson' },
];

const agentTypeLabels: Record<string, string> = {
  all: 'All Agent Types',
  direct: 'Direct Agent',
  mlm: 'MLM Agent',
  inspection: 'Inspection Garage',
  office: 'Agent Office',
};

interface FilterChipsProps {
  dateRange: DateRange | undefined;
  filters: FilterState;
  onRemoveDateRange: () => void;
  onRemoveFilter: (key: keyof FilterState, value?: string) => void;
}

export function FilterChips({
  dateRange,
  filters,
  onRemoveDateRange,
  onRemoveFilter,
}: FilterChipsProps) {
  const chips: React.ReactNode[] = [];

  // Date range chip
  if (dateRange?.from && dateRange?.to) {
    chips.push(
      <Badge
        key="date-range"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        {format(dateRange.from, "d MMM")} to {format(dateRange.to, "d MMM")}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={onRemoveDateRange}
        />
      </Badge>
    );
  }

  // RF Assignee chip
  if (filters.rfAssignee && filters.rfAssignee !== 'all') {
    const staff = mockStaffMembers.find(s => s.id === filters.rfAssignee);
    chips.push(
      <Badge
        key="rf-assignee"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        RF: {staff?.name || filters.rfAssignee}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('rfAssignee')}
        />
      </Badge>
    );
  }

  // SC Assignee chip
  if (filters.scAssignee && filters.scAssignee !== 'all') {
    const staff = mockStaffMembers.find(s => s.id === filters.scAssignee);
    chips.push(
      <Badge
        key="sc-assignee"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        SC: {staff?.name || filters.scAssignee}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('scAssignee')}
        />
      </Badge>
    );
  }

  // DE Assignee chip
  if (filters.deAssignee && filters.deAssignee !== 'all') {
    const staff = mockStaffMembers.find(s => s.id === filters.deAssignee);
    chips.push(
      <Badge
        key="de-assignee"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        DE: {staff?.name || filters.deAssignee}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('deAssignee')}
        />
      </Badge>
    );
  }

  // Agent chips
  if (filters.agent && filters.agent !== 'all') {
    const agent = mockAgents.find(a => a.id === filters.agent);
    chips.push(
      <Badge
        key="agent"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        {filters.agent} - {agent?.name}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('agent')}
        />
      </Badge>
    );
  }

  // Agent type chips
  filters.agentTypes.forEach((type) => {
    chips.push(
      <Badge
        key={`agent-type-${type}`}
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        {agentTypeLabels[type] || type}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('agentTypes', type)}
        />
      </Badge>
    );
  });

  // Leads type chip
  if (filters.leadsType !== 'all') {
    chips.push(
      <Badge
        key="leads-type"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        {filters.leadsType.charAt(0).toUpperCase() + filters.leadsType.slice(1)}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('leadsType')}
        />
      </Badge>
    );
  }

  // Lead Type chip (for All/To Pay - single select)
  if (filters.leadType && filters.leadType !== 'all') {
    const leadTypeLabels: Record<string, string> = {
      new_leads: 'New Leads',
      coa: 'COA',
      renewals: 'Renewals',
      sales: 'Sales',
    };
    chips.push(
      <Badge
        key="lead-type"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        {leadTypeLabels[filters.leadType] || filters.leadType}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('leadType')}
        />
      </Badge>
    );
  }

  // Installment type chip
  if (filters.installmentType && filters.installmentType !== 'all') {
    const installmentLabels: Record<string, string> = {
      installment: 'Installment',
      non_installment: 'Non-Installment',
    };
    chips.push(
      <Badge
        key="installment-type"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        {installmentLabels[filters.installmentType] || filters.installmentType}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('installmentType')}
        />
      </Badge>
    );
  }

  // Created by chip
  if (filters.createdBy !== 'all') {
    chips.push(
      <Badge
        key="created-by"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        Created by: {filters.createdBy.charAt(0).toUpperCase() + filters.createdBy.slice(1)}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('createdBy')}
        />
      </Badge>
    );
  }

  // Status chip
  if (filters.status !== 'all') {
    chips.push(
      <Badge
        key="status"
        variant="secondary"
        className="gap-1 px-3 py-1.5 text-sm font-normal"
      >
        Status: {filters.status.replace(/_/g, ' ')}
        <X
          className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
          onClick={() => onRemoveFilter('status')}
        />
      </Badge>
    );
  }

  if (chips.length === 0) return null;

  return <div className="flex flex-wrap items-center gap-2">{chips}</div>;
}
