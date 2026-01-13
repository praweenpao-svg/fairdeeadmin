import { useState } from 'react';
import { Search, Home } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { PipelineStage, LeadType, Lead, ReworkConfig } from '@/types/pipeline';
import { mockLeads, mockReworkConfigs } from '@/data/mockLeads';
import { PipelineTabs, getLeadsForStage } from '@/components/pipeline/PipelineTabs';
import { LeadsTable } from '@/components/pipeline/LeadsTable';
import { DateRangeFilter } from '@/components/pipeline/DateRangeFilter';
import { AllFiltersPanel, FilterState, defaultFilterState } from '@/components/pipeline/AllFiltersPanel';
import { OtherStagesFilterPanel, OtherStagesFilterState, defaultOtherStagesFilterState } from '@/components/pipeline/OtherStagesFilterPanel';
import { FilterChips } from '@/components/pipeline/FilterChips';
import { Input } from '@/components/ui/input';

const Index = () => {
  const [activeStage, setActiveStage] = useState<PipelineStage>('to_pay');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [reworkConfigs, setReworkConfigs] = useState<ReworkConfig[]>(mockReworkConfigs);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Filters for To Pay stage
  const [toPayFilters, setToPayFilters] = useState<FilterState>(defaultFilterState);
  
  // Filters for other stages (To Report, To Issue, To Deliver, Completed)
  const [otherStagesFilters, setOtherStagesFilters] = useState<OtherStagesFilterState>(defaultOtherStagesFilterState);

  const handleLeadUpdate = (leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, ...updates } : lead
      )
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
      setToPayFilters({ ...toPayFilters, leadType: 'new_leads' });
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

  // Determine lead type filter based on stage
  const getLeadTypeFilter = (): LeadType | undefined => {
    if (activeStage === 'to_pay') {
      return toPayFilters.leadType as LeadType;
    }
    // For other stages, if 'all' selected or multiple, return undefined (show all)
    if (otherStagesFilters.leadTypes.includes('all') || otherStagesFilters.leadTypes.length === 0) {
      return undefined;
    }
    // Return first selected if single selection
    if (otherStagesFilters.leadTypes.length === 1) {
      return otherStagesFilters.leadTypes[0] as LeadType;
    }
    return undefined;
  };

  const filteredLeads = getLeadsForStage(leads, activeStage);
  const leadTypeFilter = getLeadTypeFilter();

  const isToPayStage = activeStage === 'to_pay';

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
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          {isToPayStage ? (
            <AllFiltersPanel
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

          {/* Filter Chips - only for To Pay stage for now */}
          {isToPayStage && (
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
          leadTypeFilter={leadTypeFilter}
          reworkConfigs={reworkConfigs}
          onLeadUpdate={handleLeadUpdate}
        />
      </div>
    </>
  );
};

export default Index;
