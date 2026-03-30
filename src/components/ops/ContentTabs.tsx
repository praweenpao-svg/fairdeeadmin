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

export function ContentTabs({ sale }: ContentTabsProps) {
  const { language } = useLanguageStore();

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="w-full justify-start bg-muted/30 border border-border rounded-lg p-1">
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
