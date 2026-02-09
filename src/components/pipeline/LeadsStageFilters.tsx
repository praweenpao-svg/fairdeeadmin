import * as React from 'react';
import { Check, ChevronDown, Filter, Search, X } from 'lucide-react';
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
  insurerStatuses: string[];
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
  insurerStatuses: ['all'],
  createdBy: ['all'],
  agent: 'all',
  rfAssignee: 'all',
  scAssignee: 'all',
  owner: 'all',
  leadsTypes: ['all'],
  agentTypes: ['all'],
  etaStatuses: ['all'],
};

// Lead status options matching the column statuses (sync with LeadsTable.tsx)
const leadStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'pending', en: 'Pending', th: 'รอดำเนินการ' },
  { id: 'docs_missing', en: 'Docs Missing', th: 'ขอเอกสารเพิ่มเติม' },
  { id: 'waiting_for_insurer', en: 'Waiting for Insurer', th: 'รอเบี้ยจากบริษัทประกัน' },
  { id: 'quotation_shared', en: 'Quotation Shared', th: 'ส่งเบี้ยให้ตัวแทนแล้ว' },
  { id: 'partially_added', en: 'Partially Added', th: 'มีเบี้ยบางส่วนแล้ว' },
  { id: 'completed', en: 'Completed', th: 'เสร็จแล้ว' },
  { id: 'invalid', en: 'Invalid', th: 'ปฎิเสธโดย Admin' },
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

const leadTypeOptions: { id: string; en: string; th: string }[] = [
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

const insurerStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'pending', en: 'Pending', th: 'รอดำเนินการ' },
  { id: 'request_sent', en: 'Request Sent To Insurer', th: 'ส่งคำขอไปยังบริษัทประกันแล้ว' },
  { id: 'price_added', en: 'Price List Added', th: 'เพิ่มราคาจากบริษัทประกันแล้ว' },
  { id: 'rejected', en: 'Rejected By Insurer', th: 'บริษัทประกันปฏิเสธ' },
  { id: 'followed_up', en: 'Already Followed Up', th: 'มีการติดตามแล้ว' },
  { id: 'expired', en: 'Price List Expired', th: 'ราคาหมดอายุแล้ว' },
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
  selectedValues = ['all'],
  onChange,
  maxVisibleItems = 2,
}: {
  options: { id: string; en: string; th: string }[];
  selectedValues: string[];
  onChange: (id: string, checked: boolean) => void;
  maxVisibleItems?: number;
}) {
  const { language } = useLanguageStore();
  // Defensive: ensure selectedValues is always an array
  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : ['all'];
  const isAllSelected = safeSelectedValues.includes('all');
  const nonAllOptions = options.filter(o => o.id !== 'all');
  const selectedNonAll = nonAllOptions.filter(o => safeSelectedValues.includes(o.id));
  
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
                safeSelectedValues.includes(option.id) && "bg-muted"
              )}
              onClick={() => onChange(option.id, !safeSelectedValues.includes(option.id))}
            >
              <Check className={cn("mr-2 h-4 w-4", safeSelectedValues.includes(option.id) ? "opacity-100" : "opacity-0")} />
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
    field: 'leadStatuses' | 'insurerStatuses' | 'createdBy' | 'leadsTypes' | 'agentTypes' | 'etaStatuses',
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

  // Calculate active filter chips with counts
  const getActiveFilterChips = () => {
    const chips: { key: string; label: string; count: number; onClear: () => void }[] = [];
    
    // Lead Status
    if (!filters.leadStatuses.includes('all') && filters.leadStatuses.length > 0) {
      chips.push({
        key: 'leadStatuses',
        label: language === 'th' ? 'สถานะงาน' : 'Lead Status',
        count: filters.leadStatuses.length,
        onClear: () => onFiltersChange({ ...filters, leadStatuses: ['all'] }),
      });
    }
    
    // Agent (single select)
    if (filters.agent !== 'all') {
      const agent = mockAgents.find(a => a.id === filters.agent);
      chips.push({
        key: 'agent',
        label: agent?.name || (language === 'th' ? 'ตัวแทน' : 'Agent'),
        count: 1,
        onClear: () => onFiltersChange({ ...filters, agent: 'all' }),
      });
    }
    
    // RF (single select)
    if (filters.rfAssignee !== 'all') {
      const rf = rfStaff.find(s => s.id === filters.rfAssignee);
      chips.push({
        key: 'rfAssignee',
        label: `RF: ${rf?.name || filters.rfAssignee}`,
        count: 1,
        onClear: () => onFiltersChange({ ...filters, rfAssignee: 'all' }),
      });
    }
    
    // SC (single select)
    if (filters.scAssignee !== 'all') {
      const sc = scStaff.find(s => s.id === filters.scAssignee);
      chips.push({
        key: 'scAssignee',
        label: `SC: ${sc?.name || filters.scAssignee}`,
        count: 1,
        onClear: () => onFiltersChange({ ...filters, scAssignee: 'all' }),
      });
    }
    
    // Owner (single select but not 'all')
    if (filters.owner !== 'all') {
      const ownerOption = ownerOptions.find(o => o.id === filters.owner);
      chips.push({
        key: 'owner',
        label: language === 'th' ? ownerOption?.th || '' : ownerOption?.en || '',
        count: 1,
        onClear: () => {
          onFiltersChange({ ...filters, owner: 'all' });
          onMyCasesChange(false);
          onMyTeamChange(false);
        },
      });
    }
    
    // Created By
    if (!filters.createdBy.includes('all') && filters.createdBy.length > 0) {
      chips.push({
        key: 'createdBy',
        label: language === 'th' ? 'สร้างโดย' : 'Created By',
        count: filters.createdBy.length,
        onClear: () => onFiltersChange({ ...filters, createdBy: ['all'] }),
      });
    }
    
    // Lead Type
    if (!filters.leadsTypes.includes('all') && filters.leadsTypes.length > 0) {
      chips.push({
        key: 'leadsTypes',
        label: language === 'th' ? 'ประเภทงาน' : 'Lead Type',
        count: filters.leadsTypes.length,
        onClear: () => onFiltersChange({ ...filters, leadsTypes: ['all'] }),
      });
    }
    
    // ETA Status
    if (!filters.etaStatuses.includes('all') && filters.etaStatuses.length > 0) {
      chips.push({
        key: 'etaStatuses',
        label: language === 'th' ? 'สถานะ ETA' : 'ETA Status',
        count: filters.etaStatuses.length,
        onClear: () => onFiltersChange({ ...filters, etaStatuses: ['all'] }),
      });
    }
    
    return chips;
  };

  const activeChips = getActiveFilterChips();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            {language === 'th' ? 'ตัวกรองทั้งหมด' : 'All Filters'}
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
          {/* Insurer Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'th' ? 'สถานะเบี้ยประกัน' : 'Insurer Status'}</Label>
            <MultiSelectDropdown
              options={insurerStatusOptions}
              selectedValues={localFilters.insurerStatuses}
              onChange={(id, checked) => handleMultiSelectChange('insurerStatuses', id, checked)}
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

          {/* Lead Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทงาน' : 'Lead Type'}</Label>
            <MultiSelectDropdown
              options={leadTypeOptions}
              selectedValues={localFilters.leadsTypes}
              onChange={(id, checked) => handleMultiSelectChange('leadsTypes', id, checked)}
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
    
    {/* Active filter chips */}
    {activeChips.map((chip) => (
      <div
        key={chip.key}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 text-primary rounded-md text-sm"
      >
        <span>{chip.label}</span>
        {chip.count > 1 && (
          <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-xs font-medium">
            {chip.count}
          </span>
        )}
        <button
          onClick={chip.onClear}
          className="ml-0.5 hover:bg-primary/20 rounded p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    ))}
    
    {/* Clear all button when filters active */}
    {hasActiveFilters && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground"
      >
        {language === 'th' ? 'ล้างทั้งหมด' : 'Clear All'}
      </Button>
    )}
  </div>
  );
}
