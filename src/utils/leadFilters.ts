import { Lead } from '@/types/pipeline';
import { FilterState } from '@/components/pipeline/AllFiltersPanel';
import { OtherStagesFilterState } from '@/components/pipeline/OtherStagesFilterPanel';
import { LeadsFilterState } from '@/components/pipeline/LeadsStageFilters';
import { mockStaffMembers } from '@/data/mockStaff';
import { DateRange } from 'react-day-picker';
import { parse, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// Get staff name by ID
function getStaffNameById(id: string): string | undefined {
  const staff = mockStaffMembers.find(s => s.id === id);
  return staff?.name;
}

// Parse date string (DD-MM-YYYY format) to Date
function parseLeadDate(dateStr: string): Date | null {
  try {
    return parse(dateStr, 'dd-MM-yyyy', new Date());
  } catch {
    return null;
  }
}

// Apply search filter
export function applySearchFilter(leads: Lead[], query: string): Lead[] {
  if (!query.trim()) return leads;
  
  const lowerQuery = query.toLowerCase().trim();
  return leads.filter(lead => 
    lead.leadNumber.toLowerCase().includes(lowerQuery) ||
    lead.agentId.toLowerCase().includes(lowerQuery) ||
    lead.agentName.toLowerCase().includes(lowerQuery) ||
    lead.vehicleDetails?.toLowerCase().includes(lowerQuery) ||
    lead.rfAssignee?.toLowerCase().includes(lowerQuery) ||
    lead.scAssignee?.toLowerCase().includes(lowerQuery) ||
    lead.deAssignee?.toLowerCase().includes(lowerQuery)
  );
}

// Apply date range filter
export function applyDateRangeFilter(leads: Lead[], dateRange: DateRange | undefined): Lead[] {
  if (!dateRange?.from) return leads;
  
  return leads.filter(lead => {
    const leadDate = parseLeadDate(lead.createdOn);
    if (!leadDate) return true;
    
    const from = startOfDay(dateRange.from!);
    const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
    
    return isWithinInterval(leadDate, { start: from, end: to });
  });
}

// Apply filters used by the All/To Convert/To Pay filter panel
export function applyToPayFilters(
  leads: Lead[],
  filters: FilterState,
  stage: 'all' | 'to_convert' | 'to_pay'
): Lead[] {
  const isToConvertLead = (lead: Lead) => {
    return (
      ['new_leads', 'coa', 'renewals'].includes(lead.leadType) &&
      lead.paymentStatus === 'unpaid' &&
      ['pending', 'docs_missing', 'waiting_for_insurer', 'partially_added', 'completed', 'quotation_shared', 'invalid'].includes(lead.saleStatus)
    );
  };

  return leads.filter((lead) => {
    // Status filter
    if (filters.status !== 'all' && lead.saleStatus !== filters.status) {
      return false;
    }

    // RF Assignee filter (uses staff ID, need to match by name)
    if (filters.rfAssignee !== 'all') {
      const staffName = getStaffNameById(filters.rfAssignee);
      if (staffName && lead.rfAssignee !== staffName) {
        return false;
      }
    }

    // SC Assignee filter
    if (filters.scAssignee !== 'all') {
      const staffName = getStaffNameById(filters.scAssignee);
      if (staffName && lead.scAssignee !== staffName) {
        return false;
      }
    }

    // DE Assignee filter
    if (filters.deAssignee !== 'all') {
      const staffName = getStaffNameById(filters.deAssignee);
      if (staffName && lead.deAssignee !== staffName) {
        return false;
      }
    }

    // Agent filter
    if (filters.agent !== 'all' && lead.agentId !== filters.agent) {
      return false;
    }

    // Lead Type (stage-specific)
    if (stage === 'to_pay') {
      if (filters.leadType !== 'all' && lead.leadType !== filters.leadType) {
        return false;
      }
    }

    if (stage === 'to_convert') {
      // No lead-type toggle/filter in To Convert
    }

    if (stage === 'all') {
      if (filters.leadType !== 'all') {
        if (filters.leadType === 'sales') {
          // Sales = anything post To Convert
          if (isToConvertLead(lead)) return false;
        } else {
          // New Leads / COA / Renewals = unconverted leads (To Convert bucket)
          if (!isToConvertLead(lead)) return false;
          if (lead.leadType !== filters.leadType) return false;
        }
      }
    }

    // Created By filter
    if (filters.createdBy !== 'all' && lead.createdBy !== filters.createdBy) {
      return false;
    }

    // Installment Type filter
    if (filters.installmentType !== 'all') {
      const isInstallment = lead.paymentType === 'installment';
      if (filters.installmentType === 'installment' && !isInstallment) {
        return false;
      }
      if (filters.installmentType === 'non_installment' && isInstallment) {
        return false;
      }
    }

    return true;
  });
}

// Apply Other Stages filters (To Report, To Issue, To Deliver, Completed)
export function applyOtherStagesFilters(leads: Lead[], filters: OtherStagesFilterState): Lead[] {
  return leads.filter(lead => {
    // RF Assignee filter
    if (filters.rfAssignee !== 'all') {
      const staffName = getStaffNameById(filters.rfAssignee);
      if (staffName && lead.rfAssignee !== staffName) {
        return false;
      }
    }
    
    // SC Assignee filter
    if (filters.scAssignee !== 'all') {
      const staffName = getStaffNameById(filters.scAssignee);
      if (staffName && lead.scAssignee !== staffName) {
        return false;
      }
    }
    
    // DE Assignee filter
    if (filters.deAssignee !== 'all') {
      const staffName = getStaffNameById(filters.deAssignee);
      if (staffName && lead.deAssignee !== staffName) {
        return false;
      }
    }
    
    // Agent filter
    if (filters.agent !== 'all' && lead.agentId !== filters.agent) {
      return false;
    }
    
    // Payment Status filter
    if (filters.paymentStatus !== 'all' && lead.paymentStatus !== filters.paymentStatus) {
      return false;
    }
    
    // Lead Types filter (multi-select)
    if (!filters.leadTypes.includes('all') && filters.leadTypes.length > 0) {
      if (!filters.leadTypes.includes(lead.leadType)) {
        return false;
      }
    }
    
    // Installment Type filter
    if (filters.installmentType !== 'all') {
      const isInstallment = lead.paymentType === 'installment';
      if (filters.installmentType === 'installment' && !isInstallment) {
        return false;
      }
      if (filters.installmentType === 'non_installment' && isInstallment) {
        return false;
      }
    }
    
    return true;
  });
}

// Apply Leads stage filters (to_convert)
export function applyLeadsStageFilters(leads: Lead[], filters: LeadsFilterState): Lead[] {
  return leads.filter(lead => {
    // Lead Status filter (multi-select)
    if (!filters.leadStatuses.includes('all') && filters.leadStatuses.length > 0) {
      if (!filters.leadStatuses.includes(lead.saleStatus)) {
        return false;
      }
    }

    // Agent filter
    if (filters.agent !== 'all' && lead.agentId !== filters.agent) {
      return false;
    }

    // RF Assignee filter
    if (filters.rfAssignee !== 'all') {
      const staffName = getStaffNameById(filters.rfAssignee);
      if (staffName && lead.rfAssignee !== staffName) {
        return false;
      }
    }

    // SC Assignee filter
    if (filters.scAssignee !== 'all') {
      const staffName = getStaffNameById(filters.scAssignee);
      if (staffName && lead.scAssignee !== staffName) {
        return false;
      }
    }

    // Owner filter is handled separately via myCasesOnly/myTeamOnly props

    // Created By filter (multi-select)
    if (!filters.createdBy.includes('all') && filters.createdBy.length > 0) {
      if (!filters.createdBy.includes(lead.createdBy)) {
        return false;
      }
    }

    // Leads Type filter (multi-select: system, custom, coa)
    if (!filters.leadsTypes.includes('all') && filters.leadsTypes.length > 0) {
      // Map lead properties to filter values
      let leadTypeValue: string;
      if (lead.leadType === 'coa') {
        leadTypeValue = 'coa';
      } else if (lead.leadSource === 'system') {
        leadTypeValue = 'system';
      } else if (lead.leadSource === 'custom') {
        leadTypeValue = 'custom';
      } else {
        leadTypeValue = 'system'; // Default
      }
      
      if (!filters.leadsTypes.includes(leadTypeValue)) {
        return false;
      }
    }

    // ETA Status filter (multi-select)
    if (!filters.etaStatuses.includes('all') && filters.etaStatuses.length > 0) {
      // Check if any insurer quote matches the ETA status filter
      const hasMatchingEta = lead.insurerQuotes?.some(quote => {
        if (filters.etaStatuses.includes('on_time') && quote.etaStatus === 'on_time') return true;
        if (filters.etaStatuses.includes('breached') && quote.etaStatus === 'breached') return true;
        return false;
      });
      
      // If no insurer quotes or none match, filter out (unless lead has no quotes)
      if (lead.insurerQuotes && lead.insurerQuotes.length > 0 && !hasMatchingEta) {
        return false;
      }
    }

    // Insurer Status and Agent Type are kept visible but not functional per user request

    return true;
  });
}

// Combined filter function
export function applyAllFilters(
  leads: Lead[],
  searchQuery: string,
  dateRange: DateRange | undefined,
  toPayFilters: FilterState,
  otherStagesFilters: OtherStagesFilterState,
  isToPayStage: boolean,
  activeStage: 'all' | 'to_convert' | 'to_pay' | 'to_report' | 'to_issue' | 'to_deliver' | 'completed' | 'cancelled',
  leadsFilters?: LeadsFilterState
): Lead[] {
  let result = leads;
  
  // Apply search
  result = applySearchFilter(result, searchQuery);
  
  // Apply date range
  result = applyDateRangeFilter(result, dateRange);
  
  // Apply stage-specific filters
  if (activeStage === 'to_convert' && leadsFilters) {
    result = applyLeadsStageFilters(result, leadsFilters);
  } else if (activeStage === 'all' || activeStage === 'to_pay') {
    result = applyToPayFilters(result, toPayFilters, activeStage);
  } else {
    result = applyOtherStagesFilters(result, otherStagesFilters);
  }
  
  return result;
}
