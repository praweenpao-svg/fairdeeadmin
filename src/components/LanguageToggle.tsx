import { useLanguageStore } from '@/stores/languageStore';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { language, toggle } = useLanguageStore();

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
    >
      <span
        className={cn(
          'px-1.5 py-0.5 rounded transition-colors',
          language === 'th' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
        )}
      >
        TH
      </span>
      <span
        className={cn(
          'px-1.5 py-0.5 rounded transition-colors',
          language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
        )}
      >
        EN
      </span>
    </button>
  );
}
