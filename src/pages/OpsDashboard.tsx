import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MentionNotificationBell } from '@/components/notifications/MentionNotificationBell';
import { mockSaleDetail } from '@/data/mockSaleDetail';
import { SaleOverviewCard, PolicyStatusCard, AgentDetailsCard, PaymentStatusCard, KycCard, DownloadsCard, HistoryCard } from '@/components/ops/SaleOverviewCard';
import { ContentTabs } from '@/components/ops/ContentTabs';
import { SaleDetailBar } from '@/components/ops/SaleDetailBar';
import { UploadPolicyModal } from '@/components/ops/UploadPolicyModal';
import { PolicyRemarksReworkDialog } from '@/components/pipeline/PolicyRemarksReworkDialog';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { mockReworkConfigs } from '@/data/mockLeads';
import { PolicyRemark, PolicyReworkEntry, ReworkAttachment } from '@/types/pipeline';

const steps = [
  { en: 'Package Selection', th: 'เลือกแพ็คเกจ' },
  { en: 'Link Documents', th: 'เชื่อมโยงเอกสาร' },
  { en: 'Verify Information', th: 'ตรวจสอบข้อมูล' },
  { en: 'Admin Actions', th: 'จัดการงาน' },
];

function StepperBar({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  const { language } = useLanguageStore();

  return (
    <div className="flex items-center gap-0 px-6 py-3 bg-muted/30 border-b border-border">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={idx}>
            <button onClick={() => onStepClick(idx)} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
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
            </button>
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

  // Live sale state so policy status changes propagate to primary button
  const [sale, setSale] = useState(() => ({ ...mockSaleDetail, policies: mockSaleDetail.policies.map(p => ({ ...p })) }));

  const handlePolicyStatusChange = (kind: 'vmi' | 'cmi', newStatus: string) => {
    setSale(prev => ({
      ...prev,
      policies: prev.policies.map(p =>
        p.kind === kind ? { ...p, status: newStatus } : p
      ),
    }));
  };

  // Modal / sidebar states
  const [uploadPolicyOpen, setUploadPolicyOpen] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  const [historySidebarPolicyKind, setHistorySidebarPolicyKind] = useState<'vmi' | 'cmi'>('vmi');

  // Mock rework/remarks state for the shared sidesheet
  const [opsRemarks, setOpsRemarks] = useState<PolicyRemark[]>([
    {
      id: 'opr-1',
      comment: 'ลูกค้าแจ้งว่าจะส่งเอกสารเพิ่มเติมภายในวันพรุ่งนี้',
      createdBy: 'Pao',
      createdAt: '2026-03-27T16:00:00',
    },
  ]);
  const [opsReworkHistory, setOpsReworkHistory] = useState<PolicyReworkEntry[]>([
    {
      id: 'opw-1',
      reasonId: 'rw-1',
      reasonLabel: 'ระบุข้อมูลผู้เอาประกันภัย ไม่ถูกต้องหรือไม่ครบถ้วน',
      details: 'กรุณาตรวจสอบชื่อและที่อยู่ @Pao',
      attachments: [],
      savedBy: 'Rachel',
      savedAt: '2026-03-28T14:30:00',
      resolved: false,
      assignedTo: 'Pao',
      previousStatus: 'pending_review',
    },
  ]);

  const handleAddRemark = (comment: string, attachments?: ReworkAttachment[]) => {
    setOpsRemarks(prev => [...prev, {
      id: `opr-${Date.now()}`,
      comment,
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
      attachments,
    }]);
  };

  const handleReworkResolve = (entryId: string) => {
    setOpsReworkHistory(prev => prev.map(e =>
      e.id === entryId ? { ...e, resolved: true, resolvedBy: 'Current User', resolvedAt: new Date().toISOString() } : e
    ));
  };

  const handleReworkReassign = (entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => {
    setOpsReworkHistory(prev => {
      const updated = prev.map(e =>
        e.id === entryId ? { ...e, resolved: true, resolvedBy: 'Current User (Reassigned)', resolvedAt: new Date().toISOString() } : e
      );
      const config = mockReworkConfigs.find(c => c.id === newReasonId);
      const newEntry: PolicyReworkEntry = {
        id: `opw-${Date.now()}`,
        reasonId: newReasonId,
        reasonLabel: config?.descriptionEn || newReasonId,
        details,
        attachments,
        savedBy: 'Current User',
        savedAt: new Date().toISOString(),
        resolved: false,
        assignedTo: 'Unassigned',
        previousStatus: 'pending_review',
      };
      return [...updated, newEntry];
    });
  };

  const handleAddRework = (policyId: string, reasonId: string, details: string, attachments: ReworkAttachment[], autoResolveDate?: string) => {
    const config = mockReworkConfigs.find(c => c.id === reasonId);
    const newEntry: PolicyReworkEntry = {
      id: `opw-${Date.now()}`,
      reasonId,
      reasonLabel: config?.descriptionEn || reasonId,
      details,
      attachments,
      savedBy: 'Current User',
      savedAt: new Date().toISOString(),
      resolved: false,
      assignedTo: 'Unassigned',
      autoResolveDate,
      previousStatus: 'pending_review',
    };
    setOpsReworkHistory(prev => [...prev, newEntry]);
  };

  const handleToast = (msg: string) => {
    toast.success(msg, {
      description: language === 'th' ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต' : 'This will connect to the real system.',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — identical to motor policy */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center justify-end px-6 py-3">
          {/* Page-specific actions (left of divider) */}
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {/* Divider separates page actions from global cluster (notifications, language, etc.) */}
          <div className="mx-3 h-6 w-px bg-border" aria-hidden />
          {/* Global cluster */}
          <div className="flex items-center gap-3">
            <MentionNotificationBell />
            <LanguageToggle />
          </div>
        </div>
      </header>


      {/* 4-Step Stepper — hidden for now, to be brought back later */}
      {/* <StepperBar currentStep={currentStep} onStepClick={setCurrentStep} /> */}

      {/* Step 4: Two-column layout */}
      {mode === 'B' && (
        <div className="flex-1 overflow-y-auto px-6 py-4 w-full">
          {/* Detail bar spans full width */}
          <SaleDetailBar
            sale={sale}
            hasActiveRework={false}
            onOpenUploadPolicy={() => setUploadPolicyOpen(true)}
            onOpenHistoryLog={() => setHistorySidebarOpen(true)}
            onOpenEndorsement={() => handleToast(language === 'th' ? 'เปิด Record Endorsement' : 'Open Record Endorsement')}
            onOpenUploadDoc={() => handleToast(language === 'th' ? 'เปิด Upload Document' : 'Open Upload Document')}
          />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
            {/* Left column: Agent Overview + Policy Status */}
            <div className="lg:col-span-1 space-y-4 bg-card rounded-lg p-3 border border-border">
              <AgentDetailsCard sale={sale} />
              <PolicyStatusCard sale={sale} onPolicyStatusChange={handlePolicyStatusChange} />
              <PaymentStatusCard sale={sale} />
              <KycCard sale={sale} />
              <DownloadsCard />
              <HistoryCard />
            </div>
            {/* Right column: Content Tabs */}
            <div className="lg:col-span-4 bg-card rounded-lg p-4 border border-border">
              <ContentTabs sale={sale} />
          </div>
          </div>
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
        sale={sale}
        open={uploadPolicyOpen}
        onOpenChange={setUploadPolicyOpen}
      />

      {/* Remarks & Rework Sidesheet (shared component — Section 8/14) */}
      <PolicyRemarksReworkDialog
        open={historySidebarOpen}
        onOpenChange={setHistorySidebarOpen}
        policyKind={historySidebarPolicyKind}
        onPolicyKindChange={setHistorySidebarPolicyKind}
        availablePolicies={sale.policies.map(p => p.kind)}
        policyId="ops-vmi-1"
        leadNumber={sale.qqId}
        remarks={opsRemarks}
        reworkHistory={opsReworkHistory}
        reworkConfigs={mockReworkConfigs}
        currentStage="to_issue"
        onAddRemark={handleAddRemark}
        onReworkResolve={handleReworkResolve}
        onReworkReassign={handleReworkReassign}
        onAddRework={handleAddRework}
      />
    </div>
  );
}
