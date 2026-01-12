import { Home } from 'lucide-react';
import { StaffTimingTable } from '@/components/staff/StaffTimingTable';

const StaffTiming = () => {
  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-muted-foreground mb-6">
        <Home className="w-4 h-4" />
        <span className="text-sm">Home</span>
        <span className="text-sm">/</span>
        <span className="text-sm text-foreground">Staff Timing</span>
      </div>

      <StaffTimingTable />
    </div>
  );
};

export default StaffTiming;
