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
import { mockStaffMembers } from '@/data/mockStaff';
import { useLanguageStore } from '@/stores/languageStore';
import { cn } from '@/lib/utils';

export interface OtherStagesFilterState {
  rfAssignee: string;
  scAssignee: string;
  deAssignee: string;
  agent: string;
  insurers: string[];
  policyStatuses: string[];
  paymentStatus: string;
  invoiceStatuses: string[];
  insuranceClasses: string[];
  saleTypes: string[];
  carInspectionStatuses: string[];
  leadTypes: string[];
  installmentType: string;
  etaStatus: string;
  owner: string;
  createdBy: string[];
  endorsementTypes: string[];
  endorsementStatuses: string[];
  saleIdStatus: string; // 'all' | 'with' | 'without'
}

export const defaultOtherStagesFilterState: OtherStagesFilterState = {
  rfAssignee: 'all',
  scAssignee: 'all',
  deAssignee: 'all',
  agent: 'all',
  insurers: ['all'],
  policyStatuses: ['all'],
  paymentStatus: 'all',
  invoiceStatuses: ['all'],
  insuranceClasses: ['all'],
  saleTypes: ['all'],
  carInspectionStatuses: ['all'],
  leadTypes: ['all'],
  installmentType: 'all',
  etaStatus: 'all',
  owner: 'all',
  createdBy: ['all'],
  endorsementTypes: ['all'],
  endorsementStatuses: ['all'],
  saleIdStatus: 'all',
};

const mockAgents = [
  { id: 'FD-3460', name: 'Akshay Bazad' },
  { id: 'FM-5368', name: 'James Santes' },
  { id: 'FM-5369', name: 'Harriett Joyce' },
  { id: 'FM-5370', name: 'Jennifer Haines' },
  { id: 'FM-5371', name: 'Michael Chen' },
  { id: 'FM-5372', name: 'Sarah Wilson' },
];

const insurerOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'viriyah', en: 'Viriyah Insurance', th: 'วิริยะประกันภัย' },
  { id: 'bangkok', en: 'Bangkok Insurance', th: 'กรุงเทพประกันภัย' },
  { id: 'dhipaya', en: 'Dhipaya Insurance', th: 'ทิพยประกันภัย' },
  { id: 'muangthai', en: 'Muang Thai Insurance', th: 'เมืองไทยประกันภัย' },
  { id: 'sinmunkong', en: 'Sin Munkong Insurance', th: 'สินมั่นคงประกันภัย' },
  { id: 'lmg', en: 'LMG Insurance', th: 'แอลเอ็มจีประกันภัย' },
  { id: 'aia', en: 'AIA Thailand', th: 'เอไอเอ ประเทศไทย' },
  { id: 'thailife', en: 'Thai Life Insurance', th: 'ไทยประกันชีวิต' },
  { id: 'allianz', en: 'Allianz Ayudhya', th: 'อลิอันซ์ อยุธยา' },
  { id: 'krungthai_axa', en: 'Krungthai-AXA Life', th: 'กรุงไทย-แอกซ่า ประกันชีวิต' },
  { id: 'thanachart', en: 'Thanachart Insurance', th: 'ธนชาตประกันภัย' },
  { id: 'deves', en: 'Deves Insurance', th: 'เทเวศประกันภัย' },
  { id: 'msig', en: 'MSIG Insurance', th: 'เอ็ม เอส ไอ จี ประกันภัย' },
  { id: 'navakij', en: 'Navakij Insurance', th: 'นวกิจประกันภัย' },
  { id: 'thaisri', en: 'Thaisri Insurance', th: 'ไทยศรีประกันภัย' },
  { id: 'chubb', en: 'Chubb Samaggi Insurance', th: 'ชับบ์สามัคคีประกันภัย' },
  { id: 'falcon', en: 'Falcon Insurance', th: 'ฟอลคอนประกันภัย' },
  { id: 'aioi', en: 'Aioi Bangkok Insurance', th: 'ไอโออิ กรุงเทพ ประกันภัย' },
  
  { id: 'asset', en: 'Asset Insurance', th: 'สินทรัพย์ประกันภัย' },
  { id: 'thaipaiboon', en: 'Thai Paiboon Insurance', th: 'ไทยไพบูลย์ประกันภัย' },
  { id: 'unionprospers', en: 'The Union Prospers Insurance', th: 'สหมงคลประกันภัย' },
  { id: 'ergo', en: 'ERGO Insurance', th: 'เออร์โกประกันภัย' },
  { id: 'indara', en: 'Indara Insurance', th: 'อินทรประกันภัย' },
  { id: 'icare', en: 'ICARE Insurance', th: 'ไอแคร์ ประกันภัย' },
];

const policyStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'pending_payment', en: 'Pending', th: 'รอดำเนินการ' },
  { id: 'pending_review', en: 'Pending Review', th: 'รอตรวจเอกสาร' },
  { id: 'pending_issuance', en: 'Pending Issuance', th: 'รอออกกรมธรรม์' },
  { id: 'policy_issued', en: 'Policy Uploaded', th: 'กรมธรรม์ออกแล้ว' },
  { id: 'policy_shipped', en: 'Policy Shipped', th: 'กรมธรรม์ถูกจัดส่ง' },
  { id: 'policy_delivered', en: 'Policy Delivered', th: 'กรมธรรม์จัดส่งสำเร็จ' },
  { id: 'policy_cancelled', en: 'Policy Cancelled', th: 'กรมธรรม์ยกเลิก' },
  { id: 'rework_required', en: 'Rework Required', th: 'งานติดปัญหา' },
];

const paymentStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'payment_verified', en: 'Payment Verified', th: 'ยืนยันการชำระเงินแล้ว' },
  { id: 'insurer_notified', en: 'Insurer Notified', th: 'แจ้งบริษัทประกันแล้ว' },
  { id: 'credit_approved', en: 'Credit Approved', th: 'อนุมัติเครดิตแล้ว' },
];

const invoiceStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'unpaid', en: 'Unpaid', th: 'ยังไม่ชำระ' },
  { id: 'underpaid', en: 'Underpaid', th: 'ชำระไม่ครบ' },
  { id: 'overpaid', en: 'Overpaid', th: 'ชำระเกิน' },
  { id: 'fully_paid', en: 'Fully Paid', th: 'ชำระครบแล้ว' },
];

const insuranceClassOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: '1', en: '1', th: '1' },
  { id: '2', en: '2', th: '2' },
  { id: '3', en: '3', th: '3' },
  { id: '2+', en: '2+', th: '2+' },
  { id: '3+', en: '3+', th: '3+' },
];

const saleTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'cbc_fairdee', en: 'CBC to Fairdee', th: 'จ่ายเข้าแฟร์ดี' },
  { id: 'cbc_insurer', en: 'CBC to Insurer', th: 'จ่ายเข้าบ.ประกัน' },
  { id: 'credit', en: 'Credit', th: 'เครดิต' },
];

const etaStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'on_time', en: 'On Time', th: 'ตามกำหนด' },
  { id: 'breached', en: 'Breached', th: 'เกินกำหนด' },
];

const saleIdStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'with', en: 'Sale ID Created', th: 'มี Sale ID' },
  { id: 'without', en: 'No Sale ID', th: 'ยังไม่มี Sale ID' },
];

const carInspectionStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'confirmed', en: 'Confirmed', th: 'ยืนยันแล้ว' },
  { id: 'not_confirmed', en: 'Not Yet Confirmed', th: 'ยังไม่ยืนยัน' },
];

const leadTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'system', en: 'System', th: 'งานใหม่ (System)' },
  { id: 'custom', en: 'Custom', th: 'งานใหม่ (Custom)' },
  { id: 'coa', en: 'COA', th: 'งานโอนโค้ด (COA)' },
  { id: 'renewal', en: 'Renewal', th: 'งานต่ออายุ (Renewal)' },
];

const endorsementTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'policy_endorsement', en: 'Policy Endorsement', th: 'สลักหลังกรมธรรม์' },
  { id: 'policy_cancellation', en: 'Policy Cancellation', th: 'ยกเลิกกรมธรรม์' },
];

const endorsementStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'request_created', en: 'Request Created', th: 'สร้างคำขอแล้ว' },
  { id: 'request_submitted', en: 'Request Submitted', th: 'ส่งคำขอแล้ว' },
  { id: 'request_approved', en: 'Request Approved', th: 'อนุมัติคำขอแล้ว' },
  { id: 'pending_on_ops', en: 'Pending on Ops', th: 'รอดำเนินการ Ops' },
  { id: 'pending_finance', en: 'Pending Finance', th: 'รอการเงิน' },
  { id: 'invalid', en: 'Invalid', th: 'ไม่ถูกต้อง' },
];

const installmentOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'full', en: 'Full Payment', th: 'งานเงินสด' },
  { id: 'installment', en: 'Installment', th: 'งานเงินผ่อน' },
];

const ownerPresetOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'my_team', en: 'My Team', th: 'ทีมของฉัน' },
  { id: 'my_cases', en: 'My Cases', th: 'เคสของฉัน' },
];

const createdByOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'agent', en: 'Self-Serve', th: 'Self-Serve' },
  { id: 'admin', en: 'Non Self-Serve', th: 'Non Self-Serve' },
];

// Searchable select component
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
        <Button variant="outline" role="combobox" className="w-full justify-between">
          <span className="truncate">{displayValue}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 bg-card z-50" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8" />
          </div>
        </div>
        <div className="max-h-[200px] overflow-auto p-1">
          <div
            className={cn("flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm", value === 'all' && "bg-primary/10")}
            onClick={() => { onChange('all'); setOpen(false); setSearch(''); }}
          >
            <Check className={cn("mr-2 h-4 w-4", value === 'all' ? "opacity-100" : "opacity-0")} />
            {language === 'th' ? 'ทั้งหมด' : 'All'}
          </div>
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className={cn("flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm", value === option.id && "bg-primary/10")}
              onClick={() => { onChange(option.id); setOpen(false); setSearch(''); }}
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

// Owner searchable select with preset options (All/My Team/My Cases) + all staff names
function OwnerSearchableSelect({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (value: string) => void;
  language: string;
}) {
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const allStaff = mockStaffMembers.map(s => ({ id: s.name, name: s.name }));

  const filteredStaff = React.useMemo(() => {
    if (!search) return allStaff;
    const lowerSearch = search.toLowerCase();
    return allStaff.filter(s => s.name.toLowerCase().includes(lowerSearch));
  }, [search, allStaff]);

  const presetMatch = ownerPresetOptions.find(o => o.id === value);
  const displayValue = presetMatch
    ? (language === 'th' ? presetMatch.th : presetMatch.en)
    : value || (language === 'th' ? 'ทั้งหมด' : 'All');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          <span className="truncate">{displayValue}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-card z-50" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'th' ? 'ค้นหาผู้รับผิดชอบ...' : 'Search owner...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-[250px] overflow-auto p-1">
          {!search && ownerPresetOptions.map((option) => (
            <div
              key={option.id}
              className={cn(
                "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm",
                value === option.id && "bg-primary/10"
              )}
              onClick={() => { onChange(option.id); setOpen(false); setSearch(''); }}
            >
              <Check className={cn("mr-2 h-4 w-4", value === option.id ? "opacity-100" : "opacity-0")} />
              {language === 'th' ? option.th : option.en}
            </div>
          ))}
          {!search && <div className="border-t my-1" />}
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className={cn(
                "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm",
                value === staff.id && "bg-primary/10"
              )}
              onClick={() => { onChange(staff.id); setOpen(false); setSearch(''); }}
            >
              <Check className={cn("mr-2 h-4 w-4", value === staff.id ? "opacity-100" : "opacity-0")} />
              {staff.name}
            </div>
          ))}
          {filteredStaff.length === 0 && search && (
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
                "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm",
                safeSelectedValues.includes(option.id) && "bg-primary/10"
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

interface OtherStagesFilterPanelProps {
  filters: OtherStagesFilterState;
  onFiltersChange: (filters: OtherStagesFilterState) => void;
  onClear: () => void;
  activeStage?: string;
  myCasesOnly: boolean;
  myTeamOnly: boolean;
  onMyCasesChange: (value: boolean) => void;
  onMyTeamChange: (value: boolean) => void;
}

export function OtherStagesFilterPanel({
  filters,
  onFiltersChange,
  onClear,
  activeStage,
  myCasesOnly,
  myTeamOnly,
  onMyCasesChange,
  onMyTeamChange,
}: OtherStagesFilterPanelProps) {
  const { language } = useLanguageStore();
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<OtherStagesFilterState>({
    ...defaultOtherStagesFilterState,
    ...filters,
    insurers: Array.isArray(filters.insurers) ? filters.insurers : defaultOtherStagesFilterState.insurers,
    policyStatuses: Array.isArray(filters.policyStatuses) ? filters.policyStatuses : defaultOtherStagesFilterState.policyStatuses,
  });

  const rfStaff = mockStaffMembers.filter(s => s.team === 'AST RF').map(s => ({ id: s.id, name: s.name }));
  const scStaff = mockStaffMembers.filter(s => s.team === 'AST SC').map(s => ({ id: s.id, name: s.name }));
  const deStaff = mockStaffMembers.filter(s => s.team === 'DE').map(s => ({ id: s.id, name: s.name }));

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

  React.useEffect(() => {
    setLocalFilters({
      ...defaultOtherStagesFilterState,
      ...filters,
      insurers: Array.isArray(filters.insurers) ? filters.insurers : defaultOtherStagesFilterState.insurers,
      policyStatuses: Array.isArray(filters.policyStatuses) ? filters.policyStatuses : defaultOtherStagesFilterState.policyStatuses,
    });
  }, [filters]);

  const handleMultiSelectChange = (
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
    setLocalFilters(defaultOtherStagesFilterState);
  };

  const handleCancel = () => {
    setLocalFilters({
      ...defaultOtherStagesFilterState,
      ...filters,
      insurers: Array.isArray(filters.insurers) ? filters.insurers : defaultOtherStagesFilterState.insurers,
      policyStatuses: Array.isArray(filters.policyStatuses) ? filters.policyStatuses : defaultOtherStagesFilterState.policyStatuses,
    });
    setOpen(false);
  };

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(defaultOtherStagesFilterState);

  // Helper to format multi-select values for chips
  const formatMultiSelectValues = (
    selectedIds: string[],
    options: { id: string; en: string; th: string }[],
    maxVisible: number = 2
  ): string => {
    const selectedOptions = options.filter(o => o.id !== 'all' && selectedIds.includes(o.id));
    if (selectedOptions.length === 0) return language === 'th' ? 'ทั้งหมด' : 'All';
    const visibleItems = selectedOptions.slice(0, maxVisible);
    const remainingCount = selectedOptions.length - maxVisible;
    const visibleText = visibleItems.map(o => language === 'th' ? o.th : o.en).join(', ');
    if (remainingCount > 0) return `${visibleText} +${remainingCount}`;
    return visibleText;
  };

  // Calculate active filter chips
  const getActiveFilterChips = () => {
    const chips: { key: string; label: string; values: string; onClear: () => void }[] = [];

    if (filters.rfAssignee !== 'all') {
      const rf = rfStaff.find(s => s.id === filters.rfAssignee);
      chips.push({ key: 'rf', label: 'RF', values: rf?.name || filters.rfAssignee, onClear: () => onFiltersChange({ ...filters, rfAssignee: 'all' }) });
    }
    if (filters.scAssignee !== 'all') {
      const sc = scStaff.find(s => s.id === filters.scAssignee);
      chips.push({ key: 'sc', label: 'SC', values: sc?.name || filters.scAssignee, onClear: () => onFiltersChange({ ...filters, scAssignee: 'all' }) });
    }
    if (filters.deAssignee !== 'all') {
      const de = deStaff.find(s => s.id === filters.deAssignee);
      chips.push({ key: 'de', label: 'DE', values: de?.name || filters.deAssignee, onClear: () => onFiltersChange({ ...filters, deAssignee: 'all' }) });
    }
    if (filters.agent !== 'all') {
      const agent = mockAgents.find(a => a.id === filters.agent);
      chips.push({ key: 'agent', label: language === 'th' ? 'ตัวแทน' : 'Agent', values: agent?.name || filters.agent, onClear: () => onFiltersChange({ ...filters, agent: 'all' }) });
    }
    if (!filters.insurers.includes('all') && filters.insurers.length > 0) {
      chips.push({ key: 'insurers', label: language === 'th' ? 'บริษัทประกัน' : 'Insurer', values: formatMultiSelectValues(filters.insurers, insurerOptions), onClear: () => onFiltersChange({ ...filters, insurers: ['all'] }) });
    }
    if (activeStage === 'all' && !filters.policyStatuses.includes('all') && filters.policyStatuses.length > 0) {
      chips.push({ key: 'policyStatuses', label: language === 'th' ? 'สถานะกรมธรรม์' : 'Policy Status', values: formatMultiSelectValues(filters.policyStatuses, policyStatusOptions), onClear: () => onFiltersChange({ ...filters, policyStatuses: ['all'] }) });
    }
    if (filters.paymentStatus !== 'all') {
      const ps = paymentStatusOptions.find(o => o.id === filters.paymentStatus);
      chips.push({ key: 'paymentStatus', label: language === 'th' ? 'สถานะการชำระเงิน' : 'Payment Status', values: ps ? (language === 'th' ? ps.th : ps.en) : filters.paymentStatus, onClear: () => onFiltersChange({ ...filters, paymentStatus: 'all' }) });
    }
    if (!filters.invoiceStatuses.includes('all') && filters.invoiceStatuses.length > 0) {
      chips.push({ key: 'invoiceStatuses', label: language === 'th' ? 'ใบแจ้งหนี้' : 'Invoice', values: formatMultiSelectValues(filters.invoiceStatuses, invoiceStatusOptions), onClear: () => onFiltersChange({ ...filters, invoiceStatuses: ['all'] }) });
    }
    if (!filters.insuranceClasses.includes('all') && filters.insuranceClasses.length > 0) {
      chips.push({ key: 'insuranceClasses', label: language === 'th' ? 'ชั้นประกัน' : 'Class', values: formatMultiSelectValues(filters.insuranceClasses, insuranceClassOptions), onClear: () => onFiltersChange({ ...filters, insuranceClasses: ['all'] }) });
    }
    if (!filters.saleTypes.includes('all') && filters.saleTypes.length > 0) {
      chips.push({ key: 'saleTypes', label: language === 'th' ? 'ประเภทการจ่าย' : 'Payment Method', values: formatMultiSelectValues(filters.saleTypes, saleTypeOptions), onClear: () => onFiltersChange({ ...filters, saleTypes: ['all'] }) });
    }
    if (!filters.carInspectionStatuses.includes('all') && filters.carInspectionStatuses.length > 0) {
      chips.push({ key: 'carInspection', label: language === 'th' ? 'ตรวจสภาพ' : 'Inspection', values: formatMultiSelectValues(filters.carInspectionStatuses, carInspectionStatusOptions), onClear: () => onFiltersChange({ ...filters, carInspectionStatuses: ['all'] }) });
    }
    if (!filters.leadTypes.includes('all') && filters.leadTypes.length > 0) {
      chips.push({ key: 'leadTypes', label: language === 'th' ? 'ประเภทงาน' : 'Lead Type', values: formatMultiSelectValues(filters.leadTypes, leadTypeOptions), onClear: () => onFiltersChange({ ...filters, leadTypes: ['all'] }) });
    }
    if (filters.installmentType !== 'all') {
      const inst = installmentOptions.find(o => o.id === filters.installmentType);
      chips.push({ key: 'installmentType', label: language === 'th' ? 'ประเภทการชำระเงิน' : 'Payment Type', values: inst ? (language === 'th' ? inst.th : inst.en) : filters.installmentType, onClear: () => onFiltersChange({ ...filters, installmentType: 'all' }) });
    }
    if (filters.etaStatus !== 'all') {
      const eta = etaStatusOptions.find(o => o.id === filters.etaStatus);
      chips.push({ key: 'etaStatus', label: language === 'th' ? 'สถานะ ETA' : 'ETA Status', values: eta ? (language === 'th' ? eta.th : eta.en) : filters.etaStatus, onClear: () => onFiltersChange({ ...filters, etaStatus: 'all' }) });
    }
    if (filters.saleIdStatus !== 'all') {
      const sid = saleIdStatusOptions.find(o => o.id === filters.saleIdStatus);
      chips.push({ key: 'saleIdStatus', label: language === 'th' ? 'Sale ID' : 'Sale ID', values: sid ? (language === 'th' ? sid.th : sid.en) : filters.saleIdStatus, onClear: () => onFiltersChange({ ...filters, saleIdStatus: 'all' }) });
    }
    if (filters.owner !== 'all') {
      const presetOpt = ownerPresetOptions.find(o => o.id === filters.owner);
      const staffMember = mockStaffMembers.find(s => s.name === filters.owner);
      const displayValue = presetOpt
        ? (language === 'th' ? presetOpt.th : presetOpt.en)
        : staffMember?.name || filters.owner;
      chips.push({
        key: 'owner',
        label: language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner',
        values: displayValue,
        onClear: () => {
          onFiltersChange({ ...filters, owner: 'all' });
          onMyCasesChange(false);
          onMyTeamChange(false);
        },
      });
    }
    if (!filters.createdBy.includes('all') && filters.createdBy.length > 0) {
      chips.push({ key: 'createdBy', label: language === 'th' ? 'สร้างโดย' : 'Created By', values: formatMultiSelectValues(filters.createdBy, createdByOptions), onClear: () => onFiltersChange({ ...filters, createdBy: ['all'] }) });
    }
    if (!(filters.endorsementTypes ?? ['all']).includes('all') && (filters.endorsementTypes ?? []).length > 0) {
      chips.push({ key: 'endorsementTypes', label: language === 'th' ? 'ประเภทสลักหลัง' : 'Endorsement Type', values: formatMultiSelectValues(filters.endorsementTypes!, endorsementTypeOptions), onClear: () => onFiltersChange({ ...filters, endorsementTypes: ['all'] }) });
    }
    if (!(filters.endorsementStatuses ?? ['all']).includes('all') && (filters.endorsementStatuses ?? []).length > 0) {
      chips.push({ key: 'endorsementStatuses', label: language === 'th' ? 'สถานะสลักหลัง' : 'Endorsement Status', values: formatMultiSelectValues(filters.endorsementStatuses!, endorsementStatusOptions), onClear: () => onFiltersChange({ ...filters, endorsementStatuses: ['all'] }) });
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
        <PopoverContent className="w-[960px] p-6 bg-card z-50" align="start">
          <h3 className="text-lg font-semibold mb-4">{language === 'th' ? 'กรองตาม' : 'Filter By'}</h3>

          {/* Full-width Policy Status for All tab */}
          {activeStage === 'all' && (
            <div className="space-y-2 mb-4">
              <Label className="text-sm font-medium">{language === 'th' ? 'สถานะกรมธรรม์' : 'Policy Status'}</Label>
              <MultiSelectDropdown
                options={policyStatusOptions}
                selectedValues={localFilters.policyStatuses}
                onChange={(id, checked) => handleMultiSelectChange('policyStatuses', id, checked)}
                maxVisibleItems={4}
              />
            </div>
          )}

          <div className="flex gap-8">
            {/* ===== Column 1: Agent, RF, SC, DE, Created By ===== */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'ตัวแทน' : 'Agent'}</Label>
                <SearchableSelect
                  options={mockAgents}
                  value={localFilters.agent}
                  onChange={(v) => setLocalFilters({ ...localFilters, agent: v })}
                  placeholder={language === 'th' ? 'ค้นหาตัวแทน...' : 'Search agent...'}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">RF</Label>
                <SearchableSelect
                  options={rfStaff}
                  value={localFilters.rfAssignee}
                  onChange={(v) => setLocalFilters({ ...localFilters, rfAssignee: v })}
                  placeholder={language === 'th' ? 'ค้นหา RF...' : 'Search RF...'}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">SC</Label>
                <SearchableSelect
                  options={scStaff}
                  value={localFilters.scAssignee}
                  onChange={(v) => setLocalFilters({ ...localFilters, scAssignee: v })}
                  placeholder={language === 'th' ? 'ค้นหา SC...' : 'Search SC...'}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">DE</Label>
                <SearchableSelect
                  options={deStaff}
                  value={localFilters.deAssignee}
                  onChange={(v) => setLocalFilters({ ...localFilters, deAssignee: v })}
                  placeholder={language === 'th' ? 'ค้นหา DE...' : 'Search DE...'}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'สร้างโดย' : 'Created By'}</Label>
                <MultiSelectDropdown
                  options={createdByOptions}
                  selectedValues={localFilters.createdBy}
                  onChange={(id, checked) => handleMultiSelectChange('createdBy', id, checked)}
                  maxVisibleItems={2}
                />
              </div>
            </div>

            {/* ===== Column 2: Owner, Insurer, Insurance Class, Lead Type, Sale Type ===== */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'ผู้รับผิดชอบ' : 'Owner'}</Label>
                <OwnerSearchableSelect
                  value={localFilters.owner}
                  onChange={(v) => setLocalFilters({ ...localFilters, owner: v })}
                  language={language}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'บริษัทประกัน' : 'Insurer'}</Label>
                <MultiSelectDropdown
                  options={insurerOptions}
                  selectedValues={localFilters.insurers}
                  onChange={(id, checked) => handleMultiSelectChange('insurers', id, checked)}
                  maxVisibleItems={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'ชั้นประกัน' : 'Insurance Class'}</Label>
                <MultiSelectDropdown
                  options={insuranceClassOptions}
                  selectedValues={localFilters.insuranceClasses}
                  onChange={(id, checked) => handleMultiSelectChange('insuranceClasses', id, checked)}
                  maxVisibleItems={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทงาน' : 'Lead Type'}</Label>
                <MultiSelectDropdown
                  options={leadTypeOptions}
                  selectedValues={localFilters.leadTypes}
                  onChange={(id, checked) => handleMultiSelectChange('leadTypes', id, checked)}
                  maxVisibleItems={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทการจ่าย' : 'Payment Method'}</Label>
                <MultiSelectDropdown
                  options={saleTypeOptions}
                  selectedValues={localFilters.saleTypes}
                  onChange={(id, checked) => handleMultiSelectChange('saleTypes', id, checked)}
                  maxVisibleItems={2}
                />
              </div>
            </div>

            {/* ===== Column 3: Invoice Status, Payment Type, Payment Status, Car Inspection, ETA Status ===== */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'สถานะใบแจ้งหนี้' : 'Invoice Status'}</Label>
                <MultiSelectDropdown
                  options={invoiceStatusOptions}
                  selectedValues={localFilters.invoiceStatuses}
                  onChange={(id, checked) => handleMultiSelectChange('invoiceStatuses', id, checked)}
                  maxVisibleItems={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทการชำระเงิน' : 'Payment Type'}</Label>
                <MultiSelectDropdown
                  options={installmentOptions}
                  selectedValues={[localFilters.installmentType]}
                  onChange={(id, checked) => {
                    if (checked) {
                      setLocalFilters({ ...localFilters, installmentType: id });
                    }
                  }}
                  maxVisibleItems={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'สถานะการชำระเงิน' : 'Payment Status'}</Label>
                <MultiSelectDropdown
                  options={paymentStatusOptions}
                  selectedValues={[localFilters.paymentStatus]}
                  onChange={(id, checked) => {
                    if (checked) {
                      setLocalFilters({ ...localFilters, paymentStatus: id });
                    }
                  }}
                  maxVisibleItems={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'สถานะตรวจสภาพรถ' : 'Car Inspection'}</Label>
                <MultiSelectDropdown
                  options={carInspectionStatusOptions}
                  selectedValues={localFilters.carInspectionStatuses}
                  onChange={(id, checked) => handleMultiSelectChange('carInspectionStatuses', id, checked)}
                  maxVisibleItems={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{language === 'th' ? 'สถานะ ETA' : 'ETA Status'}</Label>
                <MultiSelectDropdown
                  options={etaStatusOptions}
                  selectedValues={[localFilters.etaStatus]}
                  onChange={(id, checked) => {
                    if (checked) {
                      setLocalFilters({ ...localFilters, etaStatus: id });
                    }
                  }}
                  maxVisibleItems={1}
                />
              </div>
            </div>
          </div>

          {/* Endorsement filters - centered row spanning 2/3 width */}
          <div className="flex justify-start gap-8 mt-4">
            <div className="flex-1 max-w-[calc((100%-4rem)/3)] space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทสลักหลัง' : 'Endorsement Type'}</Label>
              <MultiSelectDropdown
                options={endorsementTypeOptions}
                selectedValues={localFilters.endorsementTypes}
                onChange={(id, checked) => handleMultiSelectChange('endorsementTypes', id, checked)}
                maxVisibleItems={2}
              />
            </div>
            <div className="flex-1 max-w-[calc((100%-4rem)/3)] space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'สถานะสลักหลัง' : 'Endorsement Status'}</Label>
              <MultiSelectDropdown
                options={endorsementStatusOptions}
                selectedValues={localFilters.endorsementStatuses}
                onChange={(id, checked) => handleMultiSelectChange('endorsementStatuses', id, checked)}
                maxVisibleItems={2}
              />
            </div>
            <div className="flex-1 max-w-[calc((100%-4rem)/3)] space-y-2">
              <Label className="text-sm font-medium">Sale ID</Label>
              <MultiSelectDropdown
                options={saleIdStatusOptions}
                selectedValues={[localFilters.saleIdStatus]}
                onChange={(id, checked) => {
                  if (checked) {
                    setLocalFilters({ ...localFilters, saleIdStatus: id });
                  }
                }}
                maxVisibleItems={1}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>{language === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClear}>{language === 'th' ? 'ล้าง' : 'Clear'}</Button>
              <Button onClick={handleApply} className="bg-primary text-primary-foreground hover:bg-primary/90">{language === 'th' ? 'ใช้ตัวกรอง' : 'Apply Filters'}</Button>
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
          <span className="font-medium">{chip.label}:</span>
          <span className="text-primary/80">{chip.values}</span>
          <button onClick={chip.onClear} className="ml-0.5 hover:bg-primary/20 rounded p-0.5">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Clear all */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground hover:text-foreground">
          {language === 'th' ? 'ล้างทั้งหมด' : 'Clear All'}
        </Button>
      )}
    </div>
  );
}
