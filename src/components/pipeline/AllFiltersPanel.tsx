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

export interface FilterState {
  status: SaleStatus | 'all';
  rfAssignee: string;
  scAssignee: string;
  agent: string;
  agentTypes: string[];
  leadsType: string;
  createdBy: string;
}

export const defaultFilterState: FilterState = {
  status: 'all',
  rfAssignee: 'all',
  scAssignee: 'all',
  agent: 'all',
  agentTypes: [],
  leadsType: 'all',
  createdBy: 'all',
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
}

export function AllFiltersPanel({ filters, onFiltersChange, onClear }: AllFiltersPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  const rfStaff = mockStaffMembers.filter(s => s.team === 'AST RF');
  const scStaff = mockStaffMembers.filter(s => s.team === 'AST SC');

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
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(defaultFilterState);
  };

  const handleCancel = () => {
    setLocalFilters(filters);
    setOpen(false);
  };

  const hasActiveFilters = 
    filters.status !== 'all' ||
    filters.rfAssignee !== 'all' ||
    filters.scAssignee !== 'all' ||
    filters.agent !== 'all' ||
    filters.agentTypes.length > 0 ||
    filters.leadsType !== 'all' ||
    filters.createdBy !== 'all';

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
      <PopoverContent className="w-[700px] p-6 bg-card z-50" align="start">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
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
          </div>

          {/* Right Column */}
          <div className="space-y-6">
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

            {/* Agent Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Agent Type</Label>
              <div className="flex flex-wrap gap-3">
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

            {/* Leads Type */}
            <div className="space-y-3">
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
            <div className="space-y-3">
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
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleApply} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
