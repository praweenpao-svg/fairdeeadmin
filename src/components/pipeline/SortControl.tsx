import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export type SortField = 'createdOn' | 'updatedOn';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface SortControlProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

export function SortControl({ sortConfig, onSortChange }: SortControlProps) {
  const handleFieldChange = (field: SortField) => {
    onSortChange({ ...sortConfig, field });
  };

  const handleDirectionToggle = () => {
    onSortChange({
      ...sortConfig,
      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select value={sortConfig.field} onValueChange={(v) => handleFieldChange(v as SortField)}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdOn">Created On</SelectItem>
          <SelectItem value="updatedOn">Latest Updated On</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDirectionToggle}
        className="h-9 px-3"
      >
        {sortConfig.direction === 'asc' ? (
          <>
            <ArrowUp className="h-4 w-4 mr-1" />
            Asc
          </>
        ) : (
          <>
            <ArrowDown className="h-4 w-4 mr-1" />
            Desc
          </>
        )}
      </Button>
    </div>
  );
}
