import * as React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockStaffMembers } from '@/data/mockStaff';
import { SaleStatus } from '@/types/pipeline';

export type SortField = 'createdOn' | 'updatedOn';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface FilterState {
  status: SaleStatus | 'all';
  rfAssignee: string;
  scAssignee: string;
  deAssignee: string;
  agent: string;
  agentTypes: string[];
  leadsType: string;
  createdBy: string;
  leadType: string; // Single-select for To Pay: 'new_leads', 'coa', 'renewals'
  installmentType: string;
}

export const defaultFilterState: FilterState = {
  status: 'all',
  rfAssignee: 'all',
  scAssignee: 'all',
  deAssignee: 'all',
  agent: 'all',
  agentTypes: [],
  leadsType: 'all',
  createdBy: 'all',
  leadType: 'new_leads', // Default to new_leads for To Pay
  installmentType: 'all',
};

const statusOptions: { value: SaleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'waiting_for_insurer', label: 'Waiting for Insurer' },
  { value: 'partially_added', label: 'Partially Added' },
  { value: 'completed', label: 'Completed' },
  { value: 'quotation_shared', label: 'Quotation Shared' },
  { value: 'invalid', label: 'Invalid' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'under_review', label: 'Under Review' },
];

const agentTypeOptions = [
  { id: 'all', label: 'All Agent Types' },
  { id: 'direct', label: 'Direct Agent' },
  { id: 'mlm', label: 'MLM Agent' },
  { id: 'inspection', label: 'Inspection Garage' },
  { id: 'office', label: 'Agent Office' },
];

const leadsTypeOptions = [
  { value: 'all', label: 'All Leads Type' },
  { value: 'system', label: 'System' },
  { value: 'custom', label: 'Custom' },
  { value: 'brochure', label: 'Brochure' },
];

const createdByOptions = [
  { value: 'all', label: 'All Creator' },
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
];

const leadTypeOptions = [
  { value: 'new_leads', label: 'New Leads' },
  { value: 'coa', label: 'COA' },
  { value: 'renewals', label: 'Renewals' },
];

const installmentOptions = [
  { value: 'all', label: 'All' },
  { value: 'installment', label: 'Installment' },
  { value: 'non_installment', label: 'Non-Installment' },
];

// Mock agents for demo
const mockAgents = [
  { id: 'FD-5391', name: 'Sharon Duncan' },
  { id: 'FM-5392', name: 'Kelli Lopez' },
  { id: 'FM-5390', name: 'Mary Collins abc' },
  { id: 'FD-5393', name: 'John Smith' },
  { id: 'FM-5394', name: 'Jane Doe' },
];

interface AllFiltersPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClear: () => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

export function AllFiltersPanel({ filters, onFiltersChange, onClear, sortConfig, onSortChange }: AllFiltersPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);
  const [localSort, setLocalSort] = React.useState<SortConfig>(sortConfig);

  const rfStaff = mockStaffMembers.filter(s => s.team === 'AST RF');
  const scStaff = mockStaffMembers.filter(s => s.team === 'AST SC');
  const deStaff = mockStaffMembers.filter(s => s.team === 'DE');

  const handleAgentTypeChange = (typeId: string, checked: boolean) => {
    let newTypes: string[];
    if (typeId === 'all') {
      newTypes = checked ? ['all'] : [];
    } else {
      newTypes = localFilters.agentTypes.filter(t => t !== 'all');
      if (checked) {
        newTypes.push(typeId);
      } else {
        newTypes = newTypes.filter(t => t !== typeId);
      }
    }
    setLocalFilters({ ...localFilters, agentTypes: newTypes });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onSortChange(localSort);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(defaultFilterState);
    setLocalSort({ field: 'createdOn', direction: 'desc' });
  };

  const handleCancel = () => {
    setLocalFilters(filters);
    setLocalSort(sortConfig);
    setOpen(false);
  };

  const hasActiveFilters = 
    filters.status !== 'all' ||
    filters.rfAssignee !== 'all' ||
    filters.scAssignee !== 'all' ||
    filters.deAssignee !== 'all' ||
    filters.agent !== 'all' ||
    filters.agentTypes.length > 0 ||
    filters.leadsType !== 'all' ||
    filters.createdBy !== 'all' ||
    filters.leadType !== 'new_leads' ||
    filters.installmentType !== 'all';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          All Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              !
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[900px] p-6 bg-card z-50" align="start">
        {/* Sort By Section */}
        <div className="mb-6 pb-4 border-b border-border">
          <Label className="text-sm font-medium mb-3 block">Sort By</Label>
          <div className="flex items-center gap-4">
            <Select
              value={localSort.field}
              onValueChange={(value) => setLocalSort({ ...localSort, field: value as SortField })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="createdOn">Created On</SelectItem>
                <SelectItem value="updatedOn">Latest Updated On</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={localSort.direction}
              onValueChange={(value) => setLocalSort({ ...localSort, direction: value as SortDirection })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            {/* Status */}
            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={localFilters.status}
                onValueChange={(value) => setLocalFilters({ ...localFilters, status: value as SaleStatus | 'all' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search status" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* RF */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">RF</Label>
              <Select
                value={localFilters.rfAssignee}
                onValueChange={(value) => setLocalFilters({ ...localFilters, rfAssignee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search RF" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">All RF</SelectItem>
                  {rfStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SC */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">SC</Label>
              <Select
                value={localFilters.scAssignee}
                onValueChange={(value) => setLocalFilters({ ...localFilters, scAssignee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search SC" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">All SC</SelectItem>
                  {scStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DE */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">DE</Label>
              <Select
                value={localFilters.deAssignee}
                onValueChange={(value) => setLocalFilters({ ...localFilters, deAssignee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search DE" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">All DE</SelectItem>
                  {deStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agent</Label>
              <Select
                value={localFilters.agent}
                onValueChange={(value) => setLocalFilters({ ...localFilters, agent: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">All Agents</SelectItem>
                  {mockAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.id} - {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {/* Agent Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agent Type</Label>
              <div className="flex flex-wrap gap-2">
                {agentTypeOptions.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`agent-type-${type.id}`}
                      checked={localFilters.agentTypes.includes(type.id)}
                      onCheckedChange={(checked) => handleAgentTypeChange(type.id, checked as boolean)}
                      className="border-primary data-[state=checked]:bg-primary"
                    />
                    <Label
                      htmlFor={`agent-type-${type.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Type (Single-select for To Pay) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lead Type</Label>
              <RadioGroup
                value={localFilters.leadType}
                onValueChange={(value) => setLocalFilters({ ...localFilters, leadType: value })}
                className="flex flex-wrap gap-4"
              >
                {leadTypeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={`lead-type-${option.value}`}
                      className="border-primary text-primary"
                    />
                    <Label
                      htmlFor={`lead-type-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Installment Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Installment Type</Label>
              <RadioGroup
                value={localFilters.installmentType}
                onValueChange={(value) => setLocalFilters({ ...localFilters, installmentType: value })}
                className="flex flex-wrap gap-4"
              >
                {installmentOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={`installment-${option.value}`}
                      className="border-primary text-primary"
                    />
                    <Label
                      htmlFor={`installment-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            {/* Leads Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Leads Type</Label>
              <RadioGroup
                value={localFilters.leadsType}
                onValueChange={(value) => setLocalFilters({ ...localFilters, leadsType: value })}
                className="space-y-2"
              >
                {leadsTypeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={`leads-type-${option.value}`}
                      className="border-primary text-primary"
                    />
                    <Label
                      htmlFor={`leads-type-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Created By */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Created By</Label>
              <RadioGroup
                value={localFilters.createdBy}
                onValueChange={(value) => setLocalFilters({ ...localFilters, createdBy: value })}
                className="space-y-2"
              >
                {createdByOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={`created-by-${option.value}`}
                      className="border-primary text-primary"
                    />
                    <Label
                      htmlFor={`created-by-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleApply} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
