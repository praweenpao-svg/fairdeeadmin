import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReworkConfig } from '@/types/pipeline';
import { mockReworkConfigs } from '@/data/mockLeads';
import { ReworkConsoleTable } from '@/components/rework/ReworkConsoleTable';
import ReworkReasons from './ReworkReasons';

export default function ReworkAdmin() {
  const [reworkConfigs, setReworkConfigs] = useState<ReworkConfig[]>(mockReworkConfigs);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'config' ? 'config' : 'reasons';

  return (
    <div className="p-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="reasons">Rework Reasons</TabsTrigger>
          <TabsTrigger value="config">Assignment Config</TabsTrigger>
        </TabsList>
        <TabsContent value="reasons">
          <ReworkReasons />
        </TabsContent>
        <TabsContent value="config">
          <ReworkConsoleTable reworkConfigs={reworkConfigs} onUpdate={setReworkConfigs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
