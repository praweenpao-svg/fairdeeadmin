import { useState } from 'react';
import { Search, Filter, Home } from 'lucide-react';
import { PipelineStage, LeadType, PaymentType } from '@/types/pipeline';
import { mockLeads } from '@/data/mockLeads';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PipelineTabs, getLeadsForStage } from '@/components/pipeline/PipelineTabs';
import { LeadTypeFilter } from '@/components/pipeline/LeadTypeFilter';
import { PaymentTypeToggle } from '@/components/pipeline/PaymentTypeToggle';
import { LeadsTable } from '@/components/pipeline/LeadsTable';
import { AdminReworkLog } from '@/components/pipeline/AdminReworkLog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeStage, setActiveStage] = useState<PipelineStage | 'admin_rework'>('to_pay');
  const [leadTypeFilter, setLeadTypeFilter] = useState<LeadType>('new_leads');
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads =
    activeStage === 'admin_rework'
      ? []
      : getLeadsForStage(mockLeads, activeStage).filter((lead) =>
          paymentType === 'full'
            ? lead.paymentType === 'full'
            : lead.paymentType === 'installment'
        );

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center gap-4 px-6 py-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Home className="w-4 h-4" />
              <span className="text-sm">Home</span>
            </div>
          </div>

          {/* Payment Type Toggle */}
          <div className="px-6 py-3 border-b border-border">
            <PaymentTypeToggle activeType={paymentType} onTypeChange={setPaymentType} />
          </div>

          {/* Pipeline Tabs */}
          <PipelineTabs
            activeStage={activeStage}
            onStageChange={setActiveStage}
            leads={mockLeads.filter((lead) =>
              paymentType === 'full'
                ? lead.paymentType === 'full'
                : lead.paymentType === 'installment'
            )}
            isSuperAdmin={true}
          />
        </header>

        {/* Content */}
        <div className="p-6">
          {activeStage === 'admin_rework' ? (
            <AdminReworkLog />
          ) : (
            <>
              {/* Filters */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[300px]"
                    />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter By
                  </Button>
                </div>

                {activeStage === 'to_pay' && (
                  <LeadTypeFilter
                    activeType={leadTypeFilter}
                    onTypeChange={setLeadTypeFilter}
                  />
                )}
              </div>

              {/* Table */}
              <LeadsTable
                leads={filteredLeads}
                stage={activeStage}
                leadTypeFilter={activeStage === 'to_pay' ? leadTypeFilter : undefined}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
