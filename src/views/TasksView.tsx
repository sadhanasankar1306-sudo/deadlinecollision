import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Check,
  Calendar,
  X,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task, PriorityLevel, TaskStatus } from '../types';
import {
  parseLocalDate,
  formatDateString,
  formatDateTime,
  getRemainingTimeText,
} from '../utils/dateUtils';
import { DeleteConfirmModal } from '../components/tasks/DeleteConfirmModal';

type SortOption = 'deadline-asc' | 'deadline-desc' | 'priority-desc' | 'priority-asc' | 'duration-desc' | 'duration-asc' | 'created-desc';

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const TasksView: React.FC = () => {
  const {
    tasks,
    openAddTask,
    openEditTask,
    deleteTask,
    toggleTaskComplete,
    toggleSubtask,
    searchQuery,
    setSearchQuery,
    resetToDemoData,
  } = useApp();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('deadline-asc');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Delete modal state
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Derive categories from current tasks
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    tasks.forEach((t) => cats.add(t.category));
    return ['All', ...Array.from(cats)];
  }, [tasks]);

  const toggleExpand = (id: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const now = new Date();

  // Filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesCategory = t.category.toLowerCase().includes(q);
          const matchesDesc = t.description.toLowerCase().includes(q);
          if (!matchesTitle && !matchesCategory && !matchesDesc) return false;
        }

        // Category
        if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;

        // Priority
        if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;

        // Status
        if (selectedStatus === 'Overdue') {
          return t.status !== 'Completed' && parseLocalDate(t.deadline).getTime() < now.getTime();
        } else if (selectedStatus !== 'All' && t.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dA = parseLocalDate(a.deadline).getTime();
        const dB = parseLocalDate(b.deadline).getTime();

        switch (sortBy) {
          case 'deadline-asc':
            return dA - dB;
          case 'deadline-desc':
            return dB - dA;
          case 'priority-desc':
            return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] || dA - dB;
          case 'priority-asc':
            return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || dA - dB;
          case 'duration-desc':
            return b.estimatedDuration - a.estimatedDuration;
          case 'duration-asc':
            return a.estimatedDuration - b.estimatedDuration;
          case 'created-desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return dA - dB;
        }
      });
  }, [tasks, searchQuery, selectedCategory, selectedPriority, selectedStatus, sortBy, now]);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedPriority('All');
    setSelectedStatus('All');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedPriority !== 'All' ||
    selectedStatus !== 'All' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Task Repository</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage coursework, research milestones, workload hours, and checklist subtasks.
          </p>
        </div>

        <button
          onClick={() => openAddTask()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Task
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Subject
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="deadline-asc">Deadline (Soonest First)</option>
              <option value="deadline-desc">Deadline (Latest First)</option>
              <option value="priority-desc">Priority (Highest First)</option>
              <option value="priority-asc">Priority (Lowest First)</option>
              <option value="duration-desc">Duration (Longest First)</option>
              <option value="duration-asc">Duration (Shortest First)</option>
              <option value="created-desc">Date Created (Newest First)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Showing <span className="font-semibold text-slate-900 font-mono">{filteredTasks.length}</span> of{' '}
            <span className="font-semibold text-slate-900 font-mono">{tasks.length}</span> tasks
          </span>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear active filters
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No matching tasks found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try relaxing your filter criteria or search query.'
              : 'You have not added any tasks yet. Create one or load the sample demo data.'}
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                onClick={clearAllFilters}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAddTask()}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Create Task
                </button>
                <button
                  onClick={resetToDemoData}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Load Sample Data
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const remaining = getRemainingTimeText(task.deadline, now);
            const isExpanded = expandedTaskIds.has(task.id);
            const isCompleted = task.status === 'Completed';

            const subtasksCompletedCount = task.subtasks.filter((s) => s.completed).length;

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-xl p-4.5 transition-all shadow-xs ${
                  isCompleted
                    ? 'border-slate-200 bg-slate-50/40 opacity-75'
                    : remaining.isOverdue
                    ? 'border-red-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-blue-500 bg-white'
                      }`}
                      title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3
                          onClick={() => openEditTask(task)}
                          className={`text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors ${
                            isCompleted ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {task.title}
                        </h3>

                        {/* Priority indicator */}
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            task.priority === 'Critical'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : task.priority === 'High'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : task.priority === 'Medium'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span className="text-xs text-slate-500 font-medium">
                          {task.category}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                          {task.description}
                        </p>
                      )}

                      {/* Clean Unboxed Metadata with · separator */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                        <span>Due: {formatDateTime(task.deadline)}</span>
                        <span>·</span>
                        <span>Duration: {task.estimatedDuration}h</span>
                        <span>·</span>
                        <span
                          className={`font-semibold tabular-nums ${
                            remaining.isOverdue
                              ? 'text-red-600'
                              : remaining.hoursRemaining <= 24
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {remaining.text}
                        </span>
                        {task.scheduledStart && (
                          <>
                            <span>·</span>
                            <span className="text-blue-600 font-medium">
                              Scheduled: {formatDateString(task.scheduledStart)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditTask(task)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTaskToDelete(task)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {task.subtasks.length > 0 && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtasks Progress & Expandable List */}
                {task.subtasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div
                      onClick={() => toggleExpand(task.id)}
                      className="flex items-center justify-between text-xs text-slate-500 cursor-pointer hover:text-slate-800"
                    >
                      <span className="font-medium">
                        Subtasks ({subtasksCompletedCount}/{task.subtasks.length} done)
                      </span>
                      <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-3">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{
                            width: `${(subtasksCompletedCount / task.subtasks.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 pl-8 pt-1">
                        {task.subtasks.map((st) => (
                          <label
                            key={st.id}
                            className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                          >
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => toggleSubtask(task.id, st.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className={st.completed ? 'line-through text-slate-400' : ''}>
                              {st.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <DeleteConfirmModal
        task={taskToDelete}
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) deleteTask(taskToDelete.id);
        }}
      />
    </div>
  );
};
