import * as React from 'react';
import { format } from 'date-fns';
import { th as thLocale } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguageStore } from '@/stores/languageStore';

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const { language } = useLanguageStore();

  const formatDate = (date: Date, fmt: string) => {
    return format(date, fmt, language === 'th' ? { locale: thLocale } : undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal gap-2",
            !dateRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {language === 'th' ? 'สร้างเมื่อ' : 'Created On'} | {formatDate(dateRange.from, "d MMM")} {language === 'th' ? 'ถึง' : 'to'} {formatDate(dateRange.to, "d MMM")}
              </>
            ) : (
              formatDate(dateRange.from, "d MMM yyyy")
            )
          ) : (
            <span>{language === 'th' ? 'สร้างเมื่อ' : 'Created On'}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card z-50" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={2}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
