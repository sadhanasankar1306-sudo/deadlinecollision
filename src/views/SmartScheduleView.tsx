import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTimeString, formatDateString, formatDateTime } from '../utils/dateUtils';
import { SchedulePlan } from '../types';

export const SmartScheduleView: React.FC = () => {
  const {
    tasks,
    settings,
    updateSettings,
    currentPlan,
    generateSchedule,
    applyCurrentPlan,
  } = useApp();

  // Local config options for generation
  const [dailyHours, setDailyHours] = useState(settings.dailyWorkingHours);
  const [workdayStart, setWorkdayStart] = useState(settings.workdayStart);
  const [breakDuration, setBreakDuration] = useState(settings.breakDuration);
  const [bufferTime, setBufferTime] = useState(settings.bufferTime);
  const [ordering, setOrdering] = useState<'urgency' | 'deadline' | 'priority' | 'shortest_first'>('urgency');
  const [workingDays, setWorkingDays] = useState<number[]>(settings.workingDays);

  const [isApplying, setIsApplying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const toggleWorkingDay = (day: number) => {
    setWorkingDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort();
      return next.length > 0 ? next : prev; // keep at least 1 day
    });
  };

  const handleGenerate = () => {
    // Save settings first
    updateSettings({
      dailyWorkingHours: dailyHours,
      workdayStart,
      breakDuration,
      bufferTime,
      workingDays,
    });

    generateSchedule({ ordering });
  };

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      applyCurrentPlan();
      setIsApplying(false);
      setShowConfirmModal(false);
    }, 400);
  };

  // Group plan slots by date
  const slotsByDate = React.useMemo(() => {
    if (!currentPlan) return new Map();
    const map = new Map<string, typeof currentPlan.slots>();
    for (const slot of currentPlan.slots) {
      const list = map.get(slot.date) || [];
      list.push(slot);
      map.set(slot.date, list);
    }
    return map;
  }, [currentPlan]);

  const sortedDates = Array.from(slotsByDate.keys()).sort();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Smart Schedule Generator & Capacity Allocator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dispatches focus blocks across non-conflicting working days, respecting capacity limits, breaks, and deadline buffers.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Generate Optimized Schedule</span>
        </button>
      </div>

      {/* Configuration Controls Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
          <Sliders className="w-4 h-4 text-blue-600" /> Scheduling Constraints & Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Daily Working Hours */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Daily Capacity Limit ({dailyHours}h/day)
            </label>
            <input
              type="range"
              min="2"
              max="12"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
              <span>2 hours</span>
              <span className="font-bold text-slate-700">{dailyHours}h</span>
              <span>12 hours</span>
            </div>
          </div>

          {/* Workday Start Time */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Workday Start Time</label>
            <input
              type="time"
              value={workdayStart}
              onChange={(e) => setWorkdayStart(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Break Duration */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Inter-Task Break Duration
            </label>
            <select
              value={breakDuration}
              onChange={(e) => setBreakDuration(parseInt(e.target.value))}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="0">No breaks (Continuous)</option>
              <option value="15">15 minutes break</option>
              <option value="30">30 minutes break</option>
              <option value="45">45 minutes break</option>
            </select>
          </div>

          {/* Task Ordering */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Task Priority Allocation
            </label>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="urgency">Urgency Matrix (Recommended)</option>
              <option value="deadline">Strict Deadline (Soonest first)</option>
              <option value="priority">Priority First (Critical to Low)</option>
              <option value="shortest_first">Quick Wins (Shortest first)</option>
            </select>
          </div>
        </div>

        {/* Working Days Checkbox Strip */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Active Study / Work Days:</span>
            <div className="flex items-center gap-1">
              {[
                { day: 1, label: 'Mon' },
                { day: 2, label: 'Tue' },
                { day: 3, label: 'Wed' },
                { day: 4, label: 'Thu' },
                { day: 5, label: 'Fri' },
                { day: 6, label: 'Sat' },
                { day: 0, label: 'Sun' },
              ].map(({ day, label }) => {
                const isActive = workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkingDay(day)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Buffer before deadlines: {bufferTime}h</span>
          </div>
        </div>
      </div>

      {/* Results View */}
      {!currentPlan ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Generated Timetable Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Click "Generate Optimized Schedule" above to run the scheduling engine across all your incomplete tasks.
          </p>
          <button
            onClick={handleGenerate}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
          >
            Generate Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Plan Summary Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Tasks Scheduled</span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {currentPlan.summary.totalTasksScheduled}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Total Hours</span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {currentPlan.summary.totalHoursScheduled}h
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Days Spanned</span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {currentPlan.summary.daysSpanned} days
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Est. Completion</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {currentPlan.summary.completionDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={currentPlan.applied}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer ${
                  currentPlan.applied
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {currentPlan.applied ? (
                  <>
                    <Check className="w-4 h-4" /> Schedule Applied
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Apply Schedule to Tasks
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Unschedulable Warning Box (if any tasks could not fit) */}
          {currentPlan.unschedulableTasks.length > 0 && (
            <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-bold text-red-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>
                  {currentPlan.unschedulableTasks.length} Task(s) Cannot Fit Without Deadline Collision
                </span>
              </div>
              <p className="text-xs text-red-700 mb-3">
                The total workload required exceeds available study hours prior to the respective deadlines. Immediate rescheduling or de-scoping required.
              </p>

              <div className="space-y-2">
                {currentPlan.unschedulableTasks.map((u) => (
                  <div
                    key={u.taskId}
                    className="p-3 bg-white border border-red-200 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{u.taskTitle}</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">{u.reason}</p>
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px] text-red-700 font-semibold">
                      Requires {u.requiredHours}h · Due {formatDateTime(u.deadline)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day-by-Day Timeline / Planner */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Day-by-Day Execution Timeline</h3>

            {sortedDates.map((dateStr) => {
              const daySlots = slotsByDate.get(dateStr) || [];
              const totalDayHours = daySlots.reduce((sum: number, s: any) => sum + s.durationHours, 0);

              return (
                <div
                  key={dateStr}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold text-slate-900">{dateStr}</span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      {Math.round(totalDayHours * 10) / 10}h scheduled
                    </span>
                  </div>

                  {/* Day Slots */}
                  <div className="space-y-2">
                    {daySlots.map((slot: any) => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="font-mono text-slate-600 font-semibold whitespace-nowrap bg-white border border-slate-200 px-2 py-1 rounded">
                            {slot.startTime} – {slot.endTime}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {slot.taskTitle}
                            </p>
                            <span className="text-[11px] text-slate-500">
                              {slot.category} · {slot.priority} Priority
                            </span>
                          </div>
                        </div>

                        <span className="font-mono tabular-nums text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md font-semibold shrink-0">
                          {slot.durationHours}h block
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Apply Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900">Apply Schedule to Tasks?</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              This will update the scheduled start and completion times for all {currentPlan?.summary.totalTasksScheduled} tasks based on this calculated timetable. Your deadline dates will remain unchanged.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Confirm & Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
