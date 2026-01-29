import { useState } from 'react';
import { Search, Home } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { PipelineStage, LeadType, Lead, ReworkConfig } from '@/types/pipeline';
import { mockLeads, mockReworkConfigs, CURRENT_USER } from '@/data/mockLeads';
import { PipelineTabs, getLeadsForStage, getLeadsOwnedByUser } from '@/components/pipeline/PipelineTabs';
import { LeadsTable } from '@/components/pipeline/LeadsTable';
import { DateRangeFilter } from '@/components/pipeline/DateRangeFilter';
import { AllFiltersPanel, FilterState, defaultFilterState } from '@/components/pipeline/AllFiltersPanel';
import { OtherStagesFilterPanel, OtherStagesFilterState, defaultOtherStagesFilterState } from '@/components/pipeline/OtherStagesFilterPanel';
import { FilterChips } from '@/components/pipeline/FilterChips';
import { LeadSubTabs, LeadSubTab } from '@/components/pipeline/LeadSubTabs';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { applyAllFilters } from '@/utils/leadFilters';

const Index = () => {
  const [activeStage, setActiveStage] = useState<PipelineStage>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [reworkConfigs, setReworkConfigs] = useState<ReworkConfig[]>(mockReworkConfigs);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [myCasesOnly, setMyCasesOnly] = useState(true);
  
  // Sub-tab for Leads stage (New Leads / COA / Renewals)
  const [leadSubTab, setLeadSubTab] = useState<LeadSubTab>('new_leads');
  
  // Filters for To Pay stage and All/To Convert (shared filter state + UI)
  const [toPayFilters, setToPayFilters] = useState<FilterState>(defaultFilterState);

  // Filters for other stages (To Report, To Issue, To Deliver, Completed)
  const [otherStagesFilters, setOtherStagesFilters] = useState<OtherStagesFilterState>(defaultOtherStagesFilterState);

  // "All", "To Convert", and "To Pay" stages use the full filter panel
  const useAllFiltersPanel = activeStage === 'all' || activeStage === 'to_convert' || activeStage === 'to_pay';
  const isToPayStage = activeStage === 'to_pay';

  const handleLeadUpdate = (leadId: string, updates: Partial<Lead>) => {
    // Generate current timestamp in DD-MM-YYYY HH:MM format
    const now = new Date();
    const updatedOn = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, ...updates, updatedOn } : lead))
    );
  };

  const handleRemoveDateRange = () => {
    setDateRange(undefined);
  };

  const handleRemoveToPayFilter = (key: keyof FilterState, value?: string) => {
    if (key === 'agentTypes' && value) {
      setToPayFilters({
        ...toPayFilters,
        agentTypes: toPayFilters.agentTypes.filter(t => t !== value),
      });
    } else if (key === 'leadsType') {
      setToPayFilters({ ...toPayFilters, leadsType: 'all' });
    } else if (key === 'createdBy') {
      setToPayFilters({ ...toPayFilters, createdBy: 'all' });
    } else if (key === 'status') {
      setToPayFilters({ ...toPayFilters, status: 'all' });
    } else if (key === 'leadType') {
      setToPayFilters({ ...toPayFilters, leadType: 'all' });
    } else if (key === 'installmentType') {
      setToPayFilters({ ...toPayFilters, installmentType: 'all' });
    } else {
      setToPayFilters({ ...toPayFilters, [key]: 'all' });
    }
  };

  const handleClearToPayFilters = () => {
    setToPayFilters(defaultFilterState);
    setDateRange(undefined);
  };

  const handleClearOtherStagesFilters = () => {
    setOtherStagesFilters(defaultOtherStagesFilterState);
    setDateRange(undefined);
  };

  // Get stage leads first (by pipeline stage logic)
  let stageLeads = getLeadsForStage(leads, activeStage);
  
  // Apply sub-tab filter for Leads stage
  if (activeStage === 'to_convert') {
    stageLeads = stageLeads.filter(lead => lead.leadType === leadSubTab);
  }
  
  // Apply My Cases filter
  const casesFilteredLeads = myCasesOnly
    ? getLeadsOwnedByUser(leads, activeStage, CURRENT_USER)
    : stageLeads;
  
  // Apply all filters (search, date, panel filters)
  const filteredLeads = applyAllFilters(
    casesFilteredLeads,
    searchQuery,
    dateRange,
    toPayFilters,
    otherStagesFilters,
    isToPayStage,
    activeStage
  );


  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </div>
          <LanguageToggle />
        </div>

        {/* Pipeline Tabs */}
        <PipelineTabs
          activeStage={activeStage}
          onStageChange={setActiveStage}
          leads={leads}
          myCasesOnly={myCasesOnly}
        />
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Lead Sub-tabs for Leads stage */}
          {activeStage === 'to_convert' && (
            <LeadSubTabs
              activeSubTab={leadSubTab}
              onSubTabChange={setLeadSubTab}
            />
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          
          {/* My Cases Toggle */}
          <button
            onClick={() => setMyCasesOnly(!myCasesOnly)}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors border',
              myCasesOnly
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-foreground border-border hover:bg-muted hover:border-primary/50'
            )}
          >
            My Cases
          </button>
          
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          {useAllFiltersPanel ? (
            <AllFiltersPanel
              stage={activeStage}
              filters={toPayFilters}
              onFiltersChange={setToPayFilters}
              onClear={handleClearToPayFilters}
            />
          ) : (
            <OtherStagesFilterPanel
              filters={otherStagesFilters}
              onFiltersChange={setOtherStagesFilters}
              onClear={handleClearOtherStagesFilters}
            />
          )}

          {/* Filter Chips - for All and To Pay stages */}
          {useAllFiltersPanel && (
            <FilterChips
              dateRange={dateRange}
              filters={toPayFilters}
              onRemoveDateRange={handleRemoveDateRange}
              onRemoveFilter={handleRemoveToPayFilter}
            />
          )}
        </div>

        {/* Table */}
        <LeadsTable
          leads={filteredLeads}
          stage={activeStage}
          reworkConfigs={reworkConfigs}
          onLeadUpdate={handleLeadUpdate}
        />
      </div>
    </>
  );
};

export default Index;
