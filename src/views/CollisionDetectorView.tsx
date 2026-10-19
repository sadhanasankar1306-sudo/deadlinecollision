import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  Check,
  ChevronRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CollisionSeverity } from '../types';
import { formatDateTime } from '../utils/dateUtils';

export const CollisionDetectorView: React.FC = () => {
  const {
    collisions,
    activeCollisions,
    scanCollisions,
    isScanningCollisions,
    openCollisionDetails,
    resolveCollision,
    tasks,
    setActiveTab,
    settings,
  } = useApp();

  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Resolved'>('Active');

  const filteredCollisions = useMemo(() => {
    return collisions.filter((col) => {
      if (severityFilter !== 'All' && col.severity !== severityFilter) return false;
      if (statusFilter === 'Active' && col.resolved) return false;
      if (statusFilter === 'Resolved' && !col.resolved) return false;
      return true;
    });
  }, [collisions, severityFilter, statusFilter]);

  const criticalCount = activeCollisions.filter((c) => c.severity === 'Critical').length;
  const highCount = activeCollisions.filter((c) => c.severity === 'High').length;
  const mediumCount = activeCollisions.filter((c) => c.severity === 'Medium').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Diagnostic Engine Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 font-bold uppercase rounded-md bg-blue-50 text-blue-700 font-mono">
              Heuristic Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Window: {settings.warningWindowDays} Days · Cluster: {settings.clusterWindowHours}h
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Automated Deadline Collision Detector
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous multi-rule scanner detecting concurrent deadlines, workload deficits, priority friction, and back-to-back burnout.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => scanCollisions()}
            disabled={isScanningCollisions}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isScanningCollisions ? 'animate-spin' : ''}`}
            />
            <span>{isScanningCollisions ? 'Scanning Tasks...' : 'Scan for Collisions'}</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Generate Schedule</span>
          </button>
        </div>
      </div>

      {/* Severity Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Active Collisions</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {activeCollisions.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">requiring attention</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-red-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-red-700 mb-1">
            <span>Critical Overloads</span>
            <span className="w-2 h-2 rounded-full bg-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 font-mono tabular-nums">
            {criticalCount}
          </div>
          <span className="text-[11px] text-red-600/80 mt-0.5 block">severe capacity breach</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-amber-700 mb-1">
            <span>High Risk Clusters</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {highCount}
          </div>
          <span className="text-[11px] text-amber-600/80 mt-0.5 block">tight turnaround</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-blue-700 mb-1">
            <span>Medium Clashes</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums">
            {mediumCount}
          </div>
          <span className="text-[11px] text-blue-600/80 mt-0.5 block">manageable buffers</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Severity filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-md transition-colors ${
                severityFilter === sev
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          {(['Active', 'Resolved', 'All'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Collision Cards */}
      {filteredCollisions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            No Collisions Found in Selected Scope
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {statusFilter === 'Active'
              ? 'All current task deadlines fit smoothly within your daily working hours and buffer thresholds.'
              : 'Zero collisions match the selected criteria.'}
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => scanCollisions()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
            >
              Run Diagnostic Re-Scan
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCollisions.map((col) => {
            const affected = tasks.filter((t) => col.affectedTaskIds.includes(t.id));

            return (
              <div
                key={col.id}
                className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                  col.resolved
                    ? 'border-slate-200 opacity-70'
                    : col.severity === 'Critical'
                    ? 'border-red-200'
                    : col.severity === 'High'
                    ? 'border-amber-200'
                    : 'border-blue-200'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-md font-bold border font-mono ${
                          col.severity === 'Critical'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : col.severity === 'High'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {col.severity}
                      </span>

                      <span className="text-xs font-semibold text-slate-600 font-mono">
                        Rule: {col.collisionType}
                      </span>

                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-mono">
                        ID: {col.id.slice(0, 16)}
                      </span>

                      {col.resolved && (
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{col.title}</h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!col.resolved && (
                      <button
                        onClick={() => resolveCollision(col.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1"
                        title="Mark resolved"
                      >
                        <Check className="w-3 h-3" /> Acknowledge
                      </button>
                    )}

                    <button
                      onClick={() => openCollisionDetails(col)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      View Diagnostics <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {col.explanation}
                </p>

                {/* Metrics Breakdown Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/70 border border-slate-200/60 rounded-lg mb-4 text-center sm:text-left">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Estimated Workload</span>
                    <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                      {col.totalWorkloadHours} hours
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Available Working Hours</span>
                    <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                      {col.availableWorkingHours} hours
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Workload Overload</span>
                    <p
                      className={`text-sm font-bold font-mono tabular-nums ${
                        col.overloadHours > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {col.overloadHours > 0 ? `+${col.overloadHours}h deficit` : '0h (Within Cap)'}
                    </p>
                  </div>
                </div>

                {/* Affected Tasks List */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    Conflicting Tasks ({affected.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {affected.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                            <span>Due {formatDateTime(t.deadline)}</span>
                            <span>·</span>
                            <span>{t.estimatedDuration}h</span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            t.priority === 'Critical'
                              ? 'bg-red-50 text-red-700'
                              : t.priority === 'High'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Recommended Algorithmic Action
                  </span>
                  <p className="text-xs text-blue-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100/60 leading-relaxed">
                    {col.recommendations[0]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
