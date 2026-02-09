import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';

// Combined sub-tab type: 'new_leads' now includes both new_leads and coa
export type LeadSubTab = 'new_leads' | 'renewals';

interface LeadSubTabsProps {
  activeSubTab: LeadSubTab;
  onSubTabChange: (subTab: LeadSubTab) => void;
}

const subTabTranslations = {
  new_leads: { en: 'New Leads', th: 'งานใหม่' },
  renewals: { en: 'Renewals', th: 'งานต่ออายุ' },
} as const;

const subTabs: LeadSubTab[] = ['new_leads', 'renewals'];

export function LeadSubTabs({ activeSubTab, onSubTabChange }: LeadSubTabsProps) {
  const { language } = useLanguageStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {subTabs.map((subTab) => (
        <button
          key={subTab}
          onClick={() => onSubTabChange(subTab)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            activeSubTab === subTab
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
        >
          {subTabTranslations[subTab][language]}
        </button>
      ))}
    </div>
  );
}
