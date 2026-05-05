import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MentionNotificationBell } from '@/components/notifications/MentionNotificationBell';
import { mockSaleDetail } from '@/data/mockSaleDetail';
import { PolicyStatusCard, AgentDetailsCard, PaymentStatusCard, KycCard, DownloadsCard, HistoryCard } from '@/components/ops/SaleOverviewCard';
import { ContentTabs } from '@/components/ops/ContentTabs';
import { SaleDetailBar } from '@/components/ops/SaleDetailBar';
import { UploadPolicyModal } from '@/components/ops/UploadPolicyModal';
import { OpsLogicProvider } from '@/components/ops/OpsLogicContext';
import { DevLogicControllerFab } from '@/components/ops/DevLogicControllerFab';
import { PolicyRemarksReworkDialog } from '@/components/pipeline/PolicyRemarksReworkDialog';
import { useHistoryStore } from '@/stores/historyStore';
import { toast } from 'sonner';
import { mockReworkConfigs } from '@/data/mockLeads';
import { PolicyRemark, PolicyReworkEntry, ReworkAttachment } from '@/types/pipeline';

// Stepper / wizard scaffolding removed — Step 4 two-column layout is now the only mode.

export default function OpsDashboard() {
  const { language } = useLanguageStore();
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
    <OpsLogicProvider sale={sale}>
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


      {/* Two-column layout */}
      <div className="flex-1 overflow-y-auto px-6 py-4 w-full">
        <SaleDetailBar
          sale={sale}
          hasActiveRework={false}
          onOpenUploadPolicy={() => setUploadPolicyOpen(true)}
          onOpenHistoryLog={() => setHistorySidebarOpen(true)}
          onOpenEndorsement={() => handleToast(language === 'th' ? 'เปิดอัปเดตการขาย' : 'Open Update Sale')}
          onOpenUploadDoc={() => handleToast(language === 'th' ? 'เปิด Upload Document' : 'Open Upload Document')}
          onAdvanceVmiStatus={(next, actionLabel) => {
            handlePolicyStatusChange('vmi', next);
            const labelMap: Record<string, string> = {
              pending_review: 'Pending Review',
              pending_issuance: 'Pending Issuance',
            };
            useHistoryStore.getState().add({
              type: 'status_change',
              policyKind: 'vmi',
              description: `VMI → ${labelMap[next] || next} (via ${actionLabel})`,
            });
            toast.success(actionLabel, {
              description: language === 'th' ? `VMI → ${labelMap[next] || next}` : `VMI advanced to ${labelMap[next] || next}`,
            });
          }}
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

      {/* Dev-only Logic Controller (prototype tool) */}
      <DevLogicControllerFab />
    </div>
    </OpsLogicProvider>
  );
}
