import React from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SaleOverviewCardProps {
  sale: SaleDetail;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-right">{value || '—'}</span>
    </div>
  );
}

export function SaleOverviewCard({ sale }: SaleOverviewCardProps) {
  const { language } = useLanguageStore();

  const rows = [
    { label: language === 'th' ? 'เลขใบเสนอราคา' : 'Quotation ID', value: sale.qqId },
    { label: language === 'th' ? 'ประเภทงาน' : 'Sale Type', value: sale.typeOfSale },
    { label: language === 'th' ? 'วันที่ขาย' : 'Sold On', value: sale.createdAt },
    { label: language === 'th' ? 'เลขใบเสนอราคา บ.ประกัน' : 'Insurer Quotation ID', value: '—' },
    { label: language === 'th' ? 'สร้างโดย' : 'Created by', value: '—' },
    { label: language === 'th' ? 'สร้างเมื่อ' : 'Created at', value: sale.createdAt },
    { label: 'RF', value: sale.assignment.rf || '—' },
    { label: 'SC', value: sale.assignment.sc || '—' },
    { label: 'DE', value: sale.assignment.de || '—' },
    { label: 'Admin', value: sale.assignment.admin || '—' },
    { label: 'Delivery', value: sale.assignment.delivery || '—' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold">
          {language === 'th' ? 'ข้อมูลงาน' : 'Sale Overview'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {rows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </CardContent>
    </Card>
  );
}
