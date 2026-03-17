import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StaffTimingTable } from '@/components/staff/StaffTimingTable';
import { TeamListTable } from '@/components/staff/TeamListTable';

const StaffTiming = () => {
  return (
    <div className="p-6">
      <Tabs defaultValue="staff" className="w-full">
        <TabsList>
          <TabsTrigger value="staff">Staff List</TabsTrigger>
          <TabsTrigger value="teams">Team List</TabsTrigger>
        </TabsList>
        <TabsContent value="staff">
          <StaffTimingTable />
        </TabsContent>
        <TabsContent value="teams">
          <TeamListTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffTiming;
