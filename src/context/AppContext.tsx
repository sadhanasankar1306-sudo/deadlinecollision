import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task,
  UserSettings,
  Collision,
  SchedulePlan,
  AppNotification,
  ActiveNavPage,
} from '../types';
import { DEFAULT_SETTINGS, INITIAL_SAMPLE_TASKS } from '../data/sampleData';
import { detectCollisions } from '../utils/collisionEngine';
import { generateSmartSchedule, applyPlanToTasks } from '../utils/schedulerEngine';
import { formatDateString, parseLocalDate } from '../utils/dateUtils';

interface AppContextType {
  tasks: Task[];
  settings: UserSettings;
  collisions: Collision[];
  activeCollisions: Collision[];
  activeTab: ActiveNavPage;
  setActiveTab: (tab: ActiveNavPage) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  isScanningCollisions: boolean;
  currentPlan: SchedulePlan | null;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;

  // Actions
  scanCollisions: () => void;
  generateSchedule: (options?: { ordering?: 'urgency' | 'deadline' | 'priority' | 'shortest_first' }) => SchedulePlan;
  applyCurrentPlan: () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  resolveCollision: (id: string) => void;
  resetToDemoData: () => void;
  clearAllTasks: () => void;
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => boolean;
  exportTasksCsv: () => void;
  exportCollisionsCsv: () => void;

  // Modal helpers
  isAddTaskOpen: boolean;
  initialNewTaskDate?: string;
  openAddTask: (initialDate?: string) => void;
  closeAddTask: () => void;
  editingTask: Task | null;
  openEditTask: (task: Task) => void;
  closeEditTask: () => void;
  viewingCollision: Collision | null;
  openCollisionDetails: (col: Collision) => void;
  closeCollisionDetails: () => void;
}

const STORAGE_KEY_TASKS = 'smart_detector_tasks_v2';
const STORAGE_KEY_SETTINGS = 'smart_detector_settings_v2';
const STORAGE_KEY_NOTIFS = 'smart_detector_notifs_v2';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings state
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to parse settings from storage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // 2. Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse tasks from storage', e);
    }
    return INITIAL_SAMPLE_TASKS;
  });

  // 3. Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse notifications from storage', e);
    }
    return [
      {
        id: 'notif-welcome',
        type: 'system',
        severity: 'info',
        title: 'System Initialized',
        message: 'Collision detector loaded 10 active tasks and monitored 14-day workload horizon.',
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    ];
  });

  // 4. UI Navigation and State
  const [activeTab, setActiveTab] = useState<ActiveNavPage>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isScanningCollisions, setIsScanningCollisions] = useState(false);
  const [resolvedCollisionIds, setResolvedCollisionIds] = useState<Set<string>>(new Set());
  const [currentPlan, setCurrentPlan] = useState<SchedulePlan | null>(null);

  // Modals
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [initialNewTaskDate, setInitialNewTaskDate] = useState<string | undefined>();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingCollision, setViewingCollision] = useState<Collision | null>(null);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Persist tasks
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  // Persist notifications
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  // Dynamically compute collisions whenever tasks or settings change
  const detectedRawCollisions = useMemo(() => {
    return detectCollisions(tasks, settings, new Date());
  }, [tasks, settings]);

  const collisions = useMemo(() => {
    return detectedRawCollisions.map((col) => ({
      ...col,
      resolved: resolvedCollisionIds.has(col.id),
    }));
  }, [detectedRawCollisions, resolvedCollisionIds]);

  const activeCollisions = useMemo(() => {
    return collisions.filter((c) => !c.resolved);
  }, [collisions]);

  // Push notifications when critical collisions are detected
  useEffect(() => {
    const criticalCols = activeCollisions.filter((c) => c.severity === 'Critical');
    if (criticalCols.length > 0) {
      // Check if already notified
      const latestCritical = criticalCols[0];
      const alreadyNotified = notifications.some(
        (n) => n.relatedCollisionId === latestCritical.id
      );

      if (!alreadyNotified) {
        setNotifications((prev) => [
          {
            id: `notif-crit-${Date.now()}`,
            type: 'collision',
            severity: 'critical',
            title: `Critical Collision: ${latestCritical.title}`,
            message: latestCritical.explanation,
            createdAt: new Date().toISOString(),
            isRead: false,
            relatedCollisionId: latestCritical.id,
          },
          ...prev,
        ]);
      }
    }
  }, [activeCollisions, notifications]);

  // Scan simulation
  const scanCollisions = useCallback(() => {
    setIsScanningCollisions(true);
    setTimeout(() => {
      setIsScanningCollisions(false);
      // Re-evaluate
      const cols = detectCollisions(tasks, settings, new Date());
      setNotifications((prev) => [
        {
          id: `notif-scan-${Date.now()}`,
          type: 'collision',
          severity: cols.length > 0 ? 'warning' : 'success',
          title: 'Collision Scan Complete',
          message:
            cols.length > 0
              ? `Diagnostic scan finished. ${cols.length} potential deadline and capacity conflicts detected.`
              : 'Diagnostic scan finished. Zero deadline collisions detected on current horizon.',
          createdAt: new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);
    }, 600);
  }, [tasks, settings]);

  // Schedule generator
  const generateSchedule = useCallback(
    (options?: { ordering?: 'urgency' | 'deadline' | 'priority' | 'shortest_first' }) => {
      const plan = generateSmartSchedule(tasks, settings, options);
      setCurrentPlan(plan);
      setNotifications((prev) => [
        {
          id: `notif-sched-${Date.now()}`,
          type: 'schedule',
          severity: plan.unschedulableTasks.length > 0 ? 'warning' : 'success',
          title: 'Schedule Generated',
          message: `Generated timetable: ${plan.summary.totalTasksScheduled} tasks scheduled across ${plan.summary.daysSpanned} days (${plan.summary.totalHoursScheduled}h total). ${plan.unschedulableTasks.length} task(s) could not fit without overload.`,
          createdAt: new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);
      return plan;
    },
    [tasks, settings]
  );

  const applyCurrentPlan = useCallback(() => {
    if (!currentPlan) return;
    const updatedTasks = applyPlanToTasks(tasks, currentPlan);
    setTasks(updatedTasks);
    setCurrentPlan({ ...currentPlan, applied: true });
    setNotifications((prev) => [
      {
        id: `notif-applied-${Date.now()}`,
        type: 'schedule',
        severity: 'success',
        title: 'Schedule Applied to Tasks',
        message: 'Task start and end work blocks updated to match optimized schedule.',
        createdAt: new Date().toISOString(),
        isRead: false,
      },
      ...prev,
    ]);
  }, [currentPlan, tasks]);

  // Task CRUD
  const addTask = useCallback(
    (newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const nowIso = new Date().toISOString();
      const newTask: Task = {
        ...newTaskData,
        id: `task-${Date.now()}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setTasks((prev) => [newTask, ...prev]);
      setIsAddTaskOpen(false);

      setNotifications((prev) => [
        {
          id: `notif-add-${Date.now()}`,
          type: 'deadline',
          severity: 'info',
          title: 'Task Created',
          message: `"${newTask.title}" added with deadline ${formatDateString(parseLocalDate(newTask.deadline))}.`,
          createdAt: nowIso,
          isRead: false,
          relatedTaskId: newTask.id,
        },
        ...prev,
      ]);
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
    setEditingTask(null);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTaskComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'Completed' ? 'Not Started' : 'Completed';
          const subtasks =
            nextStatus === 'Completed'
              ? t.subtasks.map((s) => ({ ...s, completed: true }))
              : t.subtasks;

          return {
            ...t,
            status: nextStatus,
            subtasks,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allDone = updatedSubtasks.every((st) => st.completed);
          return {
            ...t,
            subtasks: updatedSubtasks,
            status: allDone && updatedSubtasks.length > 0 ? 'Completed' : t.status === 'Completed' ? 'In Progress' : t.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Notifications actions
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const resolveCollision = useCallback((collisionId: string) => {
    setResolvedCollisionIds((prev) => {
      const next = new Set(prev);
      next.add(collisionId);
      return next;
    });
  }, []);

  const resetToDemoData = useCallback(() => {
    setTasks(INITIAL_SAMPLE_TASKS);
    setSettings(DEFAULT_SETTINGS);
    setResolvedCollisionIds(new Set());
    setCurrentPlan(null);
    setNotifications([
      {
        id: `notif-reset-${Date.now()}`,
        type: 'system',
        severity: 'info',
        title: 'Demo Data Restored',
        message: 'Tasks and default configuration restored to initial sample dataset.',
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    ]);
  }, []);

  const clearAllTasks = useCallback(() => {
    setTasks([]);
    setResolvedCollisionIds(new Set());
    setCurrentPlan(null);
  }, []);

  // Export JSON
  const exportDataJson = useCallback(() => {
    const data = {
      app: 'Smart Deadline Collision Detector',
      exportedAt: new Date().toISOString(),
      tasks,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deadline-collision-backup-${formatDateString(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [tasks, settings]);

  // Import JSON
  const importDataJson = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.tasks)) {
        setTasks(parsed.tasks);
        if (parsed.settings) {
          setSettings((prev) => ({ ...prev, ...parsed.settings }));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  // Export Tasks CSV
  const exportTasksCsv = useCallback(() => {
    const headers = [
      'ID',
      'Title',
      'Category',
      'Deadline',
      'Estimated Hours',
      'Priority',
      'Status',
      'Subtasks Count',
      'Subtasks Completed',
    ];
    const rows = tasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.deadline,
      t.estimatedDuration,
      t.priority,
      t.status,
      t.subtasks.length,
      t.subtasks.filter((s) => s.completed).length,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-export-${formatDateString(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [tasks]);

  // Export Collisions CSV
  const exportCollisionsCsv = useCallback(() => {
    const headers = [
      'Collision ID',
      'Type',
      'Severity',
      'Title',
      'Affected Tasks Count',
      'Affected Dates',
      'Total Workload (h)',
      'Available Working Hours (h)',
      'Overload (h)',
      'Explanation',
    ];
    const rows = collisions.map((c) => [
      c.id,
      c.collisionType,
      c.severity,
      `"${c.title.replace(/"/g, '""')}"`,
      c.affectedTaskIds.length,
      `"${c.affectedDates.join('; ')}"`,
      c.totalWorkloadHours,
      c.availableWorkingHours,
      c.overloadHours,
      `"${c.explanation.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collision-report-${formatDateString(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [collisions]);

  // Modal handlers
  const openAddTask = useCallback((initialDate?: string) => {
    setInitialNewTaskDate(initialDate);
    setIsAddTaskOpen(true);
  }, []);

  const closeAddTask = useCallback(() => {
    setIsAddTaskOpen(false);
    setInitialNewTaskDate(undefined);
  }, []);

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const closeEditTask = useCallback(() => {
    setEditingTask(null);
  }, []);

  const openCollisionDetails = useCallback((col: Collision) => {
    setViewingCollision(col);
  }, []);

  const closeCollisionDetails = useCallback(() => {
    setViewingCollision(null);
  }, []);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  return (
    <AppContext.Provider
      value={{
        tasks,
        settings,
        collisions,
        activeCollisions,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        notifications,
        unreadNotificationsCount,
        isScanningCollisions,
        currentPlan,
        selectedDate,
        setSelectedDate,
        scanCollisions,
        generateSchedule,
        applyCurrentPlan,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        toggleSubtask,
        updateSettings,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        resolveCollision,
        resetToDemoData,
        clearAllTasks,
        exportDataJson,
        importDataJson,
        exportTasksCsv,
        exportCollisionsCsv,
        isAddTaskOpen,
        initialNewTaskDate,
        openAddTask,
        closeAddTask,
        editingTask,
        openEditTask,
        closeEditTask,
        viewingCollision,
        openCollisionDetails,
        closeCollisionDetails,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
