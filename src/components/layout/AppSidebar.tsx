import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Car,
  PanelLeftClose,
  PanelLeft,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => path === location.pathname;

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
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
              isActive
                ? 'text-sidebar-foreground bg-sidebar-accent'
                : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
            )
          }
        >
          <Car className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Motor Policy</span>}
        </NavLink>
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
