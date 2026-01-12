import { cn } from '@/lib/utils';
import { PaymentType } from '@/types/pipeline';

interface PaymentTypeToggleProps {
  activeType: PaymentType;
  onTypeChange: (type: PaymentType) => void;
}

export function PaymentTypeToggle({ activeType, onTypeChange }: PaymentTypeToggleProps) {
  return (
    <div className="flex items-center border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => onTypeChange('full')}
        className={cn(
          'px-4 py-2 text-sm font-medium transition-colors',
          activeType === 'full'
            ? 'bg-foreground text-background'
            : 'bg-background text-foreground hover:bg-muted'
        )}
      >
        Full Payment
      </button>
      <button
        onClick={() => onTypeChange('installment')}
        className={cn(
          'px-4 py-2 text-sm font-medium transition-colors border-l border-border',
          activeType === 'installment'
            ? 'bg-foreground text-background'
            : 'bg-background text-foreground hover:bg-muted'
        )}
      >
        Installment
      </button>
    </div>
  );
}
