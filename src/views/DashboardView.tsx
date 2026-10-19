import React from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Plus,
  RefreshCw,
  Sliders,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  parseLocalDate,
  formatDateString,
  getRemainingTimeText,
  formatDateTime,
  getDayName,
} from '../utils/dateUtils';
import { PriorityLevel } from '../types';

export const DashboardView: React.FC = () => {
  const {
    tasks,
    activeCollisions,
    openAddTask,
    toggleTaskComplete,
    setActiveTab,
    openEditTask,
    openCollisionDetails,
    scanCollisions,
    isScanningCollisions,
    settings,
  } = useApp();

  const now = new Date();

  // Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;

  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'Completed') return false;
    return parseLocalDate(t.deadline).getTime() < now.getTime();
  }).length;

  const upcomingDeadlines = tasks
    .filter((t) => {
      if (t.status === 'Completed') return false;
      const hours = (parseLocalDate(t.deadline).getTime() - now.getTime()) / (1000 * 60 * 60);
      return hours >= 0 && hours <= 72; // next 3 days
    })
    .sort((a, b) => parseLocalDate(a.deadline).getTime() - parseLocalDate(b.deadline).getTime());

  // Priority distribution counts
  const priorityCounts: Record<PriorityLevel, number> = {
    Critical: tasks.filter((t) => t.priority === 'Critical').length,
    High: tasks.filter((t) => t.priority === 'High').length,
    Medium: tasks.filter((t) => t.priority === 'Medium').length,
    Low: tasks.filter((t) => t.priority === 'Low').length,
  };

  // Weekly Workload Data (next 7 days starting today)
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = formatDateString(d);
    const dayLabel = i === 0 ? 'Today' : getDayName(d);

    // Sum estimated duration of tasks due on this date
    const tasksDue = tasks.filter(
      (t) => t.status !== 'Completed' && formatDateString(parseLocalDate(t.deadline)) === dateStr
    );
    const totalHours = tasksDue.reduce((sum, t) => sum + t.estimatedDuration, 0);

    return {
      date: dateStr,
      dayLabel,
      hours: Math.round(totalHours * 10) / 10,
      taskCount: tasksDue.length,
      isWorkingDay: settings.workingDays.includes(d.getDay()),
    };
  });

  const maxWorkloadHours = Math.max(
    settings.dailyWorkingHours * 1.5,
    ...next7Days.map((d) => d.hours),
    8
  );

  // Completion percentage
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Quick Actions Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Workload & Collision Monitor
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time heuristic evaluation across {pendingTasks} pending tasks and {settings.dailyWorkingHours}h daily capacity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => scanCollisions()}
            disabled={isScanningCollisions}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningCollisions ? 'animate-spin text-blue-600' : ''}`} />
            <span>Scan Collisions</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Smart Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Open Calendar</span>
          </button>

          <button
            onClick={() => openAddTask()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Task</span>
          </button>
        </div>
      </div>

      {/* 6 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Tasks</span>
            <CheckSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalTasks}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">all logged assignments</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Tasks</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {pendingTasks}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">active workloads</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {completedTasks}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {completionPercentage}% complete
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Overdue Tasks</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              overdueTasks > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {overdueTasks}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {overdueTasks > 0 ? 'requires immediate action' : 'zero overdue'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Due &lt; 72h</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {upcomingDeadlines.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">near horizon</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Collisions</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                activeCollisions.length > 0 ? 'text-red-600' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              activeCollisions.length > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {activeCollisions.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {activeCollisions.length > 0 ? 'active clashes' : 'no conflicts'}
          </div>
        </div>
      </div>

      {/* Main Grid: Collisions & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Collision Alerts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Deadline Collision Alerts
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('collisions')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
              >
                View all ({activeCollisions.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeCollisions.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-800">
                  Zero Deadline Collisions Detected
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your current deadlines are spaced within your {settings.dailyWorkingHours}h daily capacity without critical overlaps.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCollisions.slice(0, 3).map((col) => {
                  const severityStyle =
                    col.severity === 'Critical'
                      ? 'border-red-200 bg-red-50/20'
                      : col.severity === 'High'
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-blue-200 bg-blue-50/20';

                  return (
                    <div
                      key={col.id}
                      onClick={() => openCollisionDetails(col)}
                      className={`p-4 rounded-xl border ${severityStyle} hover:shadow-xs transition-all cursor-pointer`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                              col.severity === 'Critical'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : col.severity === 'High'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}
                          >
                            {col.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {col.title}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono tabular-nums shrink-0">
                          {col.affectedDates.join(', ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5">
                        {col.explanation}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/50">
                        <div className="flex items-center gap-3 font-mono">
                          <span>Workload: {col.totalWorkloadHours}h</span>
                          <span>·</span>
                          <span>Capacity: {col.availableWorkingHours}h</span>
                          {col.overloadHours > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-red-600 font-semibold">
                                +{col.overloadHours}h overload
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-blue-600 font-medium text-[11px]">
                          Inspect details →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Workload Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Workload Distribution</h3>
                <p className="text-xs text-slate-500">
                  Daily estimated hours due vs daily capacity limit ({settings.dailyWorkingHours}h)
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Next 7 Days</span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="pt-2">
              <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-3 px-2">
                {next7Days.map((d, idx) => {
                  const heightPercent = Math.min(100, (d.hours / maxWorkloadHours) * 100);
                  const isOverCapacity = d.hours > settings.dailyWorkingHours;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      {/* Tooltip on hover */}
                      <span className="text-[10px] font-mono text-slate-600 tabular-nums mb-1 font-semibold group-hover:scale-110 transition-transform">
                        {d.hours > 0 ? `${d.hours}h` : '-'}
                      </span>

                      {/* Bar */}
                      <div className="w-full max-w-[42px] bg-slate-100 rounded-t-md h-32 flex items-end overflow-hidden relative">
                        {/* Daily Limit Line */}
                        <div
                          className="absolute w-full border-t border-dashed border-slate-400 z-10 pointer-events-none"
                          style={{
                            bottom: `${(settings.dailyWorkingHours / maxWorkloadHours) * 100}%`,
                          }}
                          title={`Limit: ${settings.dailyWorkingHours}h`}
                        />

                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isOverCapacity
                              ? 'bg-red-500 group-hover:bg-red-600'
                              : d.hours > 0
                              ? 'bg-blue-600 group-hover:bg-blue-700'
                              : 'bg-transparent'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* Day Label */}
                      <span className="text-[11px] font-medium text-slate-600 mt-2 truncate w-full text-center">
                        {d.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-blue-600" />
                  <span>Workload &le; Capacity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-red-500" />
                  <span>Overload Conflict</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
                  <span>Daily Cap ({settings.dailyWorkingHours}h)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines & Priority Distribution (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h3>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
              >
                View all tasks <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active tasks due in the next 72 hours.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.slice(0, 5).map((t) => {
                  const remaining = getRemainingTimeText(t.deadline, now);
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-3 bg-white"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={t.status === 'Completed'}
                          onChange={() => toggleTaskComplete(t.id)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p
                            onClick={() => openEditTask(t)}
                            className="text-xs font-semibold text-slate-900 truncate hover:text-blue-600 cursor-pointer"
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>{t.category}</span>
                            <span>·</span>
                            <span>{t.estimatedDuration}h</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span
                          className={`text-xs font-mono tabular-nums font-semibold ${
                            remaining.isOverdue
                              ? 'text-red-600'
                              : remaining.hoursRemaining <= 24
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {remaining.text}
                        </span>
                        <span
                          className={`text-[10px] font-medium ${
                            t.priority === 'Critical'
                              ? 'text-red-600'
                              : t.priority === 'High'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority Distribution Donut / Progress */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Priority Distribution
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Critical Priority', count: priorityCounts.Critical, color: 'bg-red-500' },
                { label: 'High Priority', count: priorityCounts.High, color: 'bg-amber-500' },
                { label: 'Medium Priority', count: priorityCounts.Medium, color: 'bg-blue-500' },
                { label: 'Low Priority', count: priorityCounts.Low, color: 'bg-slate-400' },
              ].map((item) => {
                const pct = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
                      <span className="font-medium">{item.label}</span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {item.count} tasks ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Productivity Overview bar */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-700 mb-1.5">
                <span className="font-semibold text-slate-900">Total Completion Progress</span>
                <span className="font-mono tabular-nums font-bold text-blue-600">
                  {completionPercentage}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
                <div
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{ width: `${100 - completionPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>{completedTasks} completed</span>
                <span>{pendingTasks} remaining</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
