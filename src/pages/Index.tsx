import { useState, useMemo } from 'react';
import { Search, Home } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { PipelineStage, LeadType, Lead, ReworkConfig } from '@/types/pipeline';
import { mockLeads, mockReworkConfigs, CURRENT_USER } from '@/data/mockLeads';
import { PipelineTabs, getLeadsForStage, getLeadsOwnedByUser, getLeadsOwnedByTeam } from '@/components/pipeline/PipelineTabs';
import { LeadsTable } from '@/components/pipeline/LeadsTable';
import { DateRangeFilter } from '@/components/pipeline/DateRangeFilter';
import { AllFiltersPanel, FilterState, defaultFilterState } from '@/components/pipeline/AllFiltersPanel';
import { OtherStagesFilterPanel, OtherStagesFilterState, defaultOtherStagesFilterState } from '@/components/pipeline/OtherStagesFilterPanel';
import { LeadsStageFilters, LeadsFilterState, defaultLeadsFilterState } from '@/components/pipeline/LeadsStageFilters';
import { FilterChips } from '@/components/pipeline/FilterChips';
import { LeadSubTabs, LeadSubTab } from '@/components/pipeline/LeadSubTabs';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageStore } from '@/stores/languageStore';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { applyAllFilters } from '@/utils/leadFilters';
import { MentionNotificationBell } from '@/components/notifications/MentionNotificationBell';
import { mockStaffMembers } from '@/data/mockStaff';

const Index = () => {
  const { language } = useLanguageStore();
  const [activeStage, setActiveStage] = useState<PipelineStage>('to_convert');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [reworkConfigs, setReworkConfigs] = useState<ReworkConfig[]>(mockReworkConfigs);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [myCasesOnly, setMyCasesOnly] = useState(false);
  const [myTeamOnly, setMyTeamOnly] = useState(false);
  
  // Sub-tab for Leads stage (New Leads / COA / Renewals)
  const [leadSubTab, setLeadSubTab] = useState<LeadSubTab>('new_leads');
  
  // Filters for To Pay stage and All/To Convert (shared filter state + UI)
  const [toPayFilters, setToPayFilters] = useState<FilterState>(defaultFilterState);

  // Filters specifically for Leads (to_convert) stage
  const [leadsFilters, setLeadsFilters] = useState<LeadsFilterState>(defaultLeadsFilterState);

  // Filters for other stages (To Report, To Issue, To Deliver, Completed)
  const [otherStagesFilters, setOtherStagesFilters] = useState<OtherStagesFilterState>(defaultOtherStagesFilterState);

  // Get current user's team members
  const currentUserStaff = mockStaffMembers.find(s => s.name === CURRENT_USER);
  const currentUserTeam = currentUserStaff?.team;
  const teamMembers = useMemo(() => {
    if (!currentUserTeam) return [];
    return mockStaffMembers
      .filter(s => s.team === currentUserTeam)
      .map(s => s.name);
  }, [currentUserTeam]);

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
    if (leadSubTab === 'new_leads') {
      // 'New Leads' sub-tab includes both new_leads and coa lead types
      stageLeads = stageLeads.filter(lead => lead.leadType === 'new_leads' || lead.leadType === 'coa');
    } else {
      // 'Renewals' sub-tab only includes renewals
      stageLeads = stageLeads.filter(lead => lead.leadType === 'renewals');
    }
  }
  
  // Apply My Cases filter
  const casesFilteredLeads = myCasesOnly
    ? getLeadsOwnedByUser(leads, activeStage, CURRENT_USER)
    : stageLeads;
  
  // Apply My Team filter - use proper owner logic from PipelineTabs
  const teamFilteredLeads = myTeamOnly
    ? getLeadsOwnedByTeam(casesFilteredLeads, activeStage, teamMembers)
    : casesFilteredLeads;
  
  // Apply all filters (search, date, panel filters)
  const filteredLeads = applyAllFilters(
    teamFilteredLeads,
    searchQuery,
    dateRange,
    toPayFilters,
    otherStagesFilters,
    isToPayStage,
    activeStage,
    leadsFilters
  );


  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Home className="w-4 h-4" />
            <span className="text-sm">{language === 'th' ? 'หน้าหลัก' : 'Home'}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'th' ? 'ค้นหา' : 'Search'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <MentionNotificationBell />
            <LanguageToggle />
          </div>
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
          
          {/* Leads stage specific inline filters */}
          {activeStage === 'to_convert' ? (
            <LeadsStageFilters
              filters={leadsFilters}
              onFiltersChange={setLeadsFilters}
              onClear={() => setLeadsFilters(defaultLeadsFilterState)}
              myCasesOnly={myCasesOnly}
              myTeamOnly={myTeamOnly}
              onMyCasesChange={setMyCasesOnly}
              onMyTeamChange={setMyTeamOnly}
            />
          ) : (
            <>
              {/* My Cases / My Team buttons for other stages */}
              <button
                onClick={() => setMyCasesOnly(!myCasesOnly)}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors border',
                  myCasesOnly
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-foreground border-border hover:bg-muted hover:border-primary/50'
                )}
              >
                {language === 'th' ? 'เคสของฉัน' : 'My Cases'}
              </button>
              
              <button
                onClick={() => setMyTeamOnly(!myTeamOnly)}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors border',
                  myTeamOnly
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-foreground border-border hover:bg-muted hover:border-primary/50'
                )}
              >
                {language === 'th' ? 'ทีมของฉัน' : 'My Team'}
              </button>
            </>
          )}
          
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          {/* Filter panels for non-Leads stages */}
          {activeStage !== 'to_convert' && (
            activeStage === 'all' || activeStage === 'to_pay' ? (
              <OtherStagesFilterPanel
                filters={otherStagesFilters}
                onFiltersChange={setOtherStagesFilters}
                onClear={handleClearOtherStagesFilters}
              />
            ) : (
              <OtherStagesFilterPanel
                filters={otherStagesFilters}
                onFiltersChange={setOtherStagesFilters}
                onClear={handleClearOtherStagesFilters}
              />
            )
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
