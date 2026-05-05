import { NavLink, useLocation } from 'react-router-dom';
import {
  Car,
  Clock,
  PanelLeftClose,
  PanelLeft,
  Settings2,
  LayoutDashboard,
  Check,
  ChevronUp,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { useCurrentUserStore } from '@/stores/currentUserStore';
import { mockStaffMembers } from '@/data/mockStaff';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { 
    to: '/', 
    icon: Car, 
    label: { en: 'Motor Policy', th: 'กรมธรรม์รถยนต์' }
  },
  { 
    to: '/staff-timing', 
    icon: Clock, 
    label: { en: 'Staff Timing', th: 'เวลาทำงานพนักงาน' }
  },
  { 
    to: '/rework-admin', 
    icon: Settings2, 
    label: { en: 'Rework Admin', th: 'จัดการ Rework' }
  },
  { 
    to: '/ops-dashboard', 
    icon: LayoutDashboard, 
    label: { en: 'OPS Dashboard', th: 'OPS Dashboard' }
  },
];

// Group staff by team
const teamGroups = ['AST RF', 'AST SC', 'DE', 'Admin'];

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { language } = useLanguageStore();
  const { name: currentUser, team: currentTeam, setUser } = useCurrentUserStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-foreground text-background transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-background/20">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">FD</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm">Admin</h1>
              <p className="text-xs text-background/60">v2.0</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-background/10 transition-colors"
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                isActive
                  ? 'text-background bg-background/15'
                  : 'text-background/60 hover:text-background hover:bg-background/10'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label[language]}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer - Profile Switcher */}
      <div className="border-t border-background/20 p-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 w-full rounded-md p-1.5 hover:bg-background/10 transition-colors cursor-pointer",
              collapsed && "justify-center"
            )}>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">{currentUser[0]}</span>
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{currentUser}</p>
                    <p className="text-xs text-background/60">{currentTeam || 'admin'}</p>
                  </div>
                  <ChevronUp className="w-4 h-4 text-background/60 shrink-0" />
                </>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[220px] p-2 bg-card z-50" 
            align="start" 
            side="top"
            sideOffset={8}
          >
            <div className="text-xs font-semibold text-muted-foreground px-2 pb-1.5">
              {language === 'th' ? 'เปลี่ยนโปรไฟล์' : 'Switch Profile'}
            </div>
            <div className="max-h-[320px] overflow-auto scrollbar-thin space-y-2">
              {teamGroups.map((team) => {
                const members = mockStaffMembers.filter(s => s.team === team);
                return (
                  <div key={team}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2 py-1">
                      {team}
                    </div>
                    {members.map((staff) => (
                      <div
                        key={staff.id}
                        className={cn(
                          "flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm",
                          currentUser === staff.name && "bg-primary/10"
                        )}
                        onClick={() => setUser(staff.name)}
                      >
                        <Check className={cn("mr-2 h-3.5 w-3.5 shrink-0", currentUser === staff.name ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{staff.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}
