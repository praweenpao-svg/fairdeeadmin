import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { ChatwootQuotationTabs } from '@/components/ops/ChatwootQuotationTabs';
import { useLanguageStore } from '@/stores/languageStore';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MentionNotificationBell } from '@/components/notifications/MentionNotificationBell';
import { mockSaleDetail } from '@/data/mockSaleDetail';
import { PolicyStatusCard, AgentDetailsCard, InsurerDetailsCard, PriceDetailsCard, CommissionDetailsCard, ActionStatusCard, DownloadsCard, HistoryCard } from '@/components/ops/SaleOverviewCard';
import { ContentTabs } from '@/components/ops/ContentTabs';
import { SaleDetailBar } from '@/components/ops/SaleDetailBar';
import { UploadPolicyModal } from '@/components/ops/UploadPolicyModal';
import { OpsLogicProvider } from '@/components/ops/OpsLogicContext';
import { DevLogicControllerFab } from '@/components/ops/DevLogicControllerFab';
import { UpdateSaleDialog } from '@/components/ops/UpdateSaleDialog';
import { UploadDocumentsModal } from '@/components/ops/UploadDocumentsModal';
import { PolicyRemarksReworkDialog } from '@/components/pipeline/PolicyRemarksReworkDialog';
import { useHistoryStore } from '@/stores/historyStore';
import { toast } from 'sonner';
import { mockReworkConfigs } from '@/data/mockLeads';
import { PolicyRemark, PolicyReworkEntry, ReworkAttachment } from '@/types/pipeline';

// Stepper / wizard scaffolding removed — Step 4 two-column layout is now the only mode.

export default function OpsDashboard() {
  const { language } = useLanguageStore();
  const [searchParams] = useSearchParams();
  const isChatwoot = searchParams.get('mode') === 'chatwoot';
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

  // Step 2 completion → auto-advance VMI & CMI from "pending" to "pending_review"
  React.useEffect(() => {
    const handler = () => {
      const pendingKinds: string[] = [];
      setSale(prev => ({
        ...prev,
        policies: prev.policies.map(p => {
          if (p.status === 'pending' || p.status === 'pending_payment') {
            pendingKinds.push(p.kind);
            return { ...p, status: 'pending_review' };
          }
          return p;
        }),
      }));
      const labelMap: Record<string, string> = { vmi: 'VMI', cmi: 'CMI' };
      pendingKinds.forEach(kind => {
        useHistoryStore.getState().add({
          type: 'status_change',
          policyKind: kind as 'vmi' | 'cmi',
          description: `${labelMap[kind]} → Pending Review (Step 2 completed)`,
        });
      });
      toast.success(language === 'th' ? `Sale ID ${sale.qqId} ถูกสร้างเรียบร้อย` : `Sale ID ${sale.qqId} has been created`, {
        description: language === 'th' ? 'VMI / CMI → รอตรวจสอบ' : 'VMI / CMI advanced to Pending Review',
      });
    };
    window.addEventListener('ops:step2Completed', handler);
    return () => window.removeEventListener('ops:step2Completed', handler);
  }, [sale.qqId, language]);

  // Modal / sidebar states
  const [uploadPolicyOpen, setUploadPolicyOpen] = useState(false);
  const [uploadDocumentsOpen, setUploadDocumentsOpen] = useState(false);
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
  const [opsReworkHistory, setOpsReworkHistory] = useState<PolicyReworkEntry[]>([]);

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

  const handleReworkReassign = (entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[], postResolutionOwner?: string) => {
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
        assignedTo: config?.assignment === 'specific' ? (postResolutionOwner || 'Unassigned') : 'Unassigned',
        previousStatus: 'pending_review',
      };
      return [...updated, newEntry];
    });
  };

  const handleAddRework = (policyId: string, reasonId: string, details: string, attachments: ReworkAttachment[], autoResolveDate?: string, postResolutionOwner?: string) => {
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
      assignedTo: config?.assignment === 'specific' ? (postResolutionOwner || 'Unassigned') : 'Unassigned',
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
          {/* Global cluster */}
          <div className="flex items-center gap-3">
            <MentionNotificationBell />
            <LanguageToggle />
          </div>
        </div>
      </header>


      {/* Two-column layout */}
      <div className="flex-1 overflow-y-auto px-6 py-4 w-full">
        {isChatwoot && <ChatwootQuotationTabs activeQuotationId={`q-${sale.qqId}`} />}
        <SaleDetailBar
          sale={sale}
          hasActiveRework={opsReworkHistory.some(e => !e.resolved)}
          hasActiveEndorsement={false}
          onOpenUploadPolicy={() => setUploadPolicyOpen(true)}
          onOpenHistoryLog={() => setHistorySidebarOpen(true)}
          onOpenEndorsement={() => window.dispatchEvent(new Event('ops:openUpdateSale'))}
          onOpenUploadDoc={() => setUploadDocumentsOpen(true)}
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
          {/* Left column: Action Status first, then sale context */}
          <div className="lg:col-span-1 space-y-3 bg-card rounded-lg p-4 border border-border">
            <ActionStatusCard sale={sale} onPolicyStatusChange={handlePolicyStatusChange} />
            <AgentDetailsCard sale={sale} />
            <InsurerDetailsCard sale={sale} />
            <PriceDetailsCard sale={sale} />
            <CommissionDetailsCard sale={sale} />
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

      {/* Update Sale dialog (Pass 3) — opens via 'ops:openUpdateSale' event */}
      <UpdateSaleDialog sale={sale} onSaleChange={setSale} />

      {/* Upload Documents modal (Pass 5) — Internal vs External split */}
      <UploadDocumentsModal open={uploadDocumentsOpen} onOpenChange={setUploadDocumentsOpen} />

      {/* Dev-only Logic Controller (prototype tool) */}
      <DevLogicControllerFab />
    </div>
    </OpsLogicProvider>
  );
}
