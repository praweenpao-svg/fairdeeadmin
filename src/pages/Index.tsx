import { useState } from 'react';
import { Search, Filter, Home } from 'lucide-react';
import { PipelineStage, LeadType, Lead, ReworkConfig } from '@/types/pipeline';
import { mockLeads, mockReworkConfigs } from '@/data/mockLeads';
import { PipelineTabs, getLeadsForStage } from '@/components/pipeline/PipelineTabs';
import { LeadTypeFilter } from '@/components/pipeline/LeadTypeFilter';
import { LeadsTable } from '@/components/pipeline/LeadsTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeStage, setActiveStage] = useState<PipelineStage>('to_pay');
  const [leadTypeFilter, setLeadTypeFilter] = useState<LeadType>('new_leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [reworkConfigs, setReworkConfigs] = useState<ReworkConfig[]>(mockReworkConfigs);

  const handleLeadUpdate = (leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, ...updates } : lead
      )
    );
  };

  const filteredLeads = getLeadsForStage(leads, activeStage);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </div>
        </div>

        {/* Pipeline Tabs */}
        <PipelineTabs
          activeStage={activeStage}
          onStageChange={setActiveStage}
          leads={leads}
        />
      </header>

      {/* Content */}
      <div className="p-6">
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
          reworkConfigs={reworkConfigs}
          onLeadUpdate={handleLeadUpdate}
        />
      </div>
    </>
  );
};

export default Index;
