import { useState } from 'react';
import { ReworkConfig } from '@/types/pipeline';
import { mockReworkConfigs } from '@/data/mockLeads';
import { ReworkConsoleTable } from '@/components/rework/ReworkConsoleTable';

const ReworkConsole = () => {
  const [reworkConfigs, setReworkConfigs] = useState<ReworkConfig[]>(mockReworkConfigs);

  return (
    <div className="p-6">
      <ReworkConsoleTable 
        reworkConfigs={reworkConfigs} 
        onUpdate={setReworkConfigs} 
      />
    </div>
  );
};

export default ReworkConsole;
