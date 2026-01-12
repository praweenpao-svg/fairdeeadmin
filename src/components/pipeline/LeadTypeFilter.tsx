import { cn } from '@/lib/utils';
import { LeadType } from '@/types/pipeline';

interface LeadTypeFilterProps {
  activeType: LeadType;
  onTypeChange: (type: LeadType) => void;
}

const filterOptions: { id: LeadType; label: string }[] = [
  { id: 'new_leads', label: 'New Leads' },
  { id: 'coa', label: 'COA' },
  { id: 'renewals', label: 'Renewals' },
];

export function LeadTypeFilter({ activeType, onTypeChange }: LeadTypeFilterProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {filterOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onTypeChange(option.id)}
          className={cn(
            'filter-radio',
            activeType === option.id ? 'filter-radio-active' : 'filter-radio-inactive'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
