import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail, SalePolicy } from '@/data/mockSaleDetail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHistoryStore } from '@/stores/historyStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UploadPolicyModalProps {
  sale: SaleDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const insurerOptions = [
  'Muang Thai',
  'Bangkok Insurance',
  'Viriyah',
  'Dhipaya',
  'Tokio Marine',
  'AXA',
  'Allianz Ayudhya',
  'Chubb Samaggi',
];

const garageTypeOptions = [
  { value: 'approved', label: { en: 'Approved Garage', th: 'อู่ในสัญญา' } },
  { value: 'dealership', label: { en: 'Dealership', th: 'ศูนย์บริการ' } },
];

const insuranceClassOptions = [
  '1', '1+', '2', '2+', '3', '3+',
];

interface PolicyFormState {
  insurer: string;
  policyFile: File | null;
  policyNumber: string;
  startDate: string;
  endDate: string;
  trackingCode: string;
  garageType: string;
  insuranceClass: string;
  isCopy: boolean;
}

function PolicyForm({
  policy,
  showGarageAndClass,
  inheritedBanner,
}: {
  policy: SalePolicy;
  showGarageAndClass: boolean;
  inheritedBanner?: React.ReactNode;
}) {
  const { language } = useLanguageStore();
  const addHistory = useHistoryStore((s) => s.add);
  const [form, setForm] = useState<PolicyFormState>({
    insurer: policy.insurer,
    policyFile: null,
    policyNumber: policy.policyNumber || '',
    startDate: policy.policyStartDate || '',
    endDate: policy.policyEndDate || '',
    trackingCode: policy.trackingNumber || '',
    garageType: policy.garageType || 'approved',
    insuranceClass: policy.coverage.insuranceClass || '',
    isCopy: false,
  });

  const handleSave = () => {
    const kind = policy.kind.toUpperCase();
    addHistory({
      type: 'status_change',
      policyKind: policy.kind,
      description: form.trackingCode
        ? `${kind}: Policy uploaded → Policy Shipped (tracking: ${form.trackingCode})`
        : `${kind}: Policy uploaded${form.policyNumber ? ` (#${form.policyNumber})` : ''}`,
    });
    toast.success(
      language === 'th'
        ? `บันทึกข้อมูล ${kind} สำเร็จ`
        : `${kind} policy saved`,
      {
        description: form.trackingCode
          ? language === 'th'
            ? `สถานะ → Policy Shipped (tracking: ${form.trackingCode})`
            : `Status → Policy Shipped (tracking: ${form.trackingCode})`
          : language === 'th'
          ? 'บันทึกแล้ว'
          : 'Saved',
      },
    );
  };

  return (
    <div className="space-y-4 py-2">
      {inheritedBanner}
      {/* Insurer */}
      <div>
        <Label className="text-xs">{language === 'th' ? 'บริษัทประกัน' : 'Insurer'}</Label>
        <Select value={form.insurer} onValueChange={v => setForm(f => ({ ...f, insurer: v }))}>
          <SelectTrigger className="h-9 text-xs mt-1 bg-white dark:bg-background border border-input">
            <SelectValue placeholder={language === 'th' ? 'เลือกบริษัทประกัน' : 'Select insurer'} />
          </SelectTrigger>
          <SelectContent className="bg-popover z-[100]">
            {insurerOptions.map(o => (
              <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upload file */}
      <div>
        <Label className="text-xs">{language === 'th' ? 'อัปโหลดไฟล์กรมธรรม์' : 'Upload Policy File'}</Label>
        <Input
          type="file"
          className="h-9 text-xs mt-1 bg-muted border border-input cursor-pointer file:text-xs file:font-medium"
          onChange={e => setForm(f => ({ ...f, policyFile: e.target.files?.[0] || null }))}
        />
      </div>

      {/* Policy Number */}
      <div>
        <Label className="text-xs">{language === 'th' ? 'เลขกรมธรรม์' : 'Policy Number'}</Label>
        <Input
          value={form.policyNumber}
          onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))}
          className="h-9 text-xs mt-1 bg-white dark:bg-background"
          placeholder={language === 'th' ? 'กรอกเลขกรมธรรม์' : 'Enter policy number'}
        />
      </div>

      {/* Start / End Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{language === 'th' ? 'วันเริ่มต้น' : 'Start Date'}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-9 text-xs mt-1 bg-white dark:bg-background justify-start text-left font-normal",
                  !form.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {form.startDate || (language === 'th' ? 'เลือกวันที่' : 'Pick a date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100]" align="start">
              <Calendar
                mode="single"
                selected={form.startDate ? parse(form.startDate, 'dd/MM/yyyy', new Date()) : undefined}
                onSelect={(date) => setForm(f => ({ ...f, startDate: date ? format(date, 'dd/MM/yyyy') : '' }))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label className="text-xs">{language === 'th' ? 'วันสิ้นสุด' : 'End Date'}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-9 text-xs mt-1 bg-white dark:bg-background justify-start text-left font-normal",
                  !form.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {form.endDate || (language === 'th' ? 'เลือกวันที่' : 'Pick a date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100]" align="start">
              <Calendar
                mode="single"
                selected={form.endDate ? parse(form.endDate, 'dd/MM/yyyy', new Date()) : undefined}
                onSelect={(date) => setForm(f => ({ ...f, endDate: date ? format(date, 'dd/MM/yyyy') : '' }))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tracking Code — R-16/R-17 */}
      <div>
        <Label className="text-xs">
          {language === 'th' ? 'รหัสติดตามพัสดุ' : 'Tracking Code'}
        </Label>
        <Input
          value={form.trackingCode}
          onChange={e => setForm(f => ({ ...f, trackingCode: e.target.value }))}
          className="h-9 text-xs mt-1 bg-white dark:bg-background"
          placeholder={language === 'th' ? 'กรอกเลขพัสดุ' : 'Enter tracking code'}
        />
      </div>

      {/* VMI-only: Garage Type + Insurance Class — R-14/R-15 */}
      {showGarageAndClass && (
        <>
          <div>
            <Label className="text-xs">{language === 'th' ? 'ประเภทอู่' : 'Garage Type'}</Label>
            <div className="flex gap-2 mt-1.5">
              {garageTypeOptions.map(g => (
                <Button
                  key={g.value}
                  variant={form.garageType === g.value ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setForm(f => ({ ...f, garageType: g.value }))}
                >
                  {language === 'th' ? g.label.th : g.label.en}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">{language === 'th' ? 'ชั้นประกัน' : 'Insurance Class'}</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {insuranceClassOptions.map(c => (
                <Button
                  key={c}
                  variant={form.insuranceClass === c ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setForm(f => ({ ...f, insuranceClass: c }))}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Is copy of policy toggle — R-14/R-15 */}
      <div className="flex items-center gap-3 pt-1">
        <Switch
          checked={form.isCopy}
          onCheckedChange={v => setForm(f => ({ ...f, isCopy: v }))}
        />
        <Label className="text-xs">
          {language === 'th' ? 'ไฟล์นี้เป็นสำเนากรมธรรม์' : 'This is a copy of the policy'}
        </Label>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="sm" className="text-xs" onClick={handleSave}>
          {language === 'th' ? 'บันทึก' : 'Save'}
        </Button>
      </div>
    </div>
  );
}


export function UploadPolicyModal({ sale, open, onOpenChange }: UploadPolicyModalProps) {
  const { language } = useLanguageStore();
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');
  const cmiPolicy = sale.policies.find(p => p.kind === 'cmi');
  const hasBoth = !!vmiPolicy && !!cmiPolicy;
  const [activeTab, setActiveTab] = useState<'vmi' | 'cmi'>(vmiPolicy ? 'vmi' : 'cmi');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy'}
          </DialogTitle>
        </DialogHeader>

        {hasBoth ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'vmi' | 'cmi')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vmi" className="text-xs">
                <Badge variant="outline" className="mr-2 text-[9px] border-primary text-primary">VMI</Badge>
                {language === 'th' ? 'ประกันภาคสมัครใจ' : 'Voluntary'}
              </TabsTrigger>
              <TabsTrigger value="cmi" className="text-xs">
                <Badge variant="outline" className="mr-2 text-[9px] border-orange-500 text-orange-600">CMI</Badge>
                {language === 'th' ? 'พ.ร.บ.' : 'Compulsory'}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="vmi">
              <PolicyForm key="vmi" policy={vmiPolicy!} showGarageAndClass={true} />
            </TabsContent>
            <TabsContent value="cmi">
              <PolicyForm key="cmi" policy={cmiPolicy!} showGarageAndClass={false} />
            </TabsContent>
          </Tabs>
        ) : vmiPolicy ? (
          <PolicyForm policy={vmiPolicy} showGarageAndClass={true} />
        ) : cmiPolicy ? (
          <PolicyForm policy={cmiPolicy} showGarageAndClass={false} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
