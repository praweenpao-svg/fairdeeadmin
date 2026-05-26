import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockStaffMembers } from '@/data/mockStaff';
import { useLanguageStore } from '@/stores/languageStore';

interface SearchableStaffSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
}

export function SearchableStaffSelect({
  value,
  onValueChange,
  placeholder,
  triggerClassName,
}: SearchableStaffSelectProps) {
  const { language } = useLanguageStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder = language === 'th' ? '— ยังไม่เลือก —' : '— Unselected —';
  const searchPlaceholder = language === 'th' ? 'ค้นหาพนักงาน...' : 'Search staff...';

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = mockStaffMembers.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.team || '').toLowerCase().includes(q);
  });

  const selected = mockStaffMembers.find(s => s.name === value);

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
            {selected ? `${selected.name}${selected.team ? ` — ${selected.team}` : ''}` : (placeholder || defaultPlaceholder)}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px] z-[60]" align="start" side="bottom" sideOffset={4}>
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
        <ScrollArea className="h-[260px]">
          <div className="p-1">
            <button
              onClick={() => { onValueChange(''); setOpen(false); }}
              className={cn(
                'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground',
                !value && 'bg-accent'
              )}
            >
              {!value && <Check className="absolute left-2 h-3 w-3" />}
              <span className="text-muted-foreground">{defaultPlaceholder}</span>
            </button>
            {filtered.length === 0 && (
              <div className="py-4 text-center text-xs text-muted-foreground">
                {language === 'th' ? 'ไม่พบผลลัพธ์' : 'No results found'}
              </div>
            )}
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => { onValueChange(s.name); setOpen(false); }}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm py-1.5 pl-7 pr-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground',
                  value === s.name && 'bg-accent'
                )}
              >
                {value === s.name && <Check className="absolute left-2 h-3 w-3" />}
                <span className="truncate">{s.name}</span>
                {s.team && <span className="text-muted-foreground ml-2">{s.team}</span>}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
