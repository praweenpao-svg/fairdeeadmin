import * as React from 'react';
import { Check, ChevronDown, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { useLanguageStore } from '@/stores/languageStore';
import { cn } from '@/lib/utils';

export interface LeadsFilterState {
  leadStatuses: string[];
  createdBy: string[];
  agent: string;
  rfAssignee: string;
  scAssignee: string;
  owner: 'all' | 'my_team' | 'my_cases';
  leadsTypes: string[];
  agentTypes: string[];
  etaStatuses: string[];
}

export const defaultLeadsFilterState: LeadsFilterState = {
  leadStatuses: ['all'],
  createdBy: ['all'],
  agent: 'all',
  rfAssignee: 'all',
  scAssignee: 'all',
  owner: 'all',
  leadsTypes: ['all'],
  agentTypes: ['all'],
  etaStatuses: ['all'],
};

// Lead status options matching the column statuses
const leadStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'pending', en: 'Pending', th: 'รอดำเนินการ' },
  { id: 'docs_missing', en: 'Docs Missing', th: 'เอกสารไม่ครบ' },
  { id: 'waiting_for_insurer', en: 'Waiting for Insurer', th: 'รอบริษัทประกัน' },
  { id: 'quotation_shared', en: 'Quotation Shared', th: 'ส่งใบเสนอราคาแล้ว' },
  { id: 'partially_added', en: 'Partially Added', th: 'เพิ่มบางส่วน' },
  { id: 'completed', en: 'Completed', th: 'เสร็จสิ้น' },
  { id: 'invalid', en: 'Invalid', th: 'ไม่ถูกต้อง' },
];

const createdByOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'agent', en: 'Agent', th: 'ตัวแทน' },
  { id: 'admin', en: 'Admin', th: 'แอดมิน' },
];

const ownerOptions: { id: 'all' | 'my_team' | 'my_cases'; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'my_team', en: 'My Team', th: 'ทีมของฉัน' },
  { id: 'my_cases', en: 'My Cases', th: 'เคสของฉัน' },
];

const leadsTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'system', en: 'System', th: 'เบี้ยบนระบบ' },
  { id: 'custom', en: 'Custom', th: 'เบี้ยนอกระบบ' },
  { id: 'coa', en: 'COA', th: 'เบี้ยโอนโค้ด' },
];

const agentTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'direct', en: 'Direct Agent', th: 'ตัวแทน FD' },
  { id: 'mlm', en: 'MLM Agent', th: 'ตัวแทน FM' },
  { id: 'inspection', en: 'Inspection Garage', th: 'ตัวแทน IG' },
  { id: 'office', en: 'Agent Office', th: 'ตัวแทน AO' },
];

const etaStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'on_time', en: 'On Time', th: 'ตามกำหนด' },
  { id: 'breached', en: 'Breached', th: 'เกินกำหนด' },
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

interface LeadsStageFiltersProps {
  filters: LeadsFilterState;
  onFiltersChange: (filters: LeadsFilterState) => void;
  onClear: () => void;
  myCasesOnly: boolean;
  myTeamOnly: boolean;
  onMyCasesChange: (value: boolean) => void;
  onMyTeamChange: (value: boolean) => void;
}

// Searchable select component for agents and staff
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const { language } = useLanguageStore();
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter(
      o => o.id.toLowerCase().includes(lowerSearch) || o.name.toLowerCase().includes(lowerSearch)
    );
  }, [options, search]);

  const displayValue = value === 'all' 
    ? (language === 'th' ? 'ทั้งหมด' : 'All')
    : options.find(o => o.id === value)?.name || (language === 'th' ? 'ทั้งหมด' : 'All');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 bg-card z-50" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-[200px] overflow-auto p-1">
          <div
            className={cn(
              "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-muted text-sm",
              value === 'all' && "bg-muted"
            )}
            onClick={() => {
              onChange('all');
              setOpen(false);
              setSearch('');
            }}
          >
            <Check className={cn("mr-2 h-4 w-4", value === 'all' ? "opacity-100" : "opacity-0")} />
            {language === 'th' ? 'ทั้งหมด' : 'All'}
          </div>
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className={cn(
                "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-muted text-sm",
                value === option.id && "bg-muted"
              )}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
                setSearch('');
              }}
            >
              <Check className={cn("mr-2 h-4 w-4", value === option.id ? "opacity-100" : "opacity-0")} />
              {option.name}
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              {language === 'th' ? 'ไม่พบผลลัพธ์' : 'No results found'}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Multi-select dropdown component
function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  maxVisibleItems = 2,
}: {
  options: { id: string; en: string; th: string }[];
  selectedValues: string[];
  onChange: (id: string, checked: boolean) => void;
  maxVisibleItems?: number;
}) {
  const { language } = useLanguageStore();
  const isAllSelected = selectedValues.includes('all');
  const nonAllOptions = options.filter(o => o.id !== 'all');
  const selectedNonAll = nonAllOptions.filter(o => selectedValues.includes(o.id));
  
  let displayText: React.ReactNode;
  if (isAllSelected || selectedNonAll.length === 0) {
    displayText = language === 'th' ? 'ทั้งหมด' : 'All';
  } else {
    const visibleItems = selectedNonAll.slice(0, maxVisibleItems);
    const remainingCount = selectedNonAll.length - maxVisibleItems;
    const visibleText = visibleItems.map(o => language === 'th' ? o.th : o.en).join(', ');
    
    if (remainingCount > 0) {
      displayText = (
        <span className="flex items-center gap-1">
          <span className="truncate">{visibleText}</span>
          <span className="shrink-0 text-muted-foreground">+{remainingCount}</span>
        </span>
      );
    } else {
      displayText = visibleText;
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate text-left flex-1">{displayText}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2 bg-card z-50" align="start">
        <div className="space-y-1 max-h-[250px] overflow-auto">
          {options.map((option) => (
            <div
              key={option.id}
              className={cn(
                "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-muted text-sm",
                selectedValues.includes(option.id) && "bg-muted"
              )}
              onClick={() => onChange(option.id, !selectedValues.includes(option.id))}
            >
              <Check className={cn("mr-2 h-4 w-4", selectedValues.includes(option.id) ? "opacity-100" : "opacity-0")} />
              {language === 'th' ? option.th : option.en}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function LeadsStageFilters({
  filters,
  onFiltersChange,
  onClear,
  myCasesOnly,
  myTeamOnly,
  onMyCasesChange,
  onMyTeamChange,
}: LeadsStageFiltersProps) {
  const { language } = useLanguageStore();
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<LeadsFilterState>(filters);

  const rfStaff = mockStaffMembers.filter(s => s.team === 'AST RF').map(s => ({ id: s.id, name: s.name }));
  const scStaff = mockStaffMembers.filter(s => s.team === 'AST SC').map(s => ({ id: s.id, name: s.name }));

  // Sync owner filter with myCasesOnly and myTeamOnly props
  React.useEffect(() => {
    if (myCasesOnly && !myTeamOnly) {
      setLocalFilters(prev => ({ ...prev, owner: 'my_cases' }));
    } else if (myTeamOnly && !myCasesOnly) {
      setLocalFilters(prev => ({ ...prev, owner: 'my_team' }));
    } else if (!myCasesOnly && !myTeamOnly) {
      setLocalFilters(prev => ({ ...prev, owner: 'all' }));
    }
  }, [myCasesOnly, myTeamOnly]);

  // Sync local filters when props change
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleMultiSelectChange = (
    field: 'leadStatuses' | 'createdBy' | 'leadsTypes' | 'agentTypes' | 'etaStatuses',
    id: string,
    checked: boolean
  ) => {
    const currentValues = localFilters[field];
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
    
    // Sync owner state with parent
    if (localFilters.owner === 'my_cases') {
      onMyCasesChange(true);
      onMyTeamChange(false);
    } else if (localFilters.owner === 'my_team') {
      onMyCasesChange(false);
      onMyTeamChange(true);
    } else {
      onMyCasesChange(false);
      onMyTeamChange(false);
    }
    
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(defaultLeadsFilterState);
  };

  const handleCancel = () => {
    setLocalFilters(filters);
    setOpen(false);
  };

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(defaultLeadsFilterState);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {language === 'th' ? 'ตัวกรองทั้งหมด' : 'All Filters'}
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">!</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[700px] p-6 bg-card z-50" align="start">
        <h3 className="text-lg font-semibold mb-4">{language === 'th' ? 'กรองตาม' : 'Filter By'}</h3>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {/* Column 1 */}
          {/* Lead Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'th' ? 'สถานะงาน' : 'Lead Status'}</Label>
            <MultiSelectDropdown
              options={leadStatusOptions}
              selectedValues={localFilters.leadStatuses}
              onChange={(id, checked) => handleMultiSelectChange('leadStatuses', id, checked)}
              maxVisibleItems={2}
            />
          </div>

          {/* Column 2 */}
          {/* Created By */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'th' ? 'สร้างโดย' : 'Created By'}</Label>
            <MultiSelectDropdown
              options={createdByOptions}
              selectedValues={localFilters.createdBy}
              onChange={(id, checked) => handleMultiSelectChange('createdBy', id, checked)}
              maxVisibleItems={2}
            />
          </div>

          {/* Agent */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'th' ? 'ตัวแทน' : 'Agent'}</Label>
            <SearchableSelect
              options={mockAgents}
              value={localFilters.agent}
              onChange={(value) => setLocalFilters({ ...localFilters, agent: value })}
              placeholder={language === 'th' ? 'ค้นหาตัวแทน...' : 'Search agent...'}
            />
          </div>

          {/* Leads Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'th' ? 'ประเภท Lead' : 'Leads Type'}</Label>
            <MultiSelectDropdown
              options={leadsTypeOptions}
              selectedValues={localFilters.leadsTypes}
              onChange={(id, checked) => handleMultiSelectChange('leadsTypes', id, checked)}
              maxVisibleItems={2}
            />
          </div>

          {/* RF */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">RF</Label>
            <SearchableSelect
              options={rfStaff}
              value={localFilters.rfAssignee}
              onChange={(value) => setLocalFilters({ ...localFilters, rfAssignee: value })}
              placeholder={language === 'th' ? 'ค้นหา RF...' : 'Search RF...'}
            />
          </div>

          {/* Agent Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทตัวแทน' : 'Agent Type'}</Label>
            <MultiSelectDropdown
              options={agentTypeOptions}
              selectedValues={localFilters.agentTypes}
              onChange={(id, checked) => handleMultiSelectChange('agentTypes', id, checked)}
              maxVisibleItems={2}
            />
          </div>

          {/* SC */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">SC</Label>
            <SearchableSelect
              options={scStaff}
              value={localFilters.scAssignee}
              onChange={(value) => setLocalFilters({ ...localFilters, scAssignee: value })}
              placeholder={language === 'th' ? 'ค้นหา SC...' : 'Search SC...'}
            />
          </div>

          {/* ETA Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'th' ? 'สถานะ ETA' : 'ETA Status'}</Label>
            <MultiSelectDropdown
              options={etaStatusOptions}
              selectedValues={localFilters.etaStatuses}
              onChange={(id, checked) => handleMultiSelectChange('etaStatuses', id, checked)}
              maxVisibleItems={2}
            />
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}</Label>
            <Select
              value={localFilters.owner}
              onValueChange={(value) => setLocalFilters({ ...localFilters, owner: value as LeadsFilterState['owner'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                {ownerOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {language === 'th' ? option.th : option.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Empty cell for balance */}
          <div />
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
