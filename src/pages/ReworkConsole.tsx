import { useState } from 'react';
import { Home } from 'lucide-react';
import { ReworkConfig } from '@/types/pipeline';
import { mockReworkConfigs } from '@/data/mockLeads';
import { ReworkConsoleTable } from '@/components/rework/ReworkConsoleTable';

const ReworkConsole = () => {
  const [reworkConfigs, setReworkConfigs] = useState<ReworkConfig[]>(mockReworkConfigs);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
            <span className="text-sm">/</span>
            <span className="text-sm">Rework Console</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        <ReworkConsoleTable 
          reworkConfigs={reworkConfigs} 
          onUpdate={setReworkConfigs} 
        />
      </div>
    </>
  );
};

export default ReworkConsole;
