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
    <Tabs
      value={tab}
      onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}
      className="w-full"
    >
      <TabsList className="mx-6 mt-6">
        <TabsTrigger value="reasons">Rework Reasons</TabsTrigger>
        <TabsTrigger value="config">Assignment Config</TabsTrigger>
      </TabsList>
      <TabsContent value="reasons" className="mt-0">
        <ReworkReasons />
      </TabsContent>
      <TabsContent value="config" className="mt-0">
        <div className="p-6">
          <ReworkConsoleTable reworkConfigs={reworkConfigs} onUpdate={setReworkConfigs} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
