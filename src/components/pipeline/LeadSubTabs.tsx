import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { Lead } from '@/types/pipeline';
import { Badge } from '@/components/ui/badge';

// Combined sub-tab type: 'new_leads' now includes both new_leads and coa
export type LeadSubTab = 'new_leads' | 'renewals';

interface LeadSubTabsProps {
  activeSubTab: LeadSubTab;
  onSubTabChange: (subTab: LeadSubTab) => void;
  newLeadsCount?: number;
  renewalsCount?: number;
}

const subTabTranslations = {
  new_leads: { en: 'New Leads', th: 'งานใหม่' },
  renewals: { en: 'Renewals', th: 'งานต่ออายุ' },
} as const;

const subTabs: LeadSubTab[] = ['new_leads', 'renewals'];

export function LeadSubTabs({ activeSubTab, onSubTabChange, newLeadsCount = 0, renewalsCount = 0 }: LeadSubTabsProps) {
  const { language } = useLanguageStore();

  const counts: Record<LeadSubTab, number> = {
    new_leads: newLeadsCount,
    renewals: renewalsCount,
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {subTabs.map((subTab) => {
        const count = counts[subTab];
        return (
          <button
            key={subTab}
            onClick={() => onSubTabChange(subTab)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
              activeSubTab === subTab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            {subTabTranslations[subTab][language]}
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-5 min-w-5 px-1.5 text-[10px] font-semibold border-none",
                  activeSubTab === subTab
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/15 text-primary"
                )}
              >
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
