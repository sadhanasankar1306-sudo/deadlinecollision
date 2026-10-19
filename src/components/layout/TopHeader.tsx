import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Calendar as CalendarIcon,
  Check,
  Trash2,
  ExternalLink,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatDateString } from '../../utils/dateUtils';

interface TopHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileSidebar }) => {
  const {
    activeTab,
    searchQuery,
    setSearchQuery,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    openAddTask,
    settings,
    setActiveTab,
    openCollisionDetails,
    collisions,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'tasks':
        return 'Task Management';
      case 'calendar':
        return 'Deadline Calendar';
      case 'collisions':
        return 'Deadline Collision Detector';
      case 'schedule':
        return 'Smart Schedule Generator';
      case 'analytics':
        return 'Analytics & Workload Reports';
      case 'settings':
        return 'System & Workday Settings';
      default:
        return 'Dashboard';
    }
  };

  const currentDateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left zone: Hamburger & Page Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:block">
            Smart Deadline
          </span>
          <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center zone: Search Input */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, category, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right zone: Date, Notifications, User Menu, Add Task CTA */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg font-medium">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDateStr}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono tabular-nums animate-in fade-in">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-mono tabular-nums">
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Clear notifications"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No recent notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                        !notif.isRead ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span
                          className={`font-semibold ${
                            notif.severity === 'critical'
                              ? 'text-red-700'
                              : notif.severity === 'warning'
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0">
                          {formatDateString(new Date(notif.createdAt))}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed mb-1.5">{notif.message}</p>
                      {notif.relatedCollisionId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsNotifOpen(false);
                            const found = collisions.find(
                              (c) => c.id === notif.relatedCollisionId
                            );
                            if (found) openCollisionDetails(found);
                            else setActiveTab('collisions');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                        >
                          View Collision Report <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
            aria-label="User Profile"
          >
            <img
              src={settings.avatarUrl}
              alt={settings.userName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="hidden lg:flex flex-col pr-1">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {settings.userName}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight truncate max-w-[110px]">
                {settings.userRole.split(' ')[0]}
              </span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-semibold text-slate-900">{settings.userName}</p>
                <p className="text-[11px] text-slate-500 leading-snug">{settings.userRole}</p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md font-medium"
              >
                Workday Settings
              </button>
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md font-medium"
              >
                Productivity Analytics
              </button>
            </div>
          )}
        </div>

        {/* Primary CTA: + Add Task */}
        <button
          onClick={() => openAddTask()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs hover:shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </button>
      </div>
    </header>
  );
};
