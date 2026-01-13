import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

export interface OtherStagesFilterState {
  rfAssignee: string;
  scAssignee: string;
  deAssignee: string;
  agent: string;
  insurer: string;
  policyStatus: string;
  paymentStatus: string;
  invoiceStatuses: string[];
  insuranceClasses: string[];
  saleTypes: string[];
  paymentMethods: string[];
  carInspectionStatuses: string[];
  leadTypes: string[];
  installmentType: string;
}

export const defaultOtherStagesFilterState: OtherStagesFilterState = {
  rfAssignee: 'all',
  scAssignee: 'all',
  deAssignee: 'all',
  agent: 'all',
  insurer: 'all',
  policyStatus: 'all',
  paymentStatus: 'all',
  invoiceStatuses: ['all'],
  insuranceClasses: ['all'],
  saleTypes: ['all'],
  paymentMethods: ['all'],
  carInspectionStatuses: ['all'],
  leadTypes: ['all'],
  installmentType: 'all',
};

const mockAgents = [
  { id: 'FD-5391', name: 'Sharon Duncan' },
  { id: 'FM-5392', name: 'Kelli Lopez' },
  { id: 'FM-5390', name: 'Mary Collins abc' },
];

const mockInsurers = [
  { id: 'ins-1', name: 'Thai Paiboon Insurance' },
  { id: 'ins-2', name: 'Viriyah Insurance' },
  { id: 'ins-3', name: 'Bangkok Insurance' },
];

const policyStatusOptions = [
  { value: 'all', label: 'All Policy Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'issued', label: 'Issued' },
  { value: 'cancelled', label: 'Cancelled' },
];

const paymentStatusOptions = [
  { value: 'all', label: 'All Payment Status' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
];

const invoiceStatusOptions = [
  { id: 'all', label: 'All Statuses' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'underpaid', label: 'Underpaid' },
  { id: 'overpaid', label: 'Overpaid' },
  { id: 'fully_paid', label: 'Fully Paid' },
];

const insuranceClassOptions = [
  { id: 'all', label: 'All Classes' },
  { id: '1', label: '1' },
  { id: '2+', label: '2+' },
  { id: '2', label: '2' },
  { id: '3+', label: '3+' },
  { id: '3', label: '3' },
];

const saleTypeOptions = [
  { id: 'all', label: 'All Sale Types' },
  { id: 'cbc_fairdee', label: 'CBC to Fairdee' },
  { id: 'cbc_insurer', label: 'CBC to Insurer' },
  { id: 'credit', label: 'Credit' },
  { id: 'credit_exceeded', label: 'Credit Exceeded' },
];

const paymentMethodOptions = [
  { id: 'all', label: 'All Payment Methods' },
  { id: 'bank', label: 'Bank Account' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'qr', label: 'QR' },
];

const carInspectionStatusOptions = [
  { id: 'all', label: 'All Statuses' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'not_confirmed', label: 'Not Yet Confirmed' },
];

const leadTypeOptions = [
  { id: 'all', label: 'All Lead Types' },
  { id: 'new_leads', label: 'New Leads' },
  { id: 'coa', label: 'COA' },
  { id: 'renewals', label: 'Renewals' },
];

const installmentOptions = [
  { value: 'all', label: 'All' },
  { value: 'installment', label: 'Installment' },
  { value: 'non_installment', label: 'Non-Installment' },
];

interface OtherStagesFilterPanelProps {
  filters: OtherStagesFilterState;
  onFiltersChange: (filters: OtherStagesFilterState) => void;
  onClear: () => void;
}

export function OtherStagesFilterPanel({ filters, onFiltersChange, onClear }: OtherStagesFilterPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<OtherStagesFilterState>(filters);

  const rfStaff = mockStaffMembers.filter(s => s.team === 'AST RF');
  const scStaff = mockStaffMembers.filter(s => s.team === 'AST SC');
  const deStaff = mockStaffMembers.filter(s => s.team === 'DE');

  const handleCheckboxChange = (
    field: keyof OtherStagesFilterState,
    id: string,
    checked: boolean
  ) => {
    const currentValues = localFilters[field] as string[];
    let newValues: string[];

    if (id === 'all') {
      newValues = checked ? ['all'] : [];
    } else {
      newValues = currentValues.filter(v => v !== 'all');
      if (checked) {
        newValues.push(id);
      } else {
        newValues = newValues.filter(v => v !== id);
      }
      if (newValues.length === 0) {
        newValues = ['all'];
      }
    }
    setLocalFilters({ ...localFilters, [field]: newValues });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(defaultOtherStagesFilterState);
  };

  const handleCancel = () => {
    setLocalFilters(filters);
    setOpen(false);
  };

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(defaultOtherStagesFilterState);

  const renderCheckboxGroup = (
    field: keyof OtherStagesFilterState,
    options: { id: string; label: string }[]
  ) => (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={`${field}-${option.id}`}
            checked={(localFilters[field] as string[]).includes(option.id)}
            onCheckedChange={(checked) => handleCheckboxChange(field, option.id, checked as boolean)}
            className="border-primary data-[state=checked]:bg-primary"
          />
          <Label htmlFor={`${field}-${option.id}`} className="text-sm font-normal cursor-pointer">
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          All Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">!</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[900px] p-6 bg-card z-50" align="start">
        <h3 className="text-lg font-semibold mb-4">Filter By</h3>
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            {/* RF */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">RF</Label>
              <Select value={localFilters.rfAssignee} onValueChange={(v) => setLocalFilters({ ...localFilters, rfAssignee: v })}>
                <SelectTrigger><SelectValue placeholder="Search RF" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">All RF</SelectItem>
                  {rfStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* SC */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">SC</Label>
              <Select value={localFilters.scAssignee} onValueChange={(v) => setLocalFilters({ ...localFilters, scAssignee: v })}>
                <SelectTrigger><SelectValue placeholder="Search SC" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">All SC</SelectItem>
                  {scStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* DE */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">DE</Label>
              <Select value={localFilters.deAssignee} onValueChange={(v) => setLocalFilters({ ...localFilters, deAssignee: v })}>
                <SelectTrigger><SelectValue placeholder="Search DE" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">All DE</SelectItem>
                  {deStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Agent */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agent</Label>
              <Select value={localFilters.agent} onValueChange={(v) => setLocalFilters({ ...localFilters, agent: v })}>
                <SelectTrigger><SelectValue placeholder="Search agents" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">All Agents</SelectItem>
                  {mockAgents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Insurer */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Insurer</Label>
              <Select value={localFilters.insurer} onValueChange={(v) => setLocalFilters({ ...localFilters, insurer: v })}>
                <SelectTrigger><SelectValue placeholder="Search insurers" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">All Insurers</SelectItem>
                  {mockInsurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {/* Policy Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Policy Status</Label>
              <Select value={localFilters.policyStatus} onValueChange={(v) => setLocalFilters({ ...localFilters, policyStatus: v })}>
                <SelectTrigger><SelectValue placeholder="Search policy status" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {policyStatusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Status</Label>
              <Select value={localFilters.paymentStatus} onValueChange={(v) => setLocalFilters({ ...localFilters, paymentStatus: v })}>
                <SelectTrigger><SelectValue placeholder="Search payment status" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {paymentStatusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Invoice Status</Label>
              {renderCheckboxGroup('invoiceStatuses', invoiceStatusOptions)}
            </div>

            {/* Insurance Class */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Insurance Class</Label>
              {renderCheckboxGroup('insuranceClasses', insuranceClassOptions)}
            </div>

            {/* Installment Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Installment Type</Label>
              <Select value={localFilters.installmentType} onValueChange={(v) => setLocalFilters({ ...localFilters, installmentType: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {installmentOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            {/* Sale Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sale Type</Label>
              {renderCheckboxGroup('saleTypes', saleTypeOptions)}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Method</Label>
              {renderCheckboxGroup('paymentMethods', paymentMethodOptions)}
            </div>

            {/* Car Inspection Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Car Inspection Status</Label>
              {renderCheckboxGroup('carInspectionStatuses', carInspectionStatusOptions)}
            </div>

            {/* Lead Types (Multi-select) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lead Type</Label>
              {renderCheckboxGroup('leadTypes', leadTypeOptions)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClear}>Clear</Button>
            <Button onClick={handleApply} className="bg-primary text-primary-foreground hover:bg-primary/90">Apply Filters</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
