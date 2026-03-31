import React from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CoveragePanel } from './CoveragePanel';
import { cn } from '@/lib/utils';

interface SalesDetailPanelProps {
  sale: SaleDetail;
}

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border border-border rounded-lg bg-card", className)}>
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ReadOnlyField({ label, value, source, className }: {
  label: string;
  value: string;
  source?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        {source && (
          <span className="text-[10px] text-primary/60">⊕ {source}</span>
        )}
      </div>
      <Input value={value} readOnly className="h-8 text-xs bg-muted/20" />
    </div>
  );
}

function PackageCard({ policy, isSelected }: { policy: SaleDetail['policies'][0]; isSelected: boolean }) {
  const { language } = useLanguageStore();
  return (
    <div className={cn(
      "border rounded-lg p-4 relative",
      isSelected ? "border-primary bg-primary/5" : "border-border"
    )}>
      {isSelected && (
        <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={cn(isSelected && "ml-6")}>
          <h5 className="text-sm font-semibold">{policy.packageName}</h5>
          <p className="text-xs text-muted-foreground">{policy.insurer}</p>
        </div>
        <Badge variant="outline" className={cn(
          'text-[10px]',
          policy.kind === 'vmi' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'
        )}>
          {policy.kind.toUpperCase()}
        </Badge>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{language === 'th' ? 'ค่าคอมมิชชั่น' : 'Affiliate Commission'}</span>
          <span className="font-medium text-primary">{policy.affiliateCommission.toLocaleString()} Baht</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{language === 'th' ? 'เบี้ยประกันหลังภาษี' : 'Premium After Tax'}</span>
          <span className="font-semibold">{policy.premiumAfterTax.toLocaleString()} Baht</span>
        </div>
        {policy.sumInsured > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{language === 'th' ? 'ทุนประกัน' : 'Sum Insured'}</span>
            <span className="font-medium">{policy.sumInsured.toLocaleString()} ฿</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SalesDetailPanel({ sale }: SalesDetailPanelProps) {
  const { language } = useLanguageStore();
  const { customer, vehicle, shipping } = sale;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Sale Header */}
      <div className="flex items-center gap-4">
        <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
          {sale.qqId}
        </Badge>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {language === 'th' ? 'สถานะชำระ' : 'Payment Status'}:
            <span className={cn(
              'ml-1 font-semibold',
              sale.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'
            )}>
              {sale.paymentStatus}
            </span>
          </Badge>
        </div>
      </div>

      {/* Package Selection */}
      <SectionCard title={language === 'th' ? 'แพ็คเกจที่เลือก' : 'Selected Packages'}>
        <div className="grid grid-cols-2 gap-4">
          {sale.policies.map((policy) => (
            <PackageCard key={policy.kind} policy={policy} isSelected={true} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <ReadOnlyField
            label={language === 'th' ? 'วิธีชำระเงิน' : 'Payment Method'}
            value={sale.paymentMethod}
          />
          <ReadOnlyField
            label={language === 'th' ? 'ประเภทลูกค้า' : 'Customer Type'}
            value={customer.customerType === 'individual' ? (language === 'th' ? 'บุคคลธรรมดา' : 'Individual') : (language === 'th' ? 'นิติบุคคล' : 'Corporation')}
          />
        </div>
      </SectionCard>

      {/* National ID / Customer Details */}
      <SectionCard title={language === 'th' ? 'ข้อมูลลูกค้า' : 'Customer Details'}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <ReadOnlyField label={language === 'th' ? 'คำนำหน้า' : 'Title'} value={customer.title} source="Portal" />
          <ReadOnlyField label={language === 'th' ? 'ประเภทเอกสาร' : 'Type of Identification'} value={customer.idType} source="National Id" />
          <ReadOnlyField label={language === 'th' ? 'ชื่อ' : 'First Name'} value={customer.firstName} source="Portal" />
          <ReadOnlyField label={language === 'th' ? 'นามสกุล' : 'Last Name'} value={customer.lastName} />
          <ReadOnlyField label={language === 'th' ? 'เลขบัตรประชาชน' : 'National Id'} value={customer.nationalId} source="Portal" />
          <ReadOnlyField label={language === 'th' ? 'วันเกิด' : 'Birthday (AD)'} value={customer.birthday} source="Portal" />
          <ReadOnlyField label={language === 'th' ? 'เพศ' : 'Gender'} value={customer.gender} source="Portal" />
          <ReadOnlyField label={language === 'th' ? 'เบอร์โทร' : 'Phone Number'} value={customer.phoneNumber} />
        </div>

        <h5 className="text-xs font-semibold text-primary mt-5 mb-3">
          {language === 'th' ? 'ที่อยู่ผู้ถือกรมธรรม์' : 'Policy Holder Address'}
        </h5>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <ReadOnlyField label={language === 'th' ? 'ที่อยู่' : 'Address Line'} value={customer.addressLine} source="Portal" className="col-span-2" />
          <ReadOnlyField label={language === 'th' ? 'จังหวัด' : 'Province'} value={customer.province} />
          <ReadOnlyField label={language === 'th' ? 'เขต/อำเภอ' : 'District'} value={customer.district} />
          <ReadOnlyField label={language === 'th' ? 'แขวง/ตำบล' : 'Sub District'} value={customer.subDistrict} />
          <ReadOnlyField label={language === 'th' ? 'รหัสไปรษณีย์' : 'Postal Code'} value={customer.postalCode} />
        </div>
      </SectionCard>

      {/* Car Registration / Policy Details */}
      <SectionCard title={language === 'th' ? 'ข้อมูลรถยนต์' : 'Car Registration'}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{language === 'th' ? 'ประเภททะเบียน' : 'License Type'}</label>
            <Select value={vehicle.licenseType} disabled>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Registered">Registered</SelectItem></SelectContent>
            </Select>
          </div>
          <ReadOnlyField label={language === 'th' ? 'ทะเบียนรถ' : 'License Plate'} value={vehicle.licensePlate} source="Portal" />
          <ReadOnlyField label={language === 'th' ? 'จังหวัดจดทะเบียน' : 'Registration Province'} value={vehicle.registrationProvince} source="Portal" />
          <ReadOnlyField label={language === 'th' ? 'เลขตัวถัง' : 'Chassis Number'} value={vehicle.chassisNumber} />
          <ReadOnlyField label={language === 'th' ? 'เลขเครื่อง' : 'Engine Number'} value={vehicle.engineNumber} />
          <ReadOnlyField label={language === 'th' ? 'น้ำหนักรถ' : 'Vehicle Weight'} value={vehicle.vehicleWeight} source="Car Registration" />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{language === 'th' ? 'สี' : 'Color'}</label>
            <Select value={vehicle.color} disabled>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ขาว">ขาว</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{language === 'th' ? 'ระบุคนขับ' : 'Driver Specification'}</label>
            <Select value={vehicle.driverSpec} disabled>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Not specified">Not specified</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{language === 'th' ? 'ผู้รับผลประโยชน์' : 'Beneficiary Type'}</label>
            <Select value={vehicle.beneficiaryType} disabled>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Legal Owner">Legal Owner</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Insurance / Policy Info */}
      <SectionCard title={language === 'th' ? 'ข้อมูลประกันภัย' : 'Insurance Information'}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <ReadOnlyField label={language === 'th' ? 'รหัสตัวแทน' : 'Agent Code'} value={sale.agentCode} />
          <ReadOnlyField label={language === 'th' ? 'ประเภทงาน' : 'Type of Sale'} value={sale.typeOfSale} />
          <ReadOnlyField label={language === 'th' ? 'บ.ประกัน' : 'Insurer Name'} value={sale.policies[0].insurer} />
          <ReadOnlyField label={language === 'th' ? 'ชั้นประกัน' : 'Insurance Class'} value={sale.policies[0].coverage.insuranceClass} />
          <ReadOnlyField label={language === 'th' ? 'ทุนประกัน' : 'Sum Insured'} value={`${sale.policies[0].sumInsured.toLocaleString()} ฿`} />
          <ReadOnlyField label={language === 'th' ? 'ประเภทอู่' : 'Garage Type'} value={sale.policies[0].garageType} />
          <ReadOnlyField label={language === 'th' ? 'รหัสรถ' : 'Vehicle Code'} value={vehicle.vehicleCode} />
          <ReadOnlyField label={language === 'th' ? 'ทะเบียนรถ' : 'Vehicle Number'} value={vehicle.licensePlate} />
        </div>
      </SectionCard>

      {/* Shipping Address */}
      <SectionCard title={language === 'th' ? 'ที่อยู่จัดส่ง' : 'Shipping Address'}>
        <div className="flex gap-4 mb-4">
          {(['policy_holder', 'agent', 'e_policy', 'new_address'] as const).map((type) => (
            <label key={type} className="flex items-center gap-1.5 text-xs">
              <input
                type="radio"
                name="receiverType"
                checked={shipping.receiverType === type}
                readOnly
                className="w-3.5 h-3.5"
              />
              {type === 'policy_holder' ? 'Policy Holder' :
               type === 'agent' ? 'Agent' :
               type === 'e_policy' ? 'E-Policy' : 'Add new address'}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <ReadOnlyField label={language === 'th' ? 'ชื่อผู้รับ' : 'Policy Receiver Name'} value={shipping.receiverName} source="National Id Saved" />
          <ReadOnlyField label={language === 'th' ? 'ที่อยู่' : 'Address Line'} value={shipping.addressLine} source="National Id Saved" />
          <ReadOnlyField label={language === 'th' ? 'จังหวัด' : 'Province'} value={shipping.province} source="National Id Saved" />
          <ReadOnlyField label={language === 'th' ? 'เขต/อำเภอ' : 'District'} value={shipping.district} source="National Id Saved" />
          <ReadOnlyField label={language === 'th' ? 'แขวง/ตำบล' : 'Sub District'} value={shipping.subDistrict} source="National Id Saved" />
          <ReadOnlyField label={language === 'th' ? 'รหัสไปรษณีย์' : 'Postal Code'} value={shipping.postalCode} source="National Id Saved" />
          <ReadOnlyField label={language === 'th' ? 'เบอร์โทร' : 'Phone Number'} value={shipping.phoneNumber} source="National Id Saved" />
        </div>
      </SectionCard>

      {/* Policy Benefits & Coverage Panels */}
      <div className="space-y-3">
        {sale.policies.map((policy) => (
          <CoveragePanel
            key={policy.kind}
            coverage={policy.coverage}
            policyKind={sale.policies.length > 1 ? policy.kind : undefined}
            showLabel={sale.policies.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
