import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';

import { mockSaleDetail } from '@/data/mockSaleDetail';
import { ActionPanel } from '@/components/ops/ActionPanel';
import { StickyPageHeader } from '@/components/ops/StickyPageHeader';
import { SaleOverviewCard } from '@/components/ops/SaleOverviewCard';
import { ProgressionTimeline } from '@/components/ops/ProgressionTimeline';
import { PolicyDetailsZone } from '@/components/ops/PolicyDetailsZone';
import { ContentTabs } from '@/components/ops/ContentTabs';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const steps = [
  { en: 'Package Selection', th: 'เลือกแพ็คเกจ' },
  { en: 'Link Documents', th: 'เชื่อมโยงเอกสาร' },
  { en: 'Verify Information', th: 'ตรวจสอบข้อมูล' },
  { en: 'Admin Actions', th: 'จัดการงาน' },
];

function StepperBar({ currentStep }: { currentStep: number }) {
  const { language } = useLanguageStore();

  return (
    <div className="flex items-center justify-center gap-0 px-8 py-3 bg-muted/30 border-b border-border">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors shrink-0',
                  isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCurrent
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-muted-foreground/30 text-muted-foreground bg-muted/20'
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium whitespace-nowrap',
                  isCompleted
                    ? 'text-primary'
                    : isCurrent
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                {language === 'th' ? step.th : step.en}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'h-0.5 w-14 mx-2 rounded-full',
                  isCompleted ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OpsDashboard() {
  const [currentStep] = useState(3);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Page Header (R-05, R-06) */}
      <StickyPageHeader sale={mockSaleDetail} />

      {/* 4-Step Stepper */}
      <StepperBar currentStep={currentStep} />

      {/* Two-column body: Left Panel (sticky) + Main Content (scrollable) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — §13A Action Panel */}
        <ActionPanel sale={mockSaleDetail} />

        {/* Main Content Area (R-02: Overview → Timeline → Policy Details → Tabs) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* A. Sale Overview Card */}
          <SaleOverviewCard sale={mockSaleDetail} />

          {/* B. Progression Timeline (Q+) */}
          <ProgressionTimeline sale={mockSaleDetail} />

          {/* C. Policy Details Zone */}
          <PolicyDetailsZone sale={mockSaleDetail} />

          {/* D. Content Tabs */}
          <ContentTabs sale={mockSaleDetail} />
        </div>
      </div>
    </div>
  );
}
