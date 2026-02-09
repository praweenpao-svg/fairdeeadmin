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
import { useLanguageStore } from '@/stores/languageStore';

export interface OtherStagesFilterState {
  rfAssignee: string;
  scAssignee: string;
  deAssignee: string;
  agent: string;
  insurers: string[];
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
  insurers: ['all'],
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

const insurerOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'viriyah', en: 'Viriyah Insurance', th: 'วิริยะประกันภัย' },
  { id: 'bangkok', en: 'Bangkok Insurance', th: 'กรุงเทพประกันภัย' },
  { id: 'dhipaya', en: 'Dhipaya Insurance', th: 'ทิพยประกันภัย' },
  { id: 'muangthai', en: 'Muang Thai Insurance', th: 'เมืองไทยประกันภัย' },
  { id: 'sinmunkong', en: 'Sin Munkong Insurance', th: 'สินมั่นคงประกันภัย' },
  { id: 'tsk', en: 'Thai Setakij Insurance (TSK)', th: 'ไทยเศรษฐกิจประกันภัย' },
  { id: 'aia', en: 'AIA Thailand', th: 'เอไอเอ ประเทศไทย' },
  { id: 'thailife', en: 'Thai Life Insurance', th: 'ไทยประกันชีวิต' },
  { id: 'allianz', en: 'Allianz Ayudhya', th: 'อลิอันซ์ อยุธยา' },
  { id: 'krungthai_axa', en: 'Krungthai-AXA Life', th: 'กรุงไทย-แอกซ่า ประกันชีวิต' },
  { id: 'thanachart', en: 'Thanachart Insurance', th: 'ธนชาตประกันภัย' },
  { id: 'tokiomarine', en: 'Tokio Marine Safety Insurance', th: 'คุ้มภัยโตเกียวมารีนประกันภัย' },
  { id: 'msig', en: 'MSIG Insurance', th: 'เอ็ม เอส ไอ จี ประกันภัย' },
  { id: 'deves', en: 'Deves Insurance', th: 'เทเวศประกันภัย' },
  { id: 'navakij', en: 'Navakij Insurance', th: 'นวกิจประกันภัย' },
  { id: 'thaisri', en: 'Thaisri Insurance', th: 'ไทยศรีประกันภัย' },
  { id: 'chubb', en: 'Chubb Samaggi Insurance', th: 'ชับบ์สามัคคีประกันภัย' },
  { id: 'falcon', en: 'Falcon Insurance', th: 'ฟอลคอนประกันภัย' },
  { id: 'aioi', en: 'Aioi Bangkok Insurance', th: 'ไอโออิ กรุงเทพ ประกันภัย' },
  { id: 'bui', en: 'Bangkok Union Insurance (BUI)', th: 'บางกอกสหประกันภัย' },
  { id: 'asset', en: 'Asset Insurance', th: 'สินทรัพย์ประกันภัย' },
  { id: 'thaipaiboon', en: 'Thai Paiboon Insurance', th: 'ไทยไพบูลย์ประกันภัย' },
  { id: 'unionprospers', en: 'The Union Prospers Insurance', th: 'สหมงคลประกันภัย' },
  { id: 'ergo', en: 'ERGO Insurance', th: 'เออร์โกประกันภัย' },
  { id: 'indara', en: 'Indara Insurance', th: 'อินทรประกันภัย' },
  { id: 'icare', en: 'ICARE Insurance', th: 'ไอแคร์ ประกันภัย' },
];

const policyStatusOptions: { value: string; en: string; th: string }[] = [
  { value: 'all', en: 'All Policy Status', th: 'สถานะกรมธรรม์ทั้งหมด' },
  { value: 'pending', en: 'Pending', th: 'รอดำเนินการ' },
  { value: 'issued', en: 'Issued', th: 'ออกแล้ว' },
  { value: 'cancelled', en: 'Cancelled', th: 'ยกเลิก' },
];

const paymentStatusOptions: { value: string; en: string; th: string }[] = [
  { value: 'all', en: 'All Payment Status', th: 'สถานะการชำระทั้งหมด' },
  { value: 'unpaid', en: 'Unpaid', th: 'ยังไม่ชำระ' },
  { value: 'paid', en: 'Paid', th: 'ชำระแล้ว' },
  { value: 'partial', en: 'Partial', th: 'ชำระบางส่วน' },
];

const invoiceStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Statuses', th: 'สถานะทั้งหมด' },
  { id: 'unpaid', en: 'Unpaid', th: 'ยังไม่ชำระ' },
  { id: 'underpaid', en: 'Underpaid', th: 'ชำระไม่ครบ' },
  { id: 'overpaid', en: 'Overpaid', th: 'ชำระเกิน' },
  { id: 'fully_paid', en: 'Fully Paid', th: 'ชำระครบแล้ว' },
];

const insuranceClassOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Classes', th: 'ชั้นทั้งหมด' },
  { id: '1', en: '1', th: '1' },
  { id: '2+', en: '2+', th: '2+' },
  { id: '2', en: '2', th: '2' },
  { id: '3+', en: '3+', th: '3+' },
  { id: '3', en: '3', th: '3' },
];

const saleTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Sale Types', th: 'ประเภทการขายทั้งหมด' },
  { id: 'cbc_fairdee', en: 'CBC to Fairdee', th: 'จ่ายเข้าแฟร์ดี' },
  { id: 'cbc_insurer', en: 'CBC to Insurer', th: 'จ่ายเข้าบ.ประกัน' },
  { id: 'credit', en: 'Credit', th: 'เครดิต' },
  { id: 'credit_exceeded', en: 'Credit Exceeded', th: 'เครดิตเกิน' },
];

const paymentMethodOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Payment Methods', th: 'วิธีชำระทั้งหมด' },
  { id: 'bank', en: 'Bank Account', th: 'บัญชีธนาคาร' },
  { id: 'credit_card', en: 'Credit Card', th: 'บัตรเครดิต' },
  { id: 'qr', en: 'QR', th: 'QR' },
];

const carInspectionStatusOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Statuses', th: 'สถานะทั้งหมด' },
  { id: 'confirmed', en: 'Confirmed', th: 'ยืนยันแล้ว' },
  { id: 'not_confirmed', en: 'Not Yet Confirmed', th: 'ยังไม่ยืนยัน' },
];

const leadTypeOptions: { id: string; en: string; th: string }[] = [
  { id: 'all', en: 'All Lead Types', th: 'ประเภท Lead ทั้งหมด' },
  { id: 'new_leads', en: 'New Leads', th: 'งานใหม่' },
  { id: 'coa', en: 'COA', th: 'COA' },
  { id: 'renewals', en: 'Renewals', th: 'งานต่ออายุ' },
];

const installmentOptions: { value: string; en: string; th: string }[] = [
  { value: 'all', en: 'All', th: 'ทั้งหมด' },
  { value: 'installment', en: 'Installment', th: 'ผ่อนชำระ' },
  { value: 'non_installment', en: 'Non-Installment', th: 'ชำระเต็มจำนวน' },
];

interface OtherStagesFilterPanelProps {
  filters: OtherStagesFilterState;
  onFiltersChange: (filters: OtherStagesFilterState) => void;
  onClear: () => void;
}

export function OtherStagesFilterPanel({ filters, onFiltersChange, onClear }: OtherStagesFilterPanelProps) {
  const { language } = useLanguageStore();
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
    options: { id: string; en: string; th: string }[]
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
            {language === 'th' ? option.th : option.en}
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
          {language === 'th' ? 'ตัวกรองทั้งหมด' : 'All Filters'}
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">!</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[900px] p-6 bg-card z-50" align="start">
        <h3 className="text-lg font-semibold mb-4">{language === 'th' ? 'กรองตาม' : 'Filter By'}</h3>
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            {/* RF */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">RF</Label>
              <Select value={localFilters.rfAssignee} onValueChange={(v) => setLocalFilters({ ...localFilters, rfAssignee: v })}>
                <SelectTrigger><SelectValue placeholder={language === 'th' ? 'ค้นหา RF' : 'Search RF'} /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">{language === 'th' ? 'RF ทั้งหมด' : 'All RF'}</SelectItem>
                  {rfStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* SC */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">SC</Label>
              <Select value={localFilters.scAssignee} onValueChange={(v) => setLocalFilters({ ...localFilters, scAssignee: v })}>
                <SelectTrigger><SelectValue placeholder={language === 'th' ? 'ค้นหา SC' : 'Search SC'} /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">{language === 'th' ? 'SC ทั้งหมด' : 'All SC'}</SelectItem>
                  {scStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* DE */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">DE</Label>
              <Select value={localFilters.deAssignee} onValueChange={(v) => setLocalFilters({ ...localFilters, deAssignee: v })}>
                <SelectTrigger><SelectValue placeholder={language === 'th' ? 'ค้นหา DE' : 'Search DE'} /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">{language === 'th' ? 'DE ทั้งหมด' : 'All DE'}</SelectItem>
                  {deStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Agent */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'ตัวแทน' : 'Agent'}</Label>
              <Select value={localFilters.agent} onValueChange={(v) => setLocalFilters({ ...localFilters, agent: v })}>
                <SelectTrigger><SelectValue placeholder={language === 'th' ? 'ค้นหาตัวแทน' : 'Search agents'} /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="all">{language === 'th' ? 'ตัวแทนทั้งหมด' : 'All Agents'}</SelectItem>
                  {mockAgents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Insurer */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'บริษัทประกัน' : 'Insurer'}</Label>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
                {insurerOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`insurers-${option.id}`}
                      checked={localFilters.insurers.includes(option.id)}
                      onCheckedChange={(checked) => handleCheckboxChange('insurers', option.id, checked as boolean)}
                      className="border-primary data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor={`insurers-${option.id}`} className="text-xs font-normal cursor-pointer">
                      {language === 'th' ? option.th : option.en}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {/* Policy Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'สถานะกรมธรรม์' : 'Policy Status'}</Label>
              <Select value={localFilters.policyStatus} onValueChange={(v) => setLocalFilters({ ...localFilters, policyStatus: v })}>
                <SelectTrigger><SelectValue placeholder={language === 'th' ? 'ค้นหาสถานะ' : 'Search policy status'} /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {policyStatusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{language === 'th' ? o.th : o.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'สถานะการชำระ' : 'Payment Status'}</Label>
              <Select value={localFilters.paymentStatus} onValueChange={(v) => setLocalFilters({ ...localFilters, paymentStatus: v })}>
                <SelectTrigger><SelectValue placeholder={language === 'th' ? 'ค้นหาสถานะ' : 'Search payment status'} /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {paymentStatusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{language === 'th' ? o.th : o.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'สถานะใบแจ้งหนี้' : 'Invoice Status'}</Label>
              {renderCheckboxGroup('invoiceStatuses', invoiceStatusOptions)}
            </div>

            {/* Insurance Class */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'ชั้นประกัน' : 'Insurance Class'}</Label>
              {renderCheckboxGroup('insuranceClasses', insuranceClassOptions)}
            </div>

            {/* Installment Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทการผ่อน' : 'Installment Type'}</Label>
              <Select value={localFilters.installmentType} onValueChange={(v) => setLocalFilters({ ...localFilters, installmentType: v })}>
                <SelectTrigger><SelectValue placeholder={language === 'th' ? 'เลือกประเภท' : 'Select type'} /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {installmentOptions.map((o) => <SelectItem key={o.value} value={o.value}>{language === 'th' ? o.th : o.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            {/* Sale Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'ประเภทการขาย' : 'Sale Type'}</Label>
              {renderCheckboxGroup('saleTypes', saleTypeOptions)}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'วิธีชำระเงิน' : 'Payment Method'}</Label>
              {renderCheckboxGroup('paymentMethods', paymentMethodOptions)}
            </div>

            {/* Car Inspection Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'สถานะตรวจสภาพรถ' : 'Car Inspection Status'}</Label>
              {renderCheckboxGroup('carInspectionStatuses', carInspectionStatusOptions)}
            </div>

            {/* Lead Types (Multi-select) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'th' ? 'ประเภท Lead' : 'Lead Type'}</Label>
              {renderCheckboxGroup('leadTypes', leadTypeOptions)}
            </div>
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
  );
}
