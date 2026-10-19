import {
  Task,
  UserSettings,
  SchedulePlan,
  ScheduledSlot,
  UnschedulableTask,
  PriorityLevel,
} from '../types';
import {
  parseLocalDate,
  formatDateString,
  getHoursDiff,
} from './dateUtils';

interface SchedulerOptions {
  ordering?: 'urgency' | 'deadline' | 'priority' | 'shortest_first';
  startDate?: Date;
  maxDaysAhead?: number;
}

const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export function generateSmartSchedule(
  tasks: Task[],
  settings: UserSettings,
  options: SchedulerOptions = {}
): SchedulePlan {
  const now = options.startDate || new Date();
  const ordering = options.ordering || 'urgency';
  const maxDaysAhead = options.maxDaysAhead || 21;

  // Filter incomplete tasks
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');

  // Compute urgency scores for sorting
  const scoredTasks = pendingTasks.map((task) => {
    const deadline = parseLocalDate(task.deadline);
    const hoursToDeadline = Math.max(0.1, getHoursDiff(now, deadline));
    const pWeight = PRIORITY_WEIGHTS[task.priority] || 1;

    // Urgency score: heavily penalizes imminent deadlines with high priority
    const urgencyScore = (pWeight * 100) / Math.pow(Math.max(1, hoursToDeadline), 0.7);

    return {
      task,
      deadline,
      hoursToDeadline,
      remainingHours: task.estimatedDuration,
      urgencyScore,
    };
  });

  // Sort based on user preference
  scoredTasks.sort((a, b) => {
    if (ordering === 'urgency') {
      return b.urgencyScore - a.urgencyScore;
    }
    if (ordering === 'deadline') {
      return a.deadline.getTime() - b.deadline.getTime();
    }
    if (ordering === 'priority') {
      const pDiff = (PRIORITY_WEIGHTS[b.task.priority] || 1) - (PRIORITY_WEIGHTS[a.task.priority] || 1);
      if (pDiff !== 0) return pDiff;
      return a.deadline.getTime() - b.deadline.getTime();
    }
    if (ordering === 'shortest_first') {
      return a.task.estimatedDuration - b.task.estimatedDuration;
    }
    return a.deadline.getTime() - b.deadline.getTime();
  });

  const slots: ScheduledSlot[] = [];
  const unschedulableTasks: UnschedulableTask[] = [];

  const [startHour, startMin] = settings.workdayStart.split(':').map(Number);
  const breakMinutes = settings.breakDuration || 15;
  const dailyHoursLimit = settings.dailyWorkingHours || 6;
  const maxBlockHours = 2.5; // Max continuous block before a break

  let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dayOffset = 0;

  // Work on copy of scored tasks
  const workQueue = scoredTasks.map((item) => ({ ...item }));

  while (workQueue.some((item) => item.remainingHours > 0) && dayOffset < maxDaysAhead) {
    const evalDate = new Date(currentDate);
    evalDate.setDate(currentDate.getDate() + dayOffset);
    const dayOfWeek = evalDate.getDay();

    // Check if it's a working day
    if (!settings.workingDays.includes(dayOfWeek)) {
      dayOffset++;
      continue;
    }

    let dayHoursUsed = 0;
    let currentHourOffset = 0; // Hours from workdayStart

    // Process tasks in queue for this day
    for (let i = 0; i < workQueue.length; i++) {
      const item = workQueue[i];
      if (item.remainingHours <= 0) continue;

      // Check if deadline has already passed relative to this day's end
      const dayEndCheck = new Date(evalDate);
      dayEndCheck.setHours(startHour + Math.floor(dailyHoursLimit), startMin, 0, 0);

      // Buffer time
      const bufferMs = (settings.bufferTime || 1) * 60 * 60 * 1000;
      const effectiveDeadlineMs = item.deadline.getTime() - bufferMs;

      // If the day is already past the deadline with buffer
      if (evalDate.getTime() > item.deadline.getTime()) {
        continue;
      }

      const availableCapacityToday = dailyHoursLimit - dayHoursUsed;
      if (availableCapacityToday <= 0.25) {
        break; // Day full
      }

      // Determine block length
      const blockLength = Math.min(item.remainingHours, availableCapacityToday, maxBlockHours);

      // Start time for this block
      const blockStartDec = startHour + startMin / 60 + currentHourOffset;
      const blockStartH = Math.floor(blockStartDec);
      const blockStartM = Math.round((blockStartDec - blockStartH) * 60);

      const blockEndDec = blockStartDec + blockLength;
      const blockEndH = Math.floor(blockEndDec);
      const blockEndM = Math.round((blockEndDec - blockEndH) * 60);

      const dateStr = formatDateString(evalDate);
      const formatTime = (h: number, m: number) =>
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      slots.push({
        id: `slot-${item.task.id}-${dateStr}-${slots.length}`,
        taskId: item.task.id,
        taskTitle: item.task.title,
        category: item.task.category,
        priority: item.task.priority,
        date: dateStr,
        startTime: formatTime(blockStartH, blockStartM),
        endTime: formatTime(blockEndH, blockEndM),
        durationHours: Math.round(blockLength * 10) / 10,
      });

      item.remainingHours = Math.round((item.remainingHours - blockLength) * 10) / 10;
      dayHoursUsed += blockLength;
      currentHourOffset += blockLength;

      // Insert break if day still has capacity and task continues or next task follows
      if (dayHoursUsed + breakMinutes / 60 <= dailyHoursLimit && breakMinutes > 0) {
        currentHourOffset += breakMinutes / 60;
        dayHoursUsed += breakMinutes / 60;
      }
    }

    dayOffset++;
  }

  // Any task that still has remaining hours is unschedulable within the window/deadline
  for (const item of workQueue) {
    if (item.remainingHours > 0.2) {
      const scheduledHours = item.task.estimatedDuration - item.remainingHours;
      unschedulableTasks.push({
        taskId: item.task.id,
        taskTitle: item.task.title,
        deadline: item.task.deadline,
        requiredHours: item.task.estimatedDuration,
        availableHours: Math.round(scheduledHours * 10) / 10,
        reason:
          item.deadline.getTime() < now.getTime()
            ? 'Deadline has already passed'
            : `Insufficient working hours (${Math.round(scheduledHours * 10) / 10}h scheduled out of ${item.task.estimatedDuration}h required) prior to deadline with ${settings.bufferTime || 2}h buffer.`,
      });
    }
  }

  // Calculate plan summary
  const scheduledTaskIds = new Set(slots.map((s) => s.taskId));
  const totalHoursScheduled = Math.round(
    slots.reduce((sum, s) => sum + s.durationHours, 0) * 10
  ) / 10;

  const datesUsed = Array.from(new Set(slots.map((s) => s.date)));
  const completionDate = datesUsed.length > 0 ? datesUsed[datesUsed.length - 1] : formatDateString(now);

  return {
    id: `plan-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    slots,
    unschedulableTasks,
    summary: {
      totalTasksScheduled: scheduledTaskIds.size,
      totalHoursScheduled,
      daysSpanned: datesUsed.length,
      completionDate,
    },
    applied: false,
  };
}

/**
 * Applies a generated schedule plan to tasks by updating their scheduledStart and scheduledEnd
 */
export function applyPlanToTasks(tasks: Task[], plan: SchedulePlan): Task[] {
  const taskSlotMap = new Map<string, { earliestStart: string; latestEnd: string }>();

  for (const slot of plan.slots) {
    const slotStartIso = `${slot.date}T${slot.startTime}`;
    const slotEndIso = `${slot.date}T${slot.endTime}`;

    const existing = taskSlotMap.get(slot.taskId);
    if (!existing) {
      taskSlotMap.set(slot.taskId, { earliestStart: slotStartIso, latestEnd: slotEndIso });
    } else {
      if (slotStartIso < existing.earliestStart) existing.earliestStart = slotStartIso;
      if (slotEndIso > existing.latestEnd) existing.latestEnd = slotEndIso;
    }
  }

  return tasks.map((task) => {
    const scheduled = taskSlotMap.get(task.id);
    if (scheduled) {
      return {
        ...task,
        scheduledStart: scheduled.earliestStart,
        scheduledEnd: scheduled.latestEnd,
        updatedAt: new Date().toISOString(),
      };
    }
    return task;
  });
}
