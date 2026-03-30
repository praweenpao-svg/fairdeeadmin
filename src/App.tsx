import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppSidebar } from '@/components/layout/AppSidebar';
import { cn } from '@/lib/utils';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MentionNotificationBell } from '@/components/notifications/MentionNotificationBell';
import Index from "./pages/Index";
import StaffTiming from "./pages/StaffTiming";
import ReworkConsole from "./pages/ReworkConsole";
import OpsDashboard from "./pages/OpsDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        {/* Global top bar with bell + language toggle */}
        <div className="sticky top-0 z-30 bg-card border-b border-border flex items-center justify-end px-6 py-2">
          <div className="flex items-center gap-3">
            <MentionNotificationBell />
            <LanguageToggle />
          </div>
        </div>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/staff-timing" element={<StaffTiming />} />
          <Route path="/rework-console" element={<ReworkConsole />} />
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
