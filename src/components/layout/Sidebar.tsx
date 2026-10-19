import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  AlertTriangle,
  Clock,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveNavPage } from '../../types';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { activeTab, setActiveTab, activeCollisions, tasks } = useApp();

  const incompleteTasksCount = tasks.filter((t) => t.status !== 'Completed').length;
  const criticalCollisionsCount = activeCollisions.filter((c) => c.severity === 'Critical').length;

  const navItems: Array<{
    id: ActiveNavPage;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeCritical?: boolean;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: incompleteTasksCount },
    { id: 'calendar', label: 'Deadline Calendar', icon: Calendar },
    {
      id: 'collisions',
      label: 'Collision Detector',
      icon: AlertTriangle,
      badge: activeCollisions.length,
      badgeCritical: criticalCollisionsCount > 0,
    },
    { id: 'schedule', label: 'Smart Schedule', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: ActiveNavPage) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">
                  Deadline Collision
                </span>
                <span className="text-xs text-slate-500 font-medium truncate">
                  Optimization Engine
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Badges */}
                {!isCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`ml-auto px-2 py-0.5 text-xs font-mono tabular-nums rounded-md ${
                      item.badgeCritical
                        ? 'bg-red-100 text-red-700 font-bold'
                        : isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed view indicator dot/badge */}
                {isCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      item.badgeCritical ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {!isCollapsed ? (
            <div className="px-2 py-2 rounded-lg bg-white border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium text-slate-700">Horizon Status</span>
                <span className="font-mono text-slate-600">Active</span>
              </div>
              <div className="text-xs text-slate-500">
                {activeCollisions.length > 0 ? (
                  <span className="text-amber-700 font-medium">
                    {activeCollisions.length} conflict{activeCollisions.length > 1 ? 's' : ''} detected
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">No collisions detected</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div
                className={`w-3 h-3 rounded-full ${
                  activeCollisions.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                title={activeCollisions.length > 0 ? 'Collisions detected' : 'Schedule optimal'}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
