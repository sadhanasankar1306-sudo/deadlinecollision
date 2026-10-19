export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';
export type ReminderOption = 'none' | '1h_before' | '3h_before' | '1d_before' | '2d_before';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string; // ISO format: YYYY-MM-DDTHH:mm
  estimatedDuration: number; // In hours (e.g. 3.5)
  priority: PriorityLevel;
  status: TaskStatus;
  scheduledStart?: string; // ISO format or YYYY-MM-DDTHH:mm
  scheduledEnd?: string;
  reminder?: ReminderOption;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export type CollisionType =
  | 'Same-Deadline'
  | 'Workload-Overload'
  | 'Priority-Clash'
  | 'Time-Overlap'
  | 'Back-To-Back';

export type CollisionSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Collision {
  id: string;
  collisionType: CollisionType;
  severity: CollisionSeverity;
  title: string;
  affectedTaskIds: string[];
  affectedDates: string[]; // YYYY-MM-DD strings
  totalWorkloadHours: number;
  availableWorkingHours: number;
  overloadHours: number;
  explanation: string;
  recommendations: string[];
  detectedAt: string;
  resolved: boolean;
}

export interface UserSettings {
  userName: string;
  userRole: string;
  avatarUrl: string;
  dailyWorkingHours: number; // e.g. 6 hours
  workingDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  workdayStart: string; // "09:00"
  workdayEnd: string; // "17:00"
  breakDuration: number; // in minutes (e.g. 15 or 30)
  bufferTime: number; // hours of buffer before deadline (e.g. 2)
  warningWindowDays: number; // Days in advance to detect (e.g. 7 or 14)
  clusterWindowHours: number; // Hours defining same-window collision (e.g. 24)
  overloadThresholdRatio: number; // e.g. 1.0 (100% of capacity)
  reminderPreferences: {
    browserNotifications: boolean;
    inAppAlerts: boolean;
    soundAlerts: boolean;
  };
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  timeFormat: '12h' | '24h';
}

export interface ScheduledSlot {
  id: string;
  taskId: string;
  taskTitle: string;
  category: string;
  priority: PriorityLevel;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  isBreak?: boolean;
}

export interface UnschedulableTask {
  taskId: string;
  taskTitle: string;
  deadline: string;
  requiredHours: number;
  availableHours: number;
  reason: string;
}

export interface SchedulePlan {
  id: string;
  generatedAt: string;
  slots: ScheduledSlot[];
  unschedulableTasks: UnschedulableTask[];
  summary: {
    totalTasksScheduled: number;
    totalHoursScheduled: number;
    daysSpanned: number;
    completionDate: string;
  };
  applied: boolean;
}

export type NotificationType = 'collision' | 'deadline' | 'overdue' | 'schedule' | 'system';
export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  relatedTaskId?: string;
  relatedCollisionId?: string;
}

export type ActiveNavPage =
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'collisions'
  | 'schedule'
  | 'analytics'
  | 'settings';
