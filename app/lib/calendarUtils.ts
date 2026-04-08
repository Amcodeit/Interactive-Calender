// ================================================================
// Calendar Utility Functions
// ================================================================

export interface DayInfo {
  date: number;
  month: number; // 0-indexed
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holiday?: string;
  dateObj: Date;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MONTH_IMAGES: Record<number, string> = {
  0: '/images/january.png',
  1: '/images/february.png',
  2: '/images/march.png',
  3: '/images/april.png',
  4: '/images/may.png',
  5: '/images/june.png',
  6: '/images/july.png',
  7: '/images/august.png',
  8: '/images/september.png',
  9: '/images/october.png',
  10: '/images/november.png',
  11: '/images/december.png',
};

// Seasonal color themes per month
export const MONTH_THEMES: Record<number, { accent: string; accentLight: string }> = {
  0: { accent: '#1976d2', accentLight: '#bbdefb' },   // Jan - icy blue
  1: { accent: '#7b1fa2', accentLight: '#e1bee7' },   // Feb - lavender
  2: { accent: '#388e3c', accentLight: '#c8e6c9' },   // Mar - fresh green
  3: { accent: '#e91e8e', accentLight: '#f8bbd0' },   // Apr - cherry pink
  4: { accent: '#7c4dff', accentLight: '#d1c4e9' },   // May - lavender purple
  5: { accent: '#f9a825', accentLight: '#fff9c4' },   // Jun - sunflower gold
  6: { accent: '#00acc1', accentLight: '#b2ebf2' },   // Jul - ocean teal
  7: { accent: '#1565c0', accentLight: '#90caf9' },   // Aug - mediterranean blue
  8: { accent: '#ef6c00', accentLight: '#ffe0b2' },   // Sep - harvest orange
  9: { accent: '#d84315', accentLight: '#ffccbc' },   // Oct - autumn red-orange
  10: { accent: '#5d4037', accentLight: '#d7ccc8' },  // Nov - warm brown
  11: { accent: '#283593', accentLight: '#c5cae9' },  // Dec - winter navy
};

// US Holidays (simplified - month is 0-indexed)
export const HOLIDAYS: Record<string, string> = {
  '0-1': "New Year's Day",
  '0-20': "Martin Luther King Jr. Day",
  '1-14': "Valentine's Day",
  '1-17': "Presidents' Day",
  '2-17': "St. Patrick's Day",
  '3-1': "April Fools' Day",
  '4-27': "Memorial Day",
  '5-19': "Juneteenth",
  '6-4': "Independence Day",
  '8-1': "Labor Day",
  '9-14': "Columbus Day",
  '9-31': "Halloween",
  '10-11': "Veterans Day",
  '10-27': "Thanksgiving",
  '11-25': "Christmas Day",
  '11-31': "New Year's Eve",
};

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of the week for the first day of the month (0 = Monday, 6 = Sunday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert from Sunday=0 to Monday=0
  return day === 0 ? 6 : day - 1;
}

/**
 * Generate all day info objects for a calendar view (includes prev/next month days)
 */
export function generateCalendarDays(year: number, month: number): DayInfo[] {
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month === 0 ? 11 : month - 1);

  const days: DayInfo[] = [];

  // Previous month trailing days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  for (let i = firstDay - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i;
    const dayOfWeek = (firstDay - i - 1 + 7) % 7;
    days.push({
      date,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: dayOfWeek >= 5,
      dateObj: new Date(prevYear, prevMonth, date),
    });
  }

  // Current month days
  for (let date = 1; date <= daysInMonth; date++) {
    const dayIndex = (firstDay + date - 1) % 7;
    const isWeekend = dayIndex >= 5;
    const holidayKey = `${month}-${date}`;
    days.push({
      date,
      month,
      year,
      isCurrentMonth: true,
      isToday: date === todayDate && month === todayMonth && year === todayYear,
      isWeekend,
      holiday: HOLIDAYS[holidayKey],
      dateObj: new Date(year, month, date),
    });
  }

  // Next month leading days
  const remaining = 42 - days.length; // Always show 6 rows
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let date = 1; date <= remaining; date++) {
    const totalIndex = days.length;
    const dayIndex = totalIndex % 7;
    days.push({
      date,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: dayIndex >= 5,
      dateObj: new Date(nextYear, nextMonth, date),
    });
  }

  return days;
}

/**
 * Check if a date is between two dates (inclusive)
 */
export function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const d = date.getTime();
  const s = start.getTime();
  const e = end.getTime();
  const min = Math.min(s, e);
  const max = Math.max(s, e);
  return d >= min && d <= max;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

/**
 * Format a date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  const s = start.getTime() <= end.getTime() ? start : end;
  const e = start.getTime() <= end.getTime() ? end : start;

  if (isSameDay(s, e)) {
    return `${MONTH_NAMES_SHORT[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()}`;
  }

  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${MONTH_NAMES_SHORT[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
  }

  return `${MONTH_NAMES_SHORT[s.getMonth()]} ${s.getDate()} – ${MONTH_NAMES_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

/**
 * Get the number of days in a range
 */
export function getRangeDays(start: Date, end: Date): number {
  const diff = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Generate mini calendar days (just numbers)
 */
export function generateMiniCalendarDays(year: number, month: number): (number | null)[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return days;
}

/**
 * localStorage helpers
 */
export function saveNotes(key: string, notes: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`calendar-notes-${key}`, notes);
  }
}

export function loadNotes(key: string): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`calendar-notes-${key}`) || '';
  }
  return '';
}

export function getNoteKey(year: number, month: number, startDate?: Date | null, endDate?: Date | null): string {
  if (startDate && endDate) {
    return `range-${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
  }
  return `month-${year}-${month}`;
}
