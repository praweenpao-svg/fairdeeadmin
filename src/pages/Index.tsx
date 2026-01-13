import { useState } from 'react';
import { Search, Home } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { PipelineStage, LeadType, Lead, ReworkConfig } from '@/types/pipeline';
import { mockLeads, mockReworkConfigs } from '@/data/mockLeads';
import { PipelineTabs, getLeadsForStage } from '@/components/pipeline/PipelineTabs';
import { LeadTypeFilter } from '@/components/pipeline/LeadTypeFilter';
import { LeadsTable } from '@/components/pipeline/LeadsTable';
import { DateRangeFilter } from '@/components/pipeline/DateRangeFilter';
import { AllFiltersPanel, FilterState, defaultFilterState } from '@/components/pipeline/AllFiltersPanel';
import { FilterChips } from '@/components/pipeline/FilterChips';
import { Input } from '@/components/ui/input';

const Index = () => {
  const [activeStage, setActiveStage] = useState<PipelineStage>('to_pay');
  const [leadTypeFilter, setLeadTypeFilter] = useState<LeadType>('new_leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [reworkConfigs, setReworkConfigs] = useState<ReworkConfig[]>(mockReworkConfigs);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);

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

  const handleRemoveFilter = (key: keyof FilterState, value?: string) => {
    if (key === 'agentTypes' && value) {
      setFilters({
        ...filters,
        agentTypes: filters.agentTypes.filter(t => t !== value),
      });
    } else if (key === 'leadsType') {
      setFilters({ ...filters, leadsType: 'all' });
    } else if (key === 'createdBy') {
      setFilters({ ...filters, createdBy: 'all' });
    } else if (key === 'status') {
      setFilters({ ...filters, status: 'all' });
    } else {
      setFilters({ ...filters, [key]: '' });
    }
  };

  const handleClearFilters = () => {
    setFilters(defaultFilterState);
    setDateRange(undefined);
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
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
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
          
          <AllFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
          />

          {/* Filter Chips */}
          <FilterChips
            dateRange={dateRange}
            filters={filters}
            onRemoveDateRange={handleRemoveDateRange}
            onRemoveFilter={handleRemoveFilter}
          />
        </div>

        {/* Lead Type Filter Row */}
        <div className="flex items-center justify-end mb-6">
          <LeadTypeFilter
            activeType={leadTypeFilter}
            onTypeChange={setLeadTypeFilter}
          />
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
