import { Task, Collision, CollisionSeverity, CollisionType, UserSettings } from '../types';
import {
  parseLocalDate,
  formatDateString,
  getHoursDiff,
  calculateAvailableWorkingHours,
} from './dateUtils';

/**
 * Intelligent Collision Detection Engine
 * Scans incomplete tasks according to deterministic, transparent heuristic rules.
 */
export function detectCollisions(
  tasks: Task[],
  settings: UserSettings,
  now: Date = new Date()
): Collision[] {
  const collisions: Collision[] = [];
  const incompleteTasks = tasks.filter((t) => t.status !== 'Completed');

  if (incompleteTasks.length === 0) {
    return [];
  }

  // Sort tasks chronologically by deadline
  const sortedTasks = [...incompleteTasks].sort((a, b) => {
    return parseLocalDate(a.deadline).getTime() - parseLocalDate(b.deadline).getTime();
  });

  const clusterWindowHours = settings.clusterWindowHours || 24;
  const warningDays = settings.warningWindowDays || 14;
  const warningWindowLimit = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);

  // Filter tasks within warning window (or already due/near)
  const windowTasks = sortedTasks.filter((t) => {
    const d = parseLocalDate(t.deadline);
    return d.getTime() <= warningWindowLimit.getTime();
  });

  // =========================================================================
  // RULE A: Same-Deadline / Tight Cluster Collision
  // =========================================================================
  const processedSameDeadlineTaskIds = new Set<string>();

  for (let i = 0; i < windowTasks.length; i++) {
    const primary = windowTasks[i];
    if (processedSameDeadlineTaskIds.has(primary.id)) continue;

    const primaryDate = parseLocalDate(primary.deadline);
    const cluster = [primary];

    for (let j = i + 1; j < windowTasks.length; j++) {
      const candidate = windowTasks[j];
      const candidateDate = parseLocalDate(candidate.deadline);
      const diffHours = Math.abs(getHoursDiff(primaryDate, candidateDate));

      if (diffHours <= clusterWindowHours) {
        cluster.push(candidate);
      }
    }

    if (cluster.length >= 2) {
      cluster.forEach((t) => processedSameDeadlineTaskIds.add(t.id));

      const totalWorkload = cluster.reduce((sum, t) => sum + t.estimatedDuration, 0);
      const affectedDates = Array.from(
        new Set(cluster.map((t) => formatDateString(parseLocalDate(t.deadline))))
      );

      // Available working hours in this cluster's time span
      const minDate = new Date(
        Math.min(...cluster.map((t) => parseLocalDate(t.deadline).getTime()))
      );
      const clusterSpanStart = new Date(Math.max(now.getTime(), minDate.getTime() - clusterWindowHours * 60 * 60 * 1000));
      const clusterSpanEnd = new Date(
        Math.max(...cluster.map((t) => parseLocalDate(t.deadline).getTime()))
      );

      const availableHours = calculateAvailableWorkingHours(
        clusterSpanStart,
        clusterSpanEnd,
        settings.workingDays,
        settings.dailyWorkingHours
      );

      const overload = Math.max(0, Math.round((totalWorkload - availableHours) * 10) / 10);

      // Severity determination
      let severity: CollisionSeverity = 'Medium';
      const hasCritical = cluster.some((t) => t.priority === 'Critical');
      const highPriorityCount = cluster.filter((t) => t.priority === 'High' || t.priority === 'Critical').length;

      if (totalWorkload > availableHours * 1.5 || (overload > 4 && highPriorityCount >= 2)) {
        severity = 'Critical';
      } else if (totalWorkload > availableHours || highPriorityCount >= 2 || cluster.length >= 3) {
        severity = 'High';
      } else if (cluster.length === 2 && totalWorkload <= availableHours && !hasCritical) {
        severity = 'Low';
      }

      const recs: string[] = [
        `Stagger deadlines by requesting an extension or shifting personal milestone for "${cluster[cluster.length - 1].title}" by 24–48 hours.`,
        `Pre-allocate dedicated focus sessions at least 2 days prior to ${affectedDates.join(', ')}.`,
        `Split larger tasks into smaller manageable checkpoints to monitor progress.`,
      ];
      if (overload > 0) {
        recs.unshift(
          `Deficit of ${overload}h detected. Reduce scope or increase daily working capacity temporarily from ${settings.dailyWorkingHours}h to ${Math.min(10, settings.dailyWorkingHours + 2)}h.`
        );
      }

      collisions.push({
        id: `col-cluster-${primary.id}-${Date.now().toString().slice(-4)}`,
        collisionType: 'Same-Deadline',
        severity,
        title: `Concurrent Deadlines Cluster (${cluster.length} Tasks)`,
        affectedTaskIds: cluster.map((t) => t.id),
        affectedDates,
        totalWorkloadHours: Math.round(totalWorkload * 10) / 10,
        availableWorkingHours: Math.max(0.5, availableHours),
        overloadHours: overload,
        explanation: `${cluster.length} tasks ("${cluster.map((t) => t.title).join('", "')}") have deadlines within ${clusterWindowHours} hours on ${affectedDates.join(' & ')}, demanding ${totalWorkload}h against ~${availableHours}h standard capacity.`,
        recommendations: recs,
        detectedAt: now.toISOString(),
        resolved: false,
      });
    }
  }

  // =========================================================================
  // RULE B: Cumulative Workload Overload before Milestone
  // =========================================================================
  let cumulativeHours = 0;
  for (let i = 0; i < windowTasks.length; i++) {
    const task = windowTasks[i];
    cumulativeHours += task.estimatedDuration;
    const taskDeadline = parseLocalDate(task.deadline);

    // Available hours from now until this deadline
    const available = calculateAvailableWorkingHours(
      now,
      taskDeadline,
      settings.workingDays,
      settings.dailyWorkingHours
    );

    const threshold = available * (settings.overloadThresholdRatio || 1.0);
    const deficit = Math.round((cumulativeHours - threshold) * 10) / 10;

    // Trigger if cumulative work exceeds available hours by more than 1.5 hours
    if (deficit > 1.5 && getHoursDiff(now, taskDeadline) > 0) {
      const tasksLeadingUp = windowTasks.slice(0, i + 1);
      const affectedIds = tasksLeadingUp.map((t) => t.id);

      // Check if we already have an overload collision covering exactly these tasks
      const alreadyFlagged = collisions.some(
        (c) =>
          c.collisionType === 'Workload-Overload' &&
          c.affectedTaskIds.includes(task.id) &&
          Math.abs(c.overloadHours - deficit) < 1.0
      );

      if (!alreadyFlagged) {
        let severity: CollisionSeverity = 'High';
        if (deficit > 6 || cumulativeHours / Math.max(1, available) > 1.5) {
          severity = 'Critical';
        } else if (deficit <= 3) {
          severity = 'Medium';
        }

        collisions.push({
          id: `col-overload-${task.id}-${Date.now().toString().slice(-4)}`,
          collisionType: 'Workload-Overload',
          severity,
          title: `Capacity Deficit before ${formatDateString(taskDeadline)}`,
          affectedTaskIds: affectedIds,
          affectedDates: [formatDateString(taskDeadline)],
          totalWorkloadHours: Math.round(cumulativeHours * 10) / 10,
          availableWorkingHours: Math.round(available * 10) / 10,
          overloadHours: deficit,
          explanation: `Cumulative workload of ${Math.round(cumulativeHours * 10) / 10}h across ${tasksLeadingUp.length} tasks exceeds available working capacity of ${Math.round(available * 10) / 10}h by ${deficit}h before ${task.title}'s deadline.`,
          recommendations: [
            `Begin high-effort items immediately rather than waiting for deadline week.`,
            `De-scope optional components or delegate subtasks where possible.`,
            `Use the Smart Schedule generator to distribute work evenly across available non-working buffer slots.`,
          ],
          detectedAt: now.toISOString(),
          resolved: false,
        });
        break; // Only flag the earliest significant cumulative overload to prevent spam
      }
    }
  }

  // =========================================================================
  // RULE C: Priority Clashing (Critical / High within 48 hours)
  // =========================================================================
  const urgentTasks = windowTasks.filter(
    (t) => t.priority === 'Critical' || t.priority === 'High'
  );

  for (let i = 0; i < urgentTasks.length; i++) {
    const t1 = urgentTasks[i];
    const d1 = parseLocalDate(t1.deadline);

    for (let j = i + 1; j < urgentTasks.length; j++) {
      const t2 = urgentTasks[j];
      const d2 = parseLocalDate(t2.deadline);
      const diffHours = Math.abs(getHoursDiff(d1, d2));

      if (diffHours <= 48 && diffHours > 0) {
        // Check if collision already noted under cluster
        const alreadyInSameDeadline = collisions.some(
          (c) =>
            c.collisionType === 'Same-Deadline' &&
            c.affectedTaskIds.includes(t1.id) &&
            c.affectedTaskIds.includes(t2.id)
        );

        if (!alreadyInSameDeadline) {
          const bothCritical = t1.priority === 'Critical' && t2.priority === 'Critical';
          const totalLoad = t1.estimatedDuration + t2.estimatedDuration;
          const severity: CollisionSeverity = bothCritical ? 'Critical' : totalLoad > 6 ? 'High' : 'Medium';

          collisions.push({
            id: `col-priority-${t1.id}-${t2.id}`,
            collisionType: 'Priority-Clash',
            severity,
            title: `High-Stakes Priority Clash (${t1.priority} vs ${t2.priority})`,
            affectedTaskIds: [t1.id, t2.id],
            affectedDates: [formatDateString(d1), formatDateString(d2)],
            totalWorkloadHours: Math.round(totalLoad * 10) / 10,
            availableWorkingHours: Math.round(settings.dailyWorkingHours * (diffHours / 24) * 10) / 10,
            overloadHours: Math.max(0, Math.round((totalLoad - settings.dailyWorkingHours * 1.5) * 10) / 10),
            explanation: `High priority item "${t1.title}" (${t1.priority}) and "${t2.title}" (${t2.priority}) are spaced only ${Math.round(diffHours)} hours apart, creating heavy context switching and elevated risk of burnout.`,
            recommendations: [
              `Complete and freeze "${t1.title}" before initiating final polish on "${t2.title}".`,
              `Schedule protected, uninterrupted deep work blocks of at least 2 hours each.`,
              `Establish a 1-day mental buffer between submissions to prevent review oversights.`,
            ],
            detectedAt: now.toISOString(),
            resolved: false,
          });
        }
      }
    }
  }

  // =========================================================================
  // RULE D: Explicit Scheduled Time Overlap
  // =========================================================================
  const scheduledTasks = incompleteTasks.filter((t) => t.scheduledStart && t.scheduledEnd);
  for (let i = 0; i < scheduledTasks.length; i++) {
    const a = scheduledTasks[i];
    const aStart = parseLocalDate(a.scheduledStart!).getTime();
    const aEnd = parseLocalDate(a.scheduledEnd!).getTime();

    for (let j = i + 1; j < scheduledTasks.length; j++) {
      const b = scheduledTasks[j];
      const bStart = parseLocalDate(b.scheduledStart!).getTime();
      const bEnd = parseLocalDate(b.scheduledEnd!).getTime();

      // Check overlap: max(start) < min(end)
      const overlapStart = Math.max(aStart, bStart);
      const overlapEnd = Math.min(aEnd, bEnd);

      if (overlapStart < overlapEnd) {
        const overlapMins = Math.round((overlapEnd - overlapStart) / (1000 * 60));
        collisions.push({
          id: `col-overlap-${a.id}-${b.id}`,
          collisionType: 'Time-Overlap',
          severity: 'Critical',
          title: `Direct Schedule Time Overlap`,
          affectedTaskIds: [a.id, b.id],
          affectedDates: [formatDateString(new Date(overlapStart))],
          totalWorkloadHours: a.estimatedDuration + b.estimatedDuration,
          availableWorkingHours: Math.round(((aEnd - aStart) / (1000 * 60 * 60)) * 10) / 10,
          overloadHours: Math.round((overlapMins / 60) * 10) / 10,
          explanation: `"${a.title}" and "${b.title}" are scheduled for the exact same time window with an overlap of ${overlapMins} minutes on ${formatDateString(new Date(overlapStart))}.`,
          recommendations: [
            `Re-generate schedule using Smart Schedule engine to automatically clear slot overlaps.`,
            `Manually adjust the time window for one of the overlapping tasks.`,
          ],
          detectedAt: now.toISOString(),
          resolved: false,
        });
      }
    }
  }

  // =========================================================================
  // RULE E: Back-to-Back Deadline Risk
  // =========================================================================
  for (let i = 0; i < windowTasks.length - 1; i++) {
    const current = windowTasks[i];
    const next = windowTasks[i + 1];

    if (current.estimatedDuration >= 3.0 && next.estimatedDuration >= 3.0) {
      const curDate = parseLocalDate(current.deadline);
      const nextDate = parseLocalDate(next.deadline);
      const diffHours = getHoursDiff(curDate, nextDate);

      // Between 6 hours and 28 hours apart
      if (diffHours > 0 && diffHours <= 28) {
        // Ensure not already flagged in cluster
        const alreadyFlagged = collisions.some(
          (c) =>
            (c.collisionType === 'Same-Deadline' || c.collisionType === 'Priority-Clash') &&
            c.affectedTaskIds.includes(current.id) &&
            c.affectedTaskIds.includes(next.id)
        );

        if (!alreadyFlagged) {
          const bufferNeeded = settings.bufferTime || 2;
          const severity: CollisionSeverity = diffHours < 16 ? 'High' : 'Medium';

          collisions.push({
            id: `col-b2b-${current.id}-${next.id}`,
            collisionType: 'Back-To-Back',
            severity,
            title: `Exhaustive Back-to-Back Deadlines`,
            affectedTaskIds: [current.id, next.id],
            affectedDates: [formatDateString(curDate), formatDateString(nextDate)],
            totalWorkloadHours: current.estimatedDuration + next.estimatedDuration,
            availableWorkingHours: Math.round(settings.dailyWorkingHours * (diffHours / 24) * 10) / 10,
            overloadHours: Math.max(0, Math.round(((current.estimatedDuration + next.estimatedDuration) - diffHours * 0.5) * 10) / 10),
            explanation: `Demanding tasks "${current.title}" (${current.estimatedDuration}h) and "${next.title}" (${next.estimatedDuration}h) conclude within ${Math.round(diffHours)}h of each other, breaching recommended ${bufferNeeded}h recovery buffer.`,
            recommendations: [
              `Finish "${current.title}" 24 hours prior to deadline to prevent spillover delay into "${next.title}".`,
              `Set up intermediate milestones for each phase.`,
            ],
            detectedAt: now.toISOString(),
            resolved: false,
          });
        }
      }
    }
  }

  return collisions;
}
