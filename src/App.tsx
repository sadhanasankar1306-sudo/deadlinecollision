/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { DashboardView } from './views/DashboardView';
import { TasksView } from './views/TasksView';
import { CalendarView } from './views/CalendarView';
import { CollisionDetectorView } from './views/CollisionDetectorView';
import { SmartScheduleView } from './views/SmartScheduleView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { TaskModal } from './components/tasks/TaskModal';
import { CollisionDetailsModal } from './components/collisions/CollisionDetailsModal';
import {
  LayoutDashboard,
  CheckSquare,
  AlertTriangle,
  Calendar,
  Clock,
} from 'lucide-react';
import { ActiveNavPage } from './types';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, activeCollisions } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      case 'collisions':
        return <CollisionDetectorView />;
      case 'schedule':
        return <SmartScheduleView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  const mobileNavItems: Array<{ id: ActiveNavPage; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'collisions', label: 'Conflicts', icon: AlertTriangle, badge: activeCollisions.length },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'schedule', label: 'Schedule', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <TopHeader onOpenMobileSidebar={() => setIsMobileOpen(true)} />

        {/* Viewport View Content */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-12">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around py-2 px-1 lg:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium relative transition-colors ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] flex items-center justify-center font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Global Modals */}
      <TaskModal />
      <CollisionDetailsModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
