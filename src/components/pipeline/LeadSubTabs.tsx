import { cn } from '@/lib/utils';
import { LeadType } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';

export type LeadSubTab = LeadType;

interface LeadSubTabsProps {
  activeSubTab: LeadSubTab;
  onSubTabChange: (subTab: LeadSubTab) => void;
}

const subTabTranslations = {
  new_leads: { en: 'New Leads', th: 'ลูกค้าใหม่' },
  coa: { en: 'COA', th: 'COA' },
  renewals: { en: 'Renewals', th: 'ต่ออายุ' },
} as const;

const subTabs: LeadSubTab[] = ['new_leads', 'coa', 'renewals'];

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
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
        >
          {subTabTranslations[subTab][language]}
        </button>
      ))}
    </div>
  );
}
