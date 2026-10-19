import React from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sliders,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../utils/dateUtils';

export const CollisionDetailsModal: React.FC = () => {
  const {
    viewingCollision,
    closeCollisionDetails,
    tasks,
    resolveCollision,
    setActiveTab,
    openEditTask,
  } = useApp();

  if (!viewingCollision) return null;

  const affectedTasks = tasks.filter((t) =>
    viewingCollision.affectedTaskIds.includes(t.id)
  );

  const getSeverityBadge = () => {
    switch (viewingCollision.severity) {
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${getSeverityBadge()}`}
              >
                {viewingCollision.severity} Severity
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {viewingCollision.collisionType}
              </span>
              {viewingCollision.resolved && (
                <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Resolved
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900">{viewingCollision.title}</h2>
          </div>
          <button
            onClick={closeCollisionDetails}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Explanation Box */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Diagnostic Collision Analysis
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {viewingCollision.explanation}
            </p>
          </div>

          {/* Metric Comparison Strip */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-white border border-slate-200 rounded-lg text-center">
            <div className="p-2 border-r border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">Total Workload</span>
              <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                {viewingCollision.totalWorkloadHours}h
              </span>
            </div>
            <div className="p-2 border-r border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">Available Working Hours</span>
              <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                {viewingCollision.availableWorkingHours}h
              </span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-slate-500 font-medium block">Calculated Overload</span>
              <span
                className={`text-base font-bold font-mono tabular-nums ${
                  viewingCollision.overloadHours > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {viewingCollision.overloadHours > 0 ? `+${viewingCollision.overloadHours}h deficit` : 'Balanced'}
              </span>
            </div>
          </div>

          {/* Affected Tasks */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-2">
              Affected Tasks ({affectedTasks.length})
            </h4>
            <div className="space-y-2">
              {affectedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {t.title}
                      </span>
                      <span className="text-[11px] text-slate-500">· {t.category}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>Due: {formatDateTime(t.deadline)}</span>
                      <span>·</span>
                      <span>{t.estimatedDuration}h effort</span>
                      <span>·</span>
                      <span
                        className={
                          t.priority === 'Critical'
                            ? 'text-red-600 font-semibold'
                            : t.priority === 'High'
                            ? 'text-amber-600 font-semibold'
                            : 'text-slate-600'
                        }
                      >
                        {t.priority}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      closeCollisionDetails();
                      openEditTask(t);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors shrink-0"
                  >
                    Adjust
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Algorithmic Recommendations */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Actionable Resolution Steps
            </h4>
            <ul className="space-y-2">
              {viewingCollision.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100/60"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            {!viewingCollision.resolved ? (
              <button
                onClick={() => {
                  resolveCollision(viewingCollision.id);
                  closeCollisionDetails();
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Mark as Acknowledged / Resolved
              </button>
            ) : (
              <span className="text-xs text-emerald-700 font-medium">Resolution acknowledged</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={closeCollisionDetails}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                closeCollisionDetails();
                setActiveTab('schedule');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" /> Optimize in Smart Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
