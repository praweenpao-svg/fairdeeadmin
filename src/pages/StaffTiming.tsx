import { Home } from 'lucide-react';
import { StaffTimingTable } from '@/components/staff/StaffTimingTable';

const StaffTiming = () => {
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
            <span className="text-sm">/</span>
            <span className="text-sm text-foreground">Staff Timing</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        <StaffTimingTable />
      </div>
    </>
  );
};

export default StaffTiming;
