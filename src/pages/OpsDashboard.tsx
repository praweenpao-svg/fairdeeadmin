import React from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { LanguageToggle } from '@/components/LanguageToggle';
import { mockSaleDetail } from '@/data/mockSaleDetail';
import { SalesDetailPanel } from '@/components/ops/SalesDetailPanel';
import { ActionPanel } from '@/components/ops/ActionPanel';

export default function OpsDashboard() {
  const { language } = useLanguageStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div>
          <h1 className="text-lg font-bold">
            {language === 'th' ? 'OPS Dashboard' : 'OPS Dashboard'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {language === 'th'
              ? 'รายละเอียดงาน — VMI + CMI ตัวอย่าง'
              : 'Sales Detail — VMI + CMI Example'}
          </p>
        </div>
        <LanguageToggle />
      </div>

      {/* Main layout: Detail (left, scrollable) + Action Panel (right, sticky) */}
      <div className="flex">
        <SalesDetailPanel sale={mockSaleDetail} />
        <ActionPanel sale={mockSaleDetail} />
      </div>
    </div>
  );
}
