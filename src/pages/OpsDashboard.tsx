import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MentionNotificationBell } from '@/components/notifications/MentionNotificationBell';
import { mockSaleDetail } from '@/data/mockSaleDetail';
import { StickyPageHeader } from '@/components/ops/StickyPageHeader';
import { SaleOverviewCard } from '@/components/ops/SaleOverviewCard';
import { PolicyDetailsZone } from '@/components/ops/PolicyDetailsZone';
import { ContentTabs } from '@/components/ops/ContentTabs';
import { SaleDetailBar } from '@/components/ops/SaleDetailBar';
import { UploadPolicyModal } from '@/components/ops/UploadPolicyModal';
import { HistoryActivitySidebar } from '@/components/ops/HistoryActivitySidebar';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

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
  const { language } = useLanguageStore();
  const [currentStep, setCurrentStep] = useState(3);
  const mode: 'A' | 'B' = currentStep >= 3 ? 'B' : 'A';

  // Modal / sidebar states
  const [uploadPolicyOpen, setUploadPolicyOpen] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);

  const handleToast = (msg: string) => {
    toast.success(msg, {
      description: language === 'th' ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต' : 'This will connect to the real system.',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Global bar: demo toggle + bell + language toggle */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-card">
        {/* Demo mode switcher */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-md px-2 py-1">
          <span className="text-[10px] text-muted-foreground font-medium">Demo:</span>
          {[0, 1, 2, 3].map(step => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={cn(
              'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                currentStep === step
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              Step {step + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <MentionNotificationBell />
          <LanguageToggle />
        </div>
      </div>

      {/* Sticky Page Header — license plate only */}
      <StickyPageHeader sale={mockSaleDetail} />

      {/* 4-Step Stepper */}
      <StepperBar currentStep={currentStep} />

      {/* Mode B: Full-width scrollable content */}
      {mode === 'B' && (
        <div className="flex-1 overflow-y-auto p-4 max-w-6xl mx-auto w-full space-y-4">
          {/* Detail bar: Name, QQ ID, Status, Actions — inside step 4 content */}
          <SaleDetailBar
            sale={mockSaleDetail}
            hasActiveRework={false}
            onOpenUploadPolicy={() => setUploadPolicyOpen(true)}
            onOpenHistoryLog={() => setHistorySidebarOpen(true)}
            onOpenEndorsement={() => handleToast(language === 'th' ? 'เปิด Record Endorsement' : 'Open Record Endorsement')}
            onOpenUploadDoc={() => handleToast(language === 'th' ? 'เปิด Upload Document' : 'Open Upload Document')}
          />
          <SaleOverviewCard sale={mockSaleDetail} />
          <PolicyDetailsZone sale={mockSaleDetail} />
          <ContentTabs sale={mockSaleDetail} />
        </div>
      )}

      {/* Mode A: Wizard step content (placeholder) */}
      {mode === 'A' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">{currentStep + 1}</span>
            </div>
            <h3 className="text-lg font-semibold">
              {language === 'th' ? steps[currentStep].th : steps[currentStep].en}
            </h3>
          </div>
        </div>
      )}

      {/* Upload Policy Modal (G2) */}
      <UploadPolicyModal
        sale={mockSaleDetail}
        open={uploadPolicyOpen}
        onOpenChange={setUploadPolicyOpen}
      />

      {/* History & Activity Log Sidebar (Section 8/14 — shared component) */}
      <HistoryActivitySidebar
        open={historySidebarOpen}
        onClose={() => setHistorySidebarOpen(false)}
        quotationId={mockSaleDetail.qqId}
      />

      {/* Overlay when sidebar is open */}
      {historySidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setHistorySidebarOpen(false)}
        />
      )}
    </div>
  );
}
