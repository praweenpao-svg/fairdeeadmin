import * as React from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
};

// Lead status options for COA system manual style
const leadStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Status', th: 'สถานะทั้งหมด' },
  { id: 'pending', en: 'Pending', th: 'รอดำเนินการ' },
  { id: 'docs_missing', en: 'Docs Missing', th: 'เอกสารไม่ครบ' },
  { id: 'waiting_for_insurer', en: 'Waiting for Insurer', th: 'รอบริษัทประกัน' },
  { id: 'quotation_shared', en: 'Quotation Shared', th: 'ส่งใบเสนอราคาแล้ว' },
  { id: 'partially_added', en: 'Partially Added', th: 'เพิ่มบางส่วน' },
  { id: 'completed', en: 'Completed', th: 'เสร็จสิ้น' },
  { id: 'invalid', en: 'Invalid', th: 'ไม่ถูกต้อง' },
];

const createdByOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Creator', th: 'ผู้สร้างทั้งหมด' },
  { id: 'agent', en: 'Agent', th: 'ตัวแทน' },
  { id: 'admin', en: 'Admin', th: 'แอดมิน' },
];

const ownerOptions: { id: 'all' | 'my_team' | 'my_cases'; en: string; th: string }[] = [
  { id: 'all', en: 'All Owners', th: 'ผู้รับผิดชอบทั้งหมด' },
  { id: 'my_team', en: 'My Team', th: 'ทีมของฉัน' },
  { id: 'my_cases', en: 'My Cases', th: 'เคสของฉัน' },
];

const leadsTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Lead Types', th: 'ประเภท Lead ทั้งหมด' },
  { id: 'system', en: 'System', th: 'ระบบ' },
  { id: 'manual', en: 'Manual', th: 'เพิ่มเอง' },
  { id: 'coa', en: 'COA', th: 'COA' },
];

const agentTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Agent Types', th: 'ประเภทตัวแทนทั้งหมด' },
  { id: 'direct', en: 'Direct Agent', th: 'ตัวแทนตรง' },
  { id: 'mlm', en: 'MLM Agent', th: 'ตัวแทน MLM' },
  { id: 'inspection', en: 'Inspection Garage', th: 'อู่ตรวจสภาพ' },
  { id: 'office', en: 'Agent Office', th: 'สำนักงานตัวแทน' },
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
  myCasesOnly: boolean;
  myTeamOnly: boolean;
  onMyCasesChange: (value: boolean) => void;
  onMyTeamChange: (value: boolean) => void;
}

// Multi-select dropdown component
function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  allLabel,
}: {
  label: string;
  options: { id: string; en: string; th: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  allLabel: { en: string; th: string };
}) {
  const { language } = useLanguageStore();
  const [open, setOpen] = React.useState(false);

  const handleToggle = (id: string) => {
    let newValues: string[];
    if (id === 'all') {
      newValues = ['all'];
    } else {
      // Remove 'all' if present, toggle the id
      newValues = selectedValues.filter(v => v !== 'all');
      if (newValues.includes(id)) {
        newValues = newValues.filter(v => v !== id);
      } else {
        newValues.push(id);
      }
      // If nothing selected, default to all
      if (newValues.length === 0) {
        newValues = ['all'];
      }
    }
    onChange(newValues);
  };

  const isAllSelected = selectedValues.includes('all') || selectedValues.length === 0;
  const displayText = isAllSelected
    ? (language === 'th' ? allLabel.th : allLabel.en)
    : options
        .filter(o => o.id !== 'all' && selectedValues.includes(o.id))
        .map(o => (language === 'th' ? o.th : o.en))
        .join(', ');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between gap-2 min-w-[140px] max-w-[200px] h-9 text-sm"
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2 bg-card z-50" align="start">
        <div className="space-y-1">
          {options.map((option) => (
            <div
              key={option.id}
              className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
              onClick={() => handleToggle(option.id)}
            >
              <Checkbox
                checked={option.id === 'all' ? isAllSelected : selectedValues.includes(option.id)}
                className="border-primary data-[state=checked]:bg-primary"
              />
              <span className="text-sm">
                {language === 'th' ? option.th : option.en}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Searchable single-select dropdown
function SearchableSelectDropdown({
  label,
  options,
  selectedValue,
  onChange,
  allLabel,
  placeholder,
}: {
  label: string;
  options: { id: string; name: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
  allLabel: { en: string; th: string };
  placeholder: { en: string; th: string };
}) {
  const { language } = useLanguageStore();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter(
      o => o.id.toLowerCase().includes(lowerSearch) || o.name.toLowerCase().includes(lowerSearch)
    );
  }, [options, search]);

  const displayText =
    selectedValue === 'all'
      ? (language === 'th' ? allLabel.th : allLabel.en)
      : options.find(o => o.id === selectedValue)?.name || (language === 'th' ? allLabel.th : allLabel.en);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between gap-2 min-w-[140px] max-w-[180px] h-9 text-sm"
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 bg-card z-50" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'th' ? placeholder.th : placeholder.en}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-[200px] overflow-auto p-1">
          <div
            className={cn(
              "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-muted",
              selectedValue === 'all' && "bg-muted"
            )}
            onClick={() => {
              onChange('all');
              setOpen(false);
              setSearch('');
            }}
          >
            <Check className={cn("mr-2 h-4 w-4", selectedValue === 'all' ? "opacity-100" : "opacity-0")} />
            <span className="text-sm">{language === 'th' ? allLabel.th : allLabel.en}</span>
          </div>
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className={cn(
                "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-muted",
                selectedValue === option.id && "bg-muted"
              )}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
                setSearch('');
              }}
            >
              <Check className={cn("mr-2 h-4 w-4", selectedValue === option.id ? "opacity-100" : "opacity-0")} />
              <span className="text-sm">{option.id} - {option.name}</span>
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

// Single-select dropdown (simple)
function SingleSelectDropdown({
  options,
  selectedValue,
  onChange,
}: {
  options: { id: string; en: string; th: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}) {
  const { language } = useLanguageStore();
  const [open, setOpen] = React.useState(false);

  const displayText = options.find(o => o.id === selectedValue)?.[language === 'th' ? 'th' : 'en'] || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between gap-2 min-w-[120px] max-w-[160px] h-9 text-sm"
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-1 bg-card z-50" align="start">
        {options.map((option) => (
          <div
            key={option.id}
            className={cn(
              "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-muted",
              selectedValue === option.id && "bg-muted"
            )}
            onClick={() => {
              onChange(option.id);
              setOpen(false);
            }}
          >
            <Check className={cn("mr-2 h-4 w-4", selectedValue === option.id ? "opacity-100" : "opacity-0")} />
            <span className="text-sm">{language === 'th' ? option.th : option.en}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function LeadsStageFilters({
  filters,
  onFiltersChange,
  myCasesOnly,
  myTeamOnly,
  onMyCasesChange,
  onMyTeamChange,
}: LeadsStageFiltersProps) {
  const { language } = useLanguageStore();

  const rfStaff = mockStaffMembers.filter(s => s.team === 'AST RF').map(s => ({ id: s.id, name: s.name }));
  const scStaff = mockStaffMembers.filter(s => s.team === 'AST SC').map(s => ({ id: s.id, name: s.name }));

  // Sync owner filter with myCasesOnly and myTeamOnly props
  React.useEffect(() => {
    if (myCasesOnly && !myTeamOnly) {
      if (filters.owner !== 'my_cases') {
        onFiltersChange({ ...filters, owner: 'my_cases' });
      }
    } else if (myTeamOnly && !myCasesOnly) {
      if (filters.owner !== 'my_team') {
        onFiltersChange({ ...filters, owner: 'my_team' });
      }
    } else if (!myCasesOnly && !myTeamOnly) {
      if (filters.owner !== 'all') {
        onFiltersChange({ ...filters, owner: 'all' });
      }
    }
  }, [myCasesOnly, myTeamOnly]);

  const handleOwnerChange = (value: string) => {
    const ownerValue = value as 'all' | 'my_team' | 'my_cases';
    onFiltersChange({ ...filters, owner: ownerValue });
    
    // Sync with parent state
    if (ownerValue === 'my_cases') {
      onMyCasesChange(true);
      onMyTeamChange(false);
    } else if (ownerValue === 'my_team') {
      onMyCasesChange(false);
      onMyTeamChange(true);
    } else {
      onMyCasesChange(false);
      onMyTeamChange(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Lead Status - Multi-select */}
      <MultiSelectDropdown
        label={language === 'th' ? 'สถานะ Lead' : 'Lead Status'}
        options={leadStatusOptions}
        selectedValues={filters.leadStatuses}
        onChange={(values) => onFiltersChange({ ...filters, leadStatuses: values })}
        allLabel={{ en: 'All Status', th: 'สถานะทั้งหมด' }}
      />

      {/* Created By - Multi-select */}
      <MultiSelectDropdown
        label={language === 'th' ? 'สร้างโดย' : 'Created By'}
        options={createdByOptions}
        selectedValues={filters.createdBy}
        onChange={(values) => onFiltersChange({ ...filters, createdBy: values })}
        allLabel={{ en: 'All Creator', th: 'ผู้สร้างทั้งหมด' }}
      />

      {/* Agent - Searchable single-select */}
      <SearchableSelectDropdown
        label={language === 'th' ? 'ตัวแทน' : 'Agent'}
        options={mockAgents}
        selectedValue={filters.agent}
        onChange={(value) => onFiltersChange({ ...filters, agent: value })}
        allLabel={{ en: 'All Agents', th: 'ตัวแทนทั้งหมด' }}
        placeholder={{ en: 'Search agent...', th: 'ค้นหาตัวแทน...' }}
      />

      {/* RF - Searchable single-select */}
      <SearchableSelectDropdown
        label="RF"
        options={rfStaff}
        selectedValue={filters.rfAssignee}
        onChange={(value) => onFiltersChange({ ...filters, rfAssignee: value })}
        allLabel={{ en: 'All RF', th: 'RF ทั้งหมด' }}
        placeholder={{ en: 'Search RF...', th: 'ค้นหา RF...' }}
      />

      {/* SC - Searchable single-select */}
      <SearchableSelectDropdown
        label="SC"
        options={scStaff}
        selectedValue={filters.scAssignee}
        onChange={(value) => onFiltersChange({ ...filters, scAssignee: value })}
        allLabel={{ en: 'All SC', th: 'SC ทั้งหมด' }}
        placeholder={{ en: 'Search SC...', th: 'ค้นหา SC...' }}
      />

      {/* Owner - Single-select */}
      <SingleSelectDropdown
        options={ownerOptions}
        selectedValue={filters.owner}
        onChange={handleOwnerChange}
      />

      {/* Leads Type - Multi-select */}
      <MultiSelectDropdown
        label={language === 'th' ? 'ประเภท Lead' : 'Leads Type'}
        options={leadsTypeOptions}
        selectedValues={filters.leadsTypes}
        onChange={(values) => onFiltersChange({ ...filters, leadsTypes: values })}
        allLabel={{ en: 'All Lead Types', th: 'ประเภท Lead ทั้งหมด' }}
      />

      {/* Agent Type - Multi-select */}
      <MultiSelectDropdown
        label={language === 'th' ? 'ประเภทตัวแทน' : 'Agent Type'}
        options={agentTypeOptions}
        selectedValues={filters.agentTypes}
        onChange={(values) => onFiltersChange({ ...filters, agentTypes: values })}
        allLabel={{ en: 'All Agent Types', th: 'ประเภทตัวแทนทั้งหมด' }}
      />
    </div>
  );
}
