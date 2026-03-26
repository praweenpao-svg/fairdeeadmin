import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';

interface PolicyDetailsZoneProps {
  sale: SaleDetail;
}

function CollapsibleCard({ title, defaultOpen, children }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        <span className="text-sm font-semibold">{title}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1.5">
      <span className="text-[11px] text-muted-foreground block">{label}</span>
      <span className="text-xs font-medium">{value || '—'}</span>
    </div>
  );
}

export function PolicyDetailsZone({ sale }: PolicyDetailsZoneProps) {
  const { language } = useLanguageStore();
  const { customer, vehicle } = sale;

  return (
    <div className="space-y-3">
      {/* Vehicle Details */}
      <CollapsibleCard title={language === 'th' ? 'ข้อมูลรถยนต์' : 'Vehicle Details'}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 pt-3">
          <DetailRow label={language === 'th' ? 'ยี่ห้อ' : 'Make'} value={vehicle.brand} />
          <DetailRow label={language === 'th' ? 'รุ่น' : 'Model'} value={vehicle.model} />
          <DetailRow label={language === 'th' ? 'ปี' : 'Year'} value={String(vehicle.year)} />
          <DetailRow label={language === 'th' ? 'ทะเบียนรถ' : 'Plate Number'} value={vehicle.licensePlate} />
          <DetailRow label={language === 'th' ? 'เลขตัวถัง' : 'Chassis Number'} value={vehicle.chassisNumber} />
          <DetailRow label={language === 'th' ? 'สี' : 'Colour'} value={vehicle.color} />
          <DetailRow label={language === 'th' ? 'จังหวัดจดทะเบียน' : 'Registration Province'} value={vehicle.registrationProvince} />
          <DetailRow label={language === 'th' ? 'ประเภทอู่' : 'Garage Type'} value={sale.policies[0]?.garageType || '—'} />
        </div>
      </CollapsibleCard>

      {/* Insured Person */}
      <CollapsibleCard title={language === 'th' ? 'ผู้เอาประกันภัย' : 'Insured Person'}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 pt-3">
          <DetailRow label={language === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'} value={`${customer.title} ${customer.firstName} ${customer.lastName}`} />
          <DetailRow label={language === 'th' ? 'เลขบัตรประชาชน' : 'ID Number'} value={customer.nationalId} />
          <DetailRow label={language === 'th' ? 'วันเกิด' : 'Date of Birth'} value={customer.birthday} />
          <DetailRow label={language === 'th' ? 'เบอร์โทร' : 'Phone'} value={customer.phoneNumber} />
          <DetailRow label={language === 'th' ? 'อีเมล' : 'Email'} value="—" />
          <DetailRow label={language === 'th' ? 'เพศ' : 'Gender'} value={customer.gender === 'M' ? (language === 'th' ? 'ชาย' : 'Male') : (language === 'th' ? 'หญิง' : 'Female')} />
          <DetailRow
            label={language === 'th' ? 'ที่อยู่' : 'Address'}
            value={`${customer.addressLine}, ${customer.subDistrict}, ${customer.district}, ${customer.province} ${customer.postalCode}`}
          />
        </div>
      </CollapsibleCard>

      {/* Car Owner */}
      <CollapsibleCard title={language === 'th' ? 'เจ้าของรถ' : 'Car Owner'}>
        <div className="pt-3">
          <p className="text-xs text-muted-foreground italic">
            {language === 'th' ? 'เหมือนกับผู้เอาประกันภัย' : 'Same as insured person'}
          </p>
        </div>
      </CollapsibleCard>
    </div>
  );
}
