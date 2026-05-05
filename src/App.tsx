import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppSidebar } from '@/components/layout/AppSidebar';
import { cn } from '@/lib/utils';
import Index from "./pages/Index";
import StaffTiming from "./pages/StaffTiming";
import ReworkAdmin from "./pages/ReworkAdmin";
import OpsDashboard from "./pages/OpsDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <main
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/staff-timing" element={<StaffTiming />} />
          <Route path="/config-board" element={<ReworkAdmin />} />
          <Route path="/rework-admin" element={<ReworkAdmin />} />
          <Route path="/rework-console" element={<ReworkAdmin />} />
          <Route path="/rework-reasons" element={<ReworkAdmin />} />
          <Route path="/ops-dashboard" element={<OpsDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
