import React from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { CoveragePanel } from './CoveragePanel';
import { PolicyDetailsZone } from './PolicyDetailsZone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileText, Image, CreditCard, User, Package } from 'lucide-react';

interface ContentTabsProps {
  sale: SaleDetail;
}

function InvoiceTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();

  return (
    <div className="space-y-4">
      {sale.policies.map((policy) => (
        <Card key={policy.kind}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  policy.kind === 'vmi' ? 'border-primary text-primary text-[10px]' : 'border-orange-500 text-orange-600 text-[10px]'
                }>
                  {policy.kind.toUpperCase()}
                </Badge>
                <span className="text-sm font-medium">{policy.packageName}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {policy.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'เบี้ยหลังภาษี' : 'Premium After Tax'}</span>
                <span className="font-semibold">{policy.premiumAfterTax.toLocaleString()} ฿</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'คอมมิชชั่น' : 'Commission'}</span>
                <span className="font-medium text-primary">{policy.affiliateCommission.toLocaleString()} ฿</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'วิธีชำระ' : 'Payment Method'}</span>
                <span className="font-medium">{sale.paymentMethod}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-4">
          <h5 className="text-xs font-semibold mb-2">{language === 'th' ? 'สรุปยอดชำระ' : 'Payment Summary'}</h5>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === 'th' ? 'รวมเบี้ยประกัน' : 'Total Premium'}</span>
              <span className="font-semibold">
                {sale.policies.reduce((s, p) => s + p.premiumAfterTax, 0).toLocaleString()} ฿
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === 'th' ? 'สถานะการชำระ' : 'Payment Status'}</span>
              <Badge variant="outline" className="text-[10px]">{sale.paymentStatus}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();

  const docs = [
    { name: language === 'th' ? 'สำเนาบัตรประชาชน' : 'National ID Copy', status: 'uploaded' },
    { name: language === 'th' ? 'สำเนาทะเบียนรถ' : 'Car Registration', status: 'uploaded' },
    { name: language === 'th' ? 'กรมธรรม์ VMI' : 'VMI Policy File', status: 'pending' },
    ...(sale.hasCompulsoryInsurance ? [
      { name: language === 'th' ? 'กรมธรรม์ พ.ร.บ.' : 'CMI Policy File', status: 'pending' },
    ] : []),
    { name: language === 'th' ? 'สลิปชำระเงิน' : 'Payment Slip', status: 'uploaded' },
  ];

  return (
    <div className="space-y-2">
      {docs.map((doc, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3">
            {doc.status === 'uploaded' ? (
              <Image className="w-4 h-4 text-green-600" />
            ) : (
              <FileText className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">{doc.name}</span>
          </div>
          <Badge
            variant="outline"
            className={doc.status === 'uploaded'
              ? 'border-green-500 text-green-600 text-[10px]'
              : 'border-muted-foreground text-muted-foreground text-[10px]'
            }
          >
            {doc.status === 'uploaded'
              ? (language === 'th' ? 'อัปโหลดแล้ว' : 'Uploaded')
              : (language === 'th' ? 'รอเอกสาร' : 'Pending')
            }
          </Badge>
        </div>
      ))}
    </div>
  );
}

function PolicyBenefitsTab({ sale }: { sale: SaleDetail }) {
  return (
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
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h5 className="text-xs font-semibold text-foreground">{children}</h5>;
}

function PackageSelectionTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');

  return (
    <div className="space-y-6">
      {/* Selected Package Card */}
      <div className="space-y-2">
        <SectionLabel>{language === 'th' ? 'แพ็กเกจที่เลือก' : 'Select a package'}</SectionLabel>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">{vmiPolicy?.packageName || '-'}</p>
                <p className="text-xs text-muted-foreground">{vmiPolicy?.insurer || '-'}</p>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'th' ? 'ค่าคอมมิชชั่น' : 'Affiliate Commission'}</span>
                <span className="font-semibold text-primary">{vmiPolicy?.affiliateCommission.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'th' ? 'เบี้ยหลังภาษี' : 'Premium After Tax'}</span>
                <span className="font-semibold">{vmiPolicy?.premiumAfterTax.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'th' ? 'ทุนประกัน' : 'Sum Insured'}</span>
                <span className="font-semibold">{vmiPolicy?.sumInsured.toLocaleString()} ฿</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column: Payment Method + Instalment Options */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'วิธีการชำระเงิน' : 'Payment Method'} <span className="text-destructive">*</span></SectionLabel>
            <Select defaultValue={sale.paymentMethod}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QR Code (Full Payment)">{language === 'th' ? 'QR โค้ด (จ่ายเต็ม)' : 'QR Code (Full Payment)'}</SelectItem>
                <SelectItem value="QR Code (Installment)">{language === 'th' ? 'QR โค้ด (ผ่อนชำระ)' : 'QR Code (Installment)'}</SelectItem>
                <SelectItem value="Bank Transfer">{language === 'th' ? 'โอนเงิน' : 'Bank Transfer'}</SelectItem>
                <SelectItem value="Credit Card (Full)">{language === 'th' ? 'บัตรเครดิต (จ่ายเต็ม)' : 'Credit Card (Full)'}</SelectItem>
                <SelectItem value="Credit (Full)">{language === 'th' ? 'เครดิต (จ่ายเต็ม)' : 'Credit (Full)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Compulsory Insurance */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'ซื้อ พ.ร.บ. เพิ่ม?' : 'Add Compulsory Insurance?'}</SectionLabel>
            <div className="flex gap-2">
              {['yes', 'no'].map(val => {
                const isActive = val === 'yes' ? sale.hasCompulsoryInsurance : !sale.hasCompulsoryInsurance;
                return (
                  <button key={val} className={`px-4 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
                  }`}>
                    {val === 'yes' ? (language === 'th' ? 'ใช่' : 'Yes') : (language === 'th' ? 'ไม่ใช่' : 'No')}
                    {isActive && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Type */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'ประเภทลูกค้า' : 'Customer Type'}</SectionLabel>
            <RadioGroup defaultValue={sale.customer.customerType} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="text-xs">{language === 'th' ? 'บุคคลธรรมดา' : 'Individual'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="corporation" id="corporation" />
                <Label htmlFor="corporation" className="text-xs">{language === 'th' ? 'บริษัท' : 'Corporation'}</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Commercial Vehicle */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'สำหรับรถพาณิชย์' : 'For Commercial Vehicle'}</SectionLabel>
            <div className="flex items-center gap-2">
              <Checkbox id="commercial" checked={sale.forCommercialVehicle} />
              <Label htmlFor="commercial" className="text-xs text-muted-foreground">
                {language === 'th' ? 'รถใช้เพื่อการพาณิชย์' : 'Vehicle is for commercial use'}
              </Label>
            </div>
          </div>

          {/* Vehicle Code */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'รหัสรถ' : 'Vehicle Code'} <span className="text-destructive">*</span></SectionLabel>
            <Select defaultValue={sale.vehicle.vehicleCode}>
              <SelectTrigger className="text-xs h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="110 - รถยนต์ส่วนบุ">110 - รถยนต์ส่วนบุ</SelectItem>
                <SelectItem value="120 - รถยนต์รับจ้าง">120 - รถยนต์รับจ้าง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add-Ons */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'ความคุ้มครองเพิ่มเติม' : 'Add-Ons'}</SectionLabel>
            <Select defaultValue="">
              <SelectTrigger className="text-xs h-9 w-48">
                <SelectValue placeholder={language === 'th' ? 'เลือก Add-Ons' : 'Select Add-Ons'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{language === 'th' ? 'ไม่ติดตั้ง' : 'None'}</SelectItem>
                <SelectItem value="roadside">{language === 'th' ? 'ล้อแม็กซ์ สเกิร์ต ฝากระโปรง' : 'Alloy Wheels & Skirt'}</SelectItem>
                <SelectItem value="searchlight">{language === 'th' ? 'สเกิร์ตรอบคัน' : 'Full Body Kit'}</SelectItem>
                <SelectItem value="headlight">{language === 'th' ? 'ไฟหน้าแต่ง' : 'Custom Headlights'}</SelectItem>
                <SelectItem value="taillight">{language === 'th' ? 'ไฟท้ายแต่ง' : 'Custom Taillights'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right column: Instalment Options + KYC */}
        <div className="space-y-4">
          {/* Instalment Options */}
          <div className="space-y-3">
            <SectionLabel>{language === 'th' ? 'ตัวเลือกผ่อนชำระ' : 'Instalment Options'}</SectionLabel>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{language === 'th' ? 'เลือกแผนผ่อนชำระ' : 'Select Instalment Plan'}</p>
              <RadioGroup defaultValue="equal" className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="equal" id="equal-inst" />
                  <Label htmlFor="equal-inst" className="text-xs">{language === 'th' ? 'ผ่อนเท่ากัน' : 'Equal Instalments'}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="downpayment" id="downpay-inst" />
                  <Label htmlFor="downpay-inst" className="text-xs">{language === 'th' ? 'ดาวน์ 25%' : 'With 25% Downpayment'}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{language === 'th' ? 'จำนวนงวด' : 'No. of Instalments'}</p>
              <Select defaultValue="3">
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">{language === 'th' ? '3 งวด หักรายได้ 0.00% รับรายได้หลังงวดที่ 3' : '3 instalments 0.00% Receive income after 3rd'}</SelectItem>
                  <SelectItem value="4">{language === 'th' ? '4 งวด หักรายได้ 0.00% รับรายได้หลังงวดที่ 3' : '4 instalments 0.00% Receive income after 3rd'}</SelectItem>
                  <SelectItem value="5">{language === 'th' ? '5 งวด หักรายได้ 0.00% รับรายได้หลังงวดที่ 3' : '5 instalments 0.00% Receive income after 3rd'}</SelectItem>
                  <SelectItem value="6">{language === 'th' ? '6 งวด หักรายได้ 0.00% รับรายได้หลังงวดที่ 3' : '6 instalments 0.00% Receive income after 3rd'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KYC Information */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{language === 'th' ? 'ข้อมูล KYC' : 'KYC Information'}</p>
            <div className="flex gap-2">
              {['manual', 'auto'].map(val => (
                <button key={val} className={`px-4 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  val === 'manual' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
                }`}>
                  {val === 'manual' ? (language === 'th' ? 'Manual KYC' : 'Manual KYC') : 'Auto KYC'}
                  {val === 'manual' && ' ✓'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContentTabs({ sale }: ContentTabsProps) {
  const { language } = useLanguageStore();

  return (
    <Tabs defaultValue="package" className="w-full">
      <TabsList className="w-full justify-start bg-muted/30 border border-border rounded-lg p-1">
        <TabsTrigger value="package" className="text-xs gap-1.5">
          <Package className="w-3.5 h-3.5" />
          {language === 'th' ? 'เลือกแพ็กเกจ' : 'Package Selection'}
        </TabsTrigger>
        <TabsTrigger value="details" className="text-xs gap-1.5">
          <User className="w-3.5 h-3.5" />
          {language === 'th' ? 'ข้อมูลลูกค้าและรถ' : 'Customer & Vehicle'}
        </TabsTrigger>
        <TabsTrigger value="invoice" className="text-xs gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          {language === 'th' ? 'ใบแจ้งหนี้และชำระเงิน' : 'Invoice & Payments'}
        </TabsTrigger>
        <TabsTrigger value="documents" className="text-xs gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {language === 'th' ? 'เอกสาร' : 'Documents'}
        </TabsTrigger>
        <TabsTrigger value="benefits" className="text-xs gap-1.5">
          <Image className="w-3.5 h-3.5" />
          {language === 'th' ? 'สิทธิประโยชน์กรมธรรม์' : 'Policy Benefits'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="package" className="mt-4">
        <PackageSelectionTab sale={sale} />
      </TabsContent>
      <TabsContent value="details" className="mt-4">
        <PolicyDetailsZone sale={sale} />
      </TabsContent>
      <TabsContent value="invoice" className="mt-4">
        <InvoiceTab sale={sale} />
      </TabsContent>
      <TabsContent value="documents" className="mt-4">
        <DocumentsTab sale={sale} />
      </TabsContent>
      <TabsContent value="benefits" className="mt-4">
        <PolicyBenefitsTab sale={sale} />
      </TabsContent>
    </Tabs>
  );
}
