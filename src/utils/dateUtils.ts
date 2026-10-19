/**
 * Date and time helper utilities for Smart Deadline Collision Detector
 */

export function parseLocalDate(dateStr: string): Date {
  // If format is YYYY-MM-DDTHH:mm or YYYY-MM-DD
  const [datePart, timePart] = dateStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  let hours = 0;
  let minutes = 0;
  if (timePart) {
    const [h, m] = timePart.split(':').map(Number);
    hours = h || 0;
    minutes = m || 0;
  }
  return new Date(year, month - 1, day, hours, minutes);
}

export function formatDateString(date: Date | string, format: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (format === 'MM/DD/YYYY') return `${m}/${day}/${y}`;
  if (format === 'DD/MM/YYYY') return `${day}/${m}/${y}`;
  return `${y}-${m}-${day}`;
}

export function formatTimeString(date: Date | string, is12h: boolean = true): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (!is12h) {
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function formatDateTime(dateStr: string, is12h: boolean = true): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const time = formatTimeString(d, is12h);

  return `${monthName} ${day}, ${year} at ${time}`;
}

export function getDayName(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

export function getFullDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

export function getMonthName(monthIndex: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === 'string' ? parseLocalDate(d1) : d1;
  const date2 = typeof d2 === 'string' ? parseLocalDate(d2) : d2;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getHoursDiff(date1: Date, date2: Date): number {
  return (date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
}

export function getDaysDiff(date1: Date, date2: Date): number {
  return (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
}

export function getRemainingTimeText(deadlineStr: string, now: Date = new Date()): {
  text: string;
  isOverdue: boolean;
  hoursRemaining: number;
} {
  const deadline = parseLocalDate(deadlineStr);
  const diffMs = deadline.getTime() - now.getTime();
  const totalHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    const absHours = Math.abs(totalHours);
    if (absHours < 24) {
      return {
        text: `Overdue by ${Math.floor(absHours)}h`,
        isOverdue: true,
        hoursRemaining: totalHours,
      };
    }
    const days = Math.floor(absHours / 24);
    return {
      text: `Overdue by ${days}d`,
      isOverdue: true,
      hoursRemaining: totalHours,
    };
  }

  if (totalHours < 1) {
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return {
      text: `Due in ${mins}m`,
      isOverdue: false,
      hoursRemaining: totalHours,
    };
  }

  if (totalHours < 24) {
    return {
      text: `Due in ${Math.floor(totalHours)}h`,
      isOverdue: false,
      hoursRemaining: totalHours,
    };
  }

  const days = Math.floor(totalHours / 24);
  const remainingHours = Math.floor(totalHours % 24);
  return {
    text: days === 1 ? `Due tomorrow (${remainingHours}h)` : `Due in ${days}d`,
    isOverdue: false,
    hoursRemaining: totalHours,
  };
}

/**
 * Calculates available working hours between two dates based on user working days and daily hours limit
 */
export function calculateAvailableWorkingHours(
  startDate: Date,
  endDate: Date,
  workingDays: number[],
  dailyWorkingHours: number
): number {
  if (endDate.getTime() <= startDate.getTime()) return 0;

  let totalHours = 0;
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const targetEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  while (current.getTime() <= targetEnd.getTime()) {
    const dayOfWeek = current.getDay();
    if (workingDays.includes(dayOfWeek)) {
      if (isSameDay(current, startDate) && isSameDay(current, endDate)) {
        // Same day: proportion of day
        const dayFraction = Math.min(1, Math.max(0, getHoursDiff(startDate, endDate) / 10));
        totalHours += dailyWorkingHours * dayFraction;
      } else if (isSameDay(current, startDate)) {
        // First day
        const hoursLeftInDay = Math.max(0, 18 - startDate.getHours());
        const dayFraction = Math.min(1, Math.max(0, hoursLeftInDay / 8));
        totalHours += dailyWorkingHours * dayFraction;
      } else if (isSameDay(current, endDate)) {
        // Last day
        const hoursPassedInDay = Math.max(0, endDate.getHours() - 9);
        const dayFraction = Math.min(1, Math.max(0, hoursPassedInDay / 8));
        totalHours += dailyWorkingHours * dayFraction;
      } else {
        totalHours += dailyWorkingHours;
      }
    }
    // Advance 1 day
    current.setDate(current.getDate() + 1);
  }

  return Math.max(0.5, Math.round(totalHours * 10) / 10);
}

/**
 * Returns an array of dates representing the calendar month grid (including previous/next month filler days)
 */
export function getMonthDaysGrid(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const totalDays = lastDayOfMonth.getDate();

  const grid: Date[] = [];

  // Previous month days to pad
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    grid.push(new Date(year, month, -i));
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    grid.push(new Date(year, month, day));
  }

  // Next month days to make complete 35 or 42 grid
  const remainingCells = (7 - (grid.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    grid.push(new Date(year, month + 1, i));
  }

  return grid;
}

/**
 * Returns the 7 days of the week for a given target date (Sunday to Saturday)
 */
export function getWeekDates(targetDate: Date): Date[] {
  const dayOfWeek = targetDate.getDay();
  const startOfWeek = new Date(targetDate);
  startOfWeek.setDate(targetDate.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    week.push(d);
  }
  return week;
}
