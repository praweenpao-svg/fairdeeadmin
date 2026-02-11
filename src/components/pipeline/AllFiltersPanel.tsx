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
import { useLanguageStore } from '@/stores/languageStore';

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
  // For All: new_leads/coa/renewals (unconverted) + sales (converted). For To Pay: only lead types.
  leadType: 'all' | 'new_leads' | 'coa' | 'renewals' | 'sales';
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
  leadType: 'all',
  installmentType: 'all',
};

// Post-lead status options (for All and To Pay stages)
const postLeadStatusOptions: { value: string; en: string; th: string }[] = [
  { value: 'all', en: 'All Status', th: 'สถานะทั้งหมด' },
  { value: 'pending_payment', en: 'Pending', th: 'รอดำเนินการ' },
  { value: 'pending_review', en: 'Pending Review', th: 'รอตรวจเอกสาร' },
  { value: 'pending_issuance', en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  { value: 'policy_issued', en: 'Policy Uploaded', th: 'กรมธรรม์ออกแล้ว' },
  { value: 'policy_shipped', en: 'Policy Shipped', th: 'กรมธรรม์ถูกจัดส่ง' },
  { value: 'policy_delivered', en: 'Policy Delivered', th: 'กรมธรรม์จัดส่งสำเร็จ' },
  { value: 'policy_cancelled', en: 'Policy Cancelled', th: 'กรมธรรม์ยกเลิก' },
  { value: 'rework_required', en: 'Rework Required', th: 'งานติดปัญหา' },
];

const agentTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Agent Types', th: 'ประเภทตัวแทนทั้งหมด' },
  { id: 'direct', en: 'Direct Agent', th: 'ตัวแทน FD' },
  { id: 'mlm', en: 'MLM Agent', th: 'ตัวแทน FM' },
  { id: 'inspection', en: 'Inspection Garage', th: 'ตัวแทน IG' },
  { id: 'office', en: 'Agent Office', th: 'ตัวแทน AO' },
];

const leadsTypeOptions: { value: string; en: string; th: string }[] = [
  { value: 'all', en: 'All Leads Type', th: 'ประเภท Leads ทั้งหมด' },
  { value: 'system', en: 'System', th: 'เบี้ยบนระบบ' },
  { value: 'custom', en: 'Custom', th: 'เบี้ยนอกระบบ' },
  { value: 'brochure', en: 'Brochure', th: 'โบรชัวร์' },
];

const createdByOptions: { value: string; en: string; th: string }[] = [
  { value: 'all', en: 'All', th: 'ทั้งหมด' },
  { value: 'agent', en: 'Self-Serve', th: 'Self-Serve' },
  { value: 'admin', en: 'Non Self-Serve', th: 'Non Self-Serve' },
];

const leadTypeOptionsByStage = {
  to_pay: [
    { value: 'new_leads', en: 'New Leads', th: 'งานใหม่' },
    { value: 'coa', en: 'COA', th: 'COA' },
    { value: 'renewals', en: 'Renewals', th: 'งานต่ออายุ' },
  ],
  all: [
    { value: 'new_leads', en: 'New Leads', th: 'งานใหม่' },
    { value: 'coa', en: 'COA', th: 'COA' },
    { value: 'renewals', en: 'Renewals', th: 'งานต่ออายุ' },
    { value: 'sales', en: 'Sales', th: 'งานขาย' },
  ],
} as const;

const installmentOptions: { value: string; en: string; th: string }[] = [
  { value: 'all', en: 'All', th: 'ทั้งหมด' },
  { value: 'installment', en: 'Installment', th: 'ผ่อนชำระ' },
  { value: 'non_installment', en: 'Non-Installment', th: 'ชำระเต็มจำนวน' },
];

// Mock agents from leads data
const mockAgents = [
  { id: 'FD-3460', name: 'Akshay Bazad' },
  { id: 'FM-5368', name: 'James Santes' },
  { id: 'FM-5369', name: 'Harriett Joyce' },
  { id: 'FM-5370', name: 'Jennifer Haines' },
  { id: 'FM-5371', name: 'Michael Chen' },
  { id: 'FM-5372', name: 'Sarah Wilson' },
];

interface AllFiltersPanelProps {
  stage: 'all' | 'to_convert' | 'to_pay';
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClear: () => void;
}

export function AllFiltersPanel({ stage, filters, onFiltersChange, onClear }: AllFiltersPanelProps) {
  const { language } = useLanguageStore();
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

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
    filters.deAssignee !== 'all' ||
    filters.agent !== 'all' ||
    filters.agentTypes.length > 0 ||
    filters.leadsType !== 'all' ||
    filters.createdBy !== 'all' ||
    filters.leadType !== 'all' ||
    filters.installmentType !== 'all';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {language === 'th' ? 'ตัวกรองทั้งหมด' : 'All Filters'}
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              !
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[900px] p-6 bg-card z-50" align="start">
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            {/* RF */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">RF</Label>
              <Select
                value={localFilters.rfAssignee}
                onValueChange={(value) => setLocalFilters({ ...localFilters, rfAssignee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'th' ? 'ค้นหา RF' : 'Search RF'} />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">{language === 'th' ? 'RF ทั้งหมด' : 'All RF'}</SelectItem>
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
                  <SelectValue placeholder={language === 'th' ? 'ค้นหา SC' : 'Search SC'} />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">{language === 'th' ? 'SC ทั้งหมด' : 'All SC'}</SelectItem>
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
                  <SelectValue placeholder={language === 'th' ? 'ค้นหา DE' : 'Search DE'} />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">{language === 'th' ? 'DE ทั้งหมด' : 'All DE'}</SelectItem>
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
              <Label className="text-sm font-medium">{language === 'th' ? 'ตัวแทน' : 'Agent'}</Label>
              <Select
                value={localFilters.agent}
                onValueChange={(value) => setLocalFilters({ ...localFilters, agent: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'th' ? 'เลือกตัวแทน' : 'Select Agent'} />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">{language === 'th' ? 'ตัวแทนทั้งหมด' : 'All Agents'}</SelectItem>
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
            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'สถานะ' : 'Status'}</Label>
              <Select
                value={localFilters.status}
                onValueChange={(value) => setLocalFilters({ ...localFilters, status: value as SaleStatus | 'all' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'th' ? 'ค้นหาสถานะ' : 'Search status'} />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {postLeadStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {language === 'th' ? option.th : option.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Installment Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทการผ่อน' : 'Installment Type'}</Label>
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
                      {language === 'th' ? option.th : option.en}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Agent Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทตัวแทน' : 'Agent Type'}</Label>
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
                      {language === 'th' ? type.th : type.en}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Type (stage-aware) */}
            {stage !== 'to_convert' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'ประเภท Lead' : 'Lead Type'}</Label>
                <RadioGroup
                  value={localFilters.leadType}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, leadType: value as FilterState['leadType'] })}
                  className="flex flex-wrap gap-4"
                >
                  {(stage === 'all' ? leadTypeOptionsByStage.all : leadTypeOptionsByStage.to_pay).map((option) => (
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
                        {language === 'th' ? option.th : option.en}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            {/* Leads Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'ประเภท Leads' : 'Leads Type'}</Label>
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
                      {language === 'th' ? option.th : option.en}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Created By */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'สร้างโดย' : 'Created By'}</Label>
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
                      {language === 'th' ? option.th : option.en}
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
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClear}>
              {language === 'th' ? 'ล้าง' : 'Clear'}
            </Button>
            <Button onClick={handleApply} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {language === 'th' ? 'ใช้ตัวกรอง' : 'Apply Filters'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
