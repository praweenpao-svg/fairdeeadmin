import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Calendar,
  DollarSign,
  CreditCard,
  Settings,
  ShieldCheck,
  Tag,
  FileCheck,
  Megaphone,
  Building,
  Award,
  UserCog,
  Globe,
  Home,
  PlusCircle,
  Car,
  Shield,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'Create Leads', icon: PlusCircle, path: '/create-leads' },
  { label: 'Leads', icon: FileText, path: '/leads' },
  {
    label: 'Motor Policy',
    icon: Car,
    children: [
      { label: 'Policy in Progress', path: '/' },
      { label: 'Compulsory Insurance', path: '/compulsory-insurance' },
      { label: 'Endorsement', path: '/endorsement' },
    ],
  },
  {
    label: 'Non-Motor Policy',
    icon: Shield,
    children: [
      { label: 'Health Insurance', path: '/health-insurance' },
      { label: 'Travel Insurance', path: '/travel-insurance' },
    ],
  },
  {
    label: 'Agents',
    icon: Users,
    children: [
      { label: 'Agent List', path: '/agents' },
      { label: 'Agent Performance', path: '/agent-performance' },
    ],
  },
  { label: 'Event Calendar', icon: Calendar, path: '/calendar' },
  {
    label: 'Commission',
    icon: DollarSign,
    children: [
      { label: 'Commission Report', path: '/commission-report' },
      { label: 'Payout History', path: '/payout-history' },
    ],
  },
  { label: 'Debt Collection CRM', icon: CreditCard, path: '/debt-collection' },
  {
    label: 'Accounting',
    icon: Building,
    children: [
      { label: 'Invoices', path: '/invoices' },
      { label: 'Payments', path: '/payments' },
    ],
  },
  { label: 'Price List Admin', icon: Tag, path: '/price-list' },
  { label: 'Pre Quote SLA', icon: FileCheck, path: '/pre-quote-sla' },
  { label: 'Promotion Admin', icon: Megaphone, path: '/promotions' },
  { label: 'Policy Admin', icon: ShieldCheck, path: '/policy-admin' },
  { label: 'Gamification Admin', icon: Award, path: '/gamification' },
  { label: 'Staff Management', icon: UserCog, path: '/staff' },
  { label: 'Insurer Setting', icon: Settings, path: '/insurer-settings' },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Motor Policy']);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (path?: string) => path === location.pathname;
  const isChildActive = (children?: { path: string }[]) =>
    children?.some((child) => child.path === location.pathname);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">FD</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm">Fairdee Admin</h1>
              <p className="text-xs text-sidebar-muted">v2.0</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-muted text-sm">
            <span className="text-xs">🔍</span>
            <span>Policies, affiliates, custom...</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <>
                <button
                  onClick={() => !collapsed && toggleExpand(item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    isChildActive(item.children)
                      ? 'text-sidebar-foreground bg-sidebar-accent'
                      : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {expandedItems.includes(item.label) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && expandedItems.includes(item.label) && (
                  <div className="ml-8 border-l border-sidebar-border">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            'block px-4 py-2 text-sm transition-colors',
                            isActive
                              ? 'text-primary bg-primary/10 border-l-2 border-primary -ml-[1px]'
                              : 'text-sidebar-muted hover:text-sidebar-foreground'
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path!}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'text-sidebar-foreground bg-sidebar-accent'
                      : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-xs font-medium">AB</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Akshay Bazad</p>
              <p className="text-xs text-sidebar-muted">super_admin</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 mt-3 text-sidebar-muted">
            <Globe className="w-4 h-4" />
            <span className="text-xs">English</span>
          </div>
        )}
      </div>
    </aside>
  );
}
