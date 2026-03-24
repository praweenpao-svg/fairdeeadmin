import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { LanguageToggle } from '@/components/LanguageToggle';
import { mockSaleDetail } from '@/data/mockSaleDetail';
import { SalesDetailPanel } from '@/components/ops/SalesDetailPanel';
import { ActionPanel } from '@/components/ops/ActionPanel';
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
    <div className="flex items-center justify-center gap-0 px-8 py-4 bg-card border-b border-border">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors shrink-0',
                  isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCurrent
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-muted-foreground/30 text-muted-foreground bg-muted/20'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
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
                  'h-0.5 w-16 mx-2 rounded-full',
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
  const { language } = useLanguageStore();
  const [currentStep] = useState(3); // Default to step 4 (Admin Actions) — index 3

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

      {/* 4-Step Stepper */}
      <StepperBar currentStep={currentStep} />

      {/* Main layout: Action Panel (left, sticky) + Detail (right, scrollable) */}
      <div className="flex">
        <ActionPanel sale={mockSaleDetail} />
        <SalesDetailPanel sale={mockSaleDetail} />
      </div>
    </div>
  );
}
