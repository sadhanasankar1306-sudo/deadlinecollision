import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getMonthDaysGrid,
  getWeekDates,
  getMonthName,
  formatDateString,
  isSameDay,
  parseLocalDate,
  formatTimeString,
} from '../utils/dateUtils';
import { Task } from '../types';

type CalendarViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC = () => {
  const {
    tasks,
    activeCollisions,
    openAddTask,
    openEditTask,
    openCollisionDetails,
  } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 19)); // Oct 19, 2026
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Month navigation
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const dStr = formatDateString(parseLocalDate(task.deadline));
      const existing = map.get(dStr) || [];
      existing.push(task);
      map.set(dStr, existing);
    });
    return map;
  }, [tasks]);

  // Collisions by date string
  const collisionsByDate = useMemo(() => {
    const map = new Map<string, typeof activeCollisions>();
    activeCollisions.forEach((col) => {
      col.affectedDates.forEach((dStr) => {
        const list = map.get(dStr) || [];
        list.push(col);
        map.set(dStr, list);
      });
    });
    return map;
  }, [activeCollisions]);

  // Title for top bar
  const calendarTitle = useMemo(() => {
    const month = getMonthName(currentDate.getMonth());
    const year = currentDate.getFullYear();
    if (viewMode === 'month') {
      return `${month} ${year}`;
    }
    if (viewMode === 'week') {
      const week = getWeekDates(currentDate);
      const startM = getMonthName(week[0].getMonth()).slice(0, 3);
      const endM = getMonthName(week[6].getMonth()).slice(0, 3);
      return `${startM} ${week[0].getDate()} – ${endM} ${week[6].getDate()}, ${year}`;
    }
    return `${month} ${currentDate.getDate()}, ${year}`;
  }, [currentDate, viewMode]);

  const monthGridDays = useMemo(() => {
    return getMonthDaysGrid(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return getWeekDates(currentDate);
  }, [currentDate]);

  const today = new Date();

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Calendar Header Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Month/Week Title & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {calendarTitle}
          </h2>
        </div>

        {/* Right: View Mode Toggle & Add Task */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
          </div>

          <button
            onClick={() => openAddTask(formatDateString(currentDate))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add on Date</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* =========================================================================
            MONTH VIEW
           ========================================================================= */}
        {viewMode === 'month' && (
          <div>
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2 text-xs font-semibold text-slate-600">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[580px]">
              {monthGridDays.map((dayDate, idx) => {
                const dateStr = formatDateString(dayDate);
                const dayTasks = tasksByDate.get(dateStr) || [];
                const dayCollisions = collisionsByDate.get(dateStr) || [];
                const isCurrentMonth = dayDate.getMonth() === currentDate.getMonth();
                const isCurrentDay = isSameDay(dayDate, today);

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors group ${
                      !isCurrentMonth ? 'bg-slate-50/40 text-slate-400' : 'bg-white'
                    } ${isCurrentDay ? 'bg-blue-50/20' : ''}`}
                  >
                    {/* Date number and collision alert */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-semibold font-mono tabular-nums w-6 h-6 rounded-full flex items-center justify-center ${
                          isCurrentDay
                            ? 'bg-blue-600 text-white'
                            : isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {dayDate.getDate()}
                      </span>

                      <div className="flex items-center gap-1">
                        {dayCollisions.length > 0 && (
                          <button
                            onClick={() => openCollisionDetails(dayCollisions[0])}
                            className="p-0.5 text-red-600 hover:text-red-800"
                            title={`${dayCollisions.length} collision(s) detected on this date!`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openAddTask(dateStr)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 transition-opacity"
                          title="Add task for this date"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tasks inside cell */}
                    <div className="space-y-1 overflow-y-auto max-h-[85px]">
                      {dayTasks.map((t) => {
                        const isDone = t.status === 'Completed';
                        return (
                          <div
                            key={t.id}
                            onClick={() => openEditTask(t)}
                            className={`px-1.5 py-1 rounded text-[11px] truncate cursor-pointer transition-colors border font-medium ${
                              isDone
                                ? 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                                : t.priority === 'Critical'
                                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                : t.priority === 'High'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            }`}
                            title={`${t.title} (${t.estimatedDuration}h)`}
                          >
                            <span className="font-mono mr-1">
                              {formatTimeString(parseLocalDate(t.deadline), false)}
                            </span>
                            {t.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            WEEK VIEW
           ========================================================================= */}
        {viewMode === 'week' && (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2.5 text-xs font-semibold text-slate-600">
              {weekDays.map((d, i) => (
                <div key={i}>
                  <div>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}</div>
                  <div
                    className={`mt-0.5 text-sm font-bold font-mono ${
                      isSameDay(d, today) ? 'text-blue-600' : 'text-slate-900'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[500px]">
              {weekDays.map((d, i) => {
                const dateStr = formatDateString(d);
                const dayTasks = tasksByDate.get(dateStr) || [];
                const dayCollisions = collisionsByDate.get(dateStr) || [];

                return (
                  <div key={i} className="p-2.5 flex flex-col justify-between bg-white">
                    <div>
                      {dayCollisions.length > 0 && (
                        <div
                          onClick={() => openCollisionDetails(dayCollisions[0])}
                          className="mb-2 p-1.5 rounded bg-red-50 border border-red-200 text-red-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Conflict alert</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {dayTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => openEditTask(t)}
                            className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 text-xs bg-white shadow-2xs cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-bold ${
                                  t.priority === 'Critical'
                                    ? 'text-red-600'
                                    : t.priority === 'High'
                                    ? 'text-amber-600'
                                    : 'text-slate-600'
                                }`}
                              >
                                {t.priority}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {t.estimatedDuration}h
                              </span>
                            </div>
                            <p className="font-semibold text-slate-900 line-clamp-2 leading-snug">
                              {t.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => openAddTask(dateStr)}
                      className="mt-3 w-full py-1 text-center text-[11px] text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            DAY VIEW
           ========================================================================= */}
        {viewMode === 'day' && (
          <div className="p-6">
            {(() => {
              const dateStr = formatDateString(currentDate);
              const dayTasks = tasksByDate.get(dateStr) || [];
              const dayCollisions = collisionsByDate.get(dateStr) || [];

              return (
                <div className="max-w-2xl mx-auto space-y-4">
                  {dayCollisions.length > 0 && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Collision Alert for {dateStr}
                      </div>
                      <p className="text-xs text-red-700 leading-relaxed">
                        {dayCollisions[0].explanation}
                      </p>
                      <button
                        onClick={() => openCollisionDetails(dayCollisions[0])}
                        className="mt-2 text-xs font-semibold text-red-800 hover:underline inline-flex items-center gap-1"
                      >
                        Inspect detailed collision diagnostics →
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Tasks Due on {dateStr}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {dayTasks.length} task(s) registered
                      </p>
                    </div>
                    <button
                      onClick={() => openAddTask(dateStr)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  </div>

                  {dayTasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No tasks scheduled for this day.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => openEditTask(t)}
                          className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-900">
                                {t.title}
                              </span>
                              <span className="text-xs text-slate-500">· {t.category}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                              <span>Due {formatTimeString(parseLocalDate(t.deadline))}</span>
                              <span>·</span>
                              <span>Workload: {t.estimatedDuration}h</span>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              t.priority === 'Critical'
                                ? 'bg-red-50 text-red-700'
                                : t.priority === 'High'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
