import React, { useMemo } from 'react';
import {
  BarChart3,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { parseLocalDate, formatDateString } from '../utils/dateUtils';
import { PriorityLevel, CollisionType } from '../types';

export const AnalyticsView: React.FC = () => {
  const {
    tasks,
    collisions,
    settings,
    exportTasksCsv,
    exportCollisionsCsv,
  } = useApp();

  const now = new Date();

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;

  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'Completed') return false;
    return parseLocalDate(t.deadline).getTime() < now.getTime();
  }).length;

  // On-time completion calculation
  const completedWithDeadline = tasks.filter((t) => t.status === 'Completed');
  const onTimeCompleted = completedWithDeadline.filter((t) => {
    const updated = new Date(t.updatedAt).getTime();
    const deadline = parseLocalDate(t.deadline).getTime();
    return updated <= deadline;
  }).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const onTimeRate =
    completedWithDeadline.length > 0
      ? Math.round((onTimeCompleted / completedWithDeadline.length) * 100)
      : 100;

  // Total estimated hours
  const totalHours = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
  const remainingHours = tasks
    .filter((t) => t.status !== 'Completed')
    .reduce((sum, t) => sum + t.estimatedDuration, 0);

  // Average workload per day in warning horizon
  const avgWorkloadPerDay =
    settings.warningWindowDays > 0
      ? Math.round((remainingHours / settings.warningWindowDays) * 10) / 10
      : 0;

  // Category Workload Distribution
  const categoryStats = useMemo(() => {
    const map = new Map<string, { hours: number; count: number }>();
    tasks.forEach((t) => {
      const current = map.get(t.category) || { hours: 0, count: 0 };
      current.hours += t.estimatedDuration;
      current.count += 1;
      map.set(t.category, current);
    });

    return Array.from(map.entries())
      .map(([cat, data]) => ({
        category: cat,
        hours: Math.round(data.hours * 10) / 10,
        count: data.count,
        percent: totalHours > 0 ? Math.round((data.hours / totalHours) * 100) : 0,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [tasks, totalHours]);

  // Collision Frequency by Type
  const collisionTypeStats = useMemo(() => {
    const counts: Record<CollisionType, number> = {
      'Same-Deadline': 0,
      'Workload-Overload': 0,
      'Priority-Clash': 0,
      'Time-Overlap': 0,
      'Back-To-Back': 0,
    };
    collisions.forEach((c) => {
      if (counts[c.collisionType] !== undefined) {
        counts[c.collisionType]++;
      }
    });
    return counts;
  }, [collisions]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Academic & Workload Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical metrics on deadline adherence, workload dispersion, conflict hotspots, and velocity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportTasksCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Tasks CSV</span>
          </button>

          <button
            onClick={exportCollisionsCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Collision Report</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Overall Completion Rate
          </span>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {completionRate}%
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {completedTasks} of {totalTasks} tasks finished
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            On-Time Delivery Rate
          </span>
          <div className="text-3xl font-bold text-emerald-600 font-mono tabular-nums">
            {onTimeRate}%
          </div>
          <span className="text-xs text-slate-500 mt-1 block">delivered prior to cut-off</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Avg Daily Workload ({settings.warningWindowDays}d horizon)
          </span>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {avgWorkloadPerDay}h
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            against {settings.dailyWorkingHours}h capacity limit
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Active Collision Frequency
          </span>
          <div
            className={`text-3xl font-bold font-mono tabular-nums ${
              collisions.filter((c) => !c.resolved).length > 0
                ? 'text-red-600'
                : 'text-emerald-600'
            }`}
          >
            {collisions.filter((c) => !c.resolved).length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {collisions.length} total historical
          </span>
        </div>
      </div>

      {/* Main Charts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Workload by Subject / Project</h3>
              <p className="text-xs text-slate-500">Distribution of estimated hours across domains</p>
            </div>
            <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
              {Math.round(totalHours * 10) / 10}h total
            </span>
          </div>

          <div className="space-y-3.5">
            {categoryStats.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">{item.category}</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {item.hours}h · {item.count} tasks ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collision Type Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Collision Root Cause Diagnostics</h3>
              <p className="text-xs text-slate-500">Incident count categorized by conflict heuristic</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3">
            {[
              {
                type: 'Same-Deadline' as CollisionType,
                label: 'Same-Day Deadline Clusters',
                desc: 'Tasks due on the same calendar day exceeding daily capacity.',
                count: collisionTypeStats['Same-Deadline'],
              },
              {
                type: 'Workload-Overload' as CollisionType,
                label: 'Cumulative Workload Deficit',
                desc: 'Sum of required study hours exceeds calendar hours before milestone.',
                count: collisionTypeStats['Workload-Overload'],
              },
              {
                type: 'Priority-Clash' as CollisionType,
                label: 'High-Stakes Priority Friction',
                desc: 'Multiple Critical/High tasks due within 48h inducing mental fatigue.',
                count: collisionTypeStats['Priority-Clash'],
              },
              {
                type: 'Back-To-Back' as CollisionType,
                label: 'Back-to-Back Deadline Exhaustion',
                desc: 'Demanding assignments separated by less than the required recovery buffer.',
                count: collisionTypeStats['Back-To-Back'],
              },
              {
                type: 'Time-Overlap' as CollisionType,
                label: 'Scheduled Slot Overlap',
                desc: 'Direct calendar clash between planned execution slots.',
                count: collisionTypeStats['Time-Overlap'],
              },
            ].map((colRule) => (
              <div
                key={colRule.type}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 block">{colRule.label}</span>
                  <p className="text-slate-500 text-[11px] leading-snug mt-0.5">
                    {colRule.desc}
                  </p>
                </div>
                <span
                  className={`font-mono tabular-nums font-bold px-2.5 py-1 rounded-md text-xs shrink-0 ${
                    colRule.count > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {colRule.count} detected
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
