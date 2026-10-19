import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PriorityLevel, TaskStatus, ReminderOption, Subtask } from '../../types';
import { formatDateString } from '../../utils/dateUtils';

const COMMON_CATEGORIES = [
  'Computer Science',
  'Artificial Intelligence',
  'Mathematics',
  'Software Engineering',
  'Cybersecurity',
  'Database Systems',
  'DevOps',
  'Humanities & Ethics',
  'Research & Capstone',
  'Work Project',
];

export const TaskModal: React.FC = () => {
  const {
    isAddTaskOpen,
    initialNewTaskDate,
    closeAddTask,
    editingTask,
    closeEditTask,
    addTask,
    updateTask,
  } = useApp();

  const isOpen = isAddTaskOpen || Boolean(editingTask);
  const isEditing = Boolean(editingTask);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [customCategory, setCustomCategory] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('17:00');
  const [estimatedDuration, setEstimatedDuration] = useState('3.0');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Not Started');
  const [reminder, setReminder] = useState<ReminderOption>('1d_before');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or initialize form when opened
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      if (COMMON_CATEGORIES.includes(editingTask.category)) {
        setCategory(editingTask.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(editingTask.category);
      }
      const [dPart, tPart] = editingTask.deadline.split('T');
      setDeadlineDate(dPart);
      setDeadlineTime(tPart ? tPart.slice(0, 5) : '17:00');
      setEstimatedDuration(String(editingTask.estimatedDuration));
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setReminder(editingTask.reminder || 'none');
      setSubtasks(editingTask.subtasks || []);
      setErrors({});
    } else if (isAddTaskOpen) {
      setTitle('');
      setDescription('');
      setCategory('Computer Science');
      setCustomCategory('');
      // Set default deadline to initial date or tomorrow
      if (initialNewTaskDate) {
        setDeadlineDate(initialNewTaskDate);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        setDeadlineDate(formatDateString(tomorrow));
      }
      setDeadlineTime('17:00');
      setEstimatedDuration('3.0');
      setPriority('Medium');
      setStatus('Not Started');
      setReminder('1d_before');
      setSubtasks([]);
      setNewSubtaskTitle('');
      setErrors({});
    }
  }, [editingTask, isAddTaskOpen, initialNewTaskDate]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isEditing) closeEditTask();
    else closeAddTask();
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Task title is required.';
    } else if (title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    }

    if (!deadlineDate) {
      errs.deadline = 'Deadline date is required.';
    }

    const durationNum = parseFloat(estimatedDuration);
    if (isNaN(durationNum) || durationNum <= 0) {
      errs.duration = 'Estimated duration must be a positive number greater than 0.';
    } else if (durationNum > 100) {
      errs.duration = 'Duration cannot exceed 100 hours.';
    }

    if (category === 'Other' && !customCategory.trim()) {
      errs.category = 'Please enter a custom category name.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    const finalDeadline = `${deadlineDate}T${deadlineTime}`;
    const durationNum = Math.round(parseFloat(estimatedDuration) * 10) / 10;

    if (isEditing && editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        deadline: finalDeadline,
        estimatedDuration: durationNum,
        priority,
        status,
        reminder,
        subtasks,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        deadline: finalDeadline,
        estimatedDuration: durationNum,
        priority,
        status,
        reminder,
        subtasks,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Task Details' : 'Add New Task'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Update deadline, workload hours, or subtasks'
                : 'Define task requirements for collision detection'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed Systems Lab 3: Raft Consensus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 ${
                errors.title ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Notes
            </label>
            <textarea
              rows={2}
              placeholder="Key deliverables, grading requirements, dependencies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category / Subject
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              >
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">Other (Custom)</option>
              </select>
              {category === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-medium"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical (Immediate Focus)</option>
              </select>
            </div>
          </div>

          {/* Deadline Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deadline Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 ${
                    errors.deadline ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              />
            </div>
          </div>

          {/* Estimated Duration & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                placeholder="4.0"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-mono tabular-nums ${
                  errors.duration ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.duration && (
                <p className="mt-1 text-[11px] text-red-600">{errors.duration}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder</label>
              <select
                value={reminder}
                onChange={(e) => setReminder(e.target.value as ReminderOption)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              >
                <option value="none">No reminder</option>
                <option value="1h_before">1 hour before</option>
                <option value="3h_before">3 hours before</option>
                <option value="1d_before">1 day before</option>
                <option value="2d_before">2 days before</option>
              </select>
            </div>
          </div>

          {/* Subtasks Builder */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Subtasks Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length} done)
            </label>

            {/* List */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2.5 max-h-36 overflow-y-auto">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200/60"
                  >
                    <label className="flex items-center gap-2 text-xs text-slate-800 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className={st.completed ? 'line-through text-slate-400' : ''}>
                        {st.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete subtask"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add subtask input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add checklist subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
