import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReworkPartyType } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';

// Minimal shape required to render — works for both ReworkConfig and ReworkReason.
export interface SearchableReasonOption {
  id: string;
  descriptionEn: string;
  descriptionTh: string;
  partyType: ReworkPartyType;
}

interface SearchableReasonSelectProps {
  configs: SearchableReasonOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function SearchableReasonSelect({
  configs,
  value,
  onValueChange,
  placeholder,
  className,
  triggerClassName,
}: SearchableReasonSelectProps) {
  const { language } = useLanguageStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder = language === 'th' ? 'เลือกเหตุผล' : 'Select reason';
  const searchPlaceholder = language === 'th' ? 'ค้นหาเหตุผล...' : 'Search reason...';

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const getLabel = (config: SearchableReasonOption) =>
    language === 'th' ? config.descriptionTh : config.descriptionEn;

  const selectedConfig = configs.find(c => c.id === value);
  const displayLabel = selectedConfig ? getLabel(selectedConfig) : '';

  // Filter by search
  const filtered = configs.filter(c => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    return (
      c.descriptionTh.toLowerCase().includes(lowerSearch) ||
      c.descriptionEn.toLowerCase().includes(lowerSearch)
    );
  });

  const internal = filtered.filter(c => c.partyType === 'internal');
  const external = filtered.filter(c => c.partyType === 'external');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal text-xs h-8',
            !value && 'text-muted-foreground',
            triggerClassName
          )}
        >
          <span className="truncate">
            {displayLabel || placeholder || defaultPlaceholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('p-0 w-[480px]', className)} align="start" side="bottom" sideOffset={4}>
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex h-6 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ScrollArea className="h-[280px]">
          <div className="p-1">
          {internal.length === 0 && external.length === 0 && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              {language === 'th' ? 'ไม่พบผลลัพธ์' : 'No results found'}
            </div>
          )}
          {external.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground tracking-wide">
                {language === 'th'
                  ? 'ใช้สำหรับ OPS และตัวแทน (ตัวแทนจะเห็นข้อมูลดังกล่าว)'
                  : 'OPS and agent (agent will see this)'}
              </div>
              {external.map(config => (
                <button
                  key={config.id}
                  onClick={() => {
                    onValueChange(config.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground truncate',
                    value === config.id && 'bg-accent'
                  )}
                >
                  {value === config.id && (
                    <Check className="absolute left-2 h-3 w-3" />
                  )}
                  <span className="truncate" title={getLabel(config)}>{getLabel(config)}</span>
                </button>
              ))}
            </>
          )}
          {internal.length > 0 && (
            <>
              <div className={cn(
                'px-2 py-1.5 text-[10px] font-semibold text-muted-foreground tracking-wide',
                external.length > 0 && 'border-t mt-1'
              )}>
                {language === 'th'
                  ? 'ใช้สำหรับ OPS เท่านั้น (ตัวแทนจะไม่เห็นข้อมูลดังกล่าว)'
                  : 'OPS only (agent will not see this)'}
              </div>
              {internal.map(config => (
                <button
                  key={config.id}
                  onClick={() => {
                    onValueChange(config.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground truncate',
                    value === config.id && 'bg-accent'
                  )}
                >
                  {value === config.id && (
                    <Check className="absolute left-2 h-3 w-3" />
                  )}
                  <span className="truncate" title={getLabel(config)}>{getLabel(config)}</span>
                </button>
              ))}
            </>
          )}
        </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
