/**
 * Date utilities for handling timezone-safe date operations
 *
 * Storage strategy: Dates are stored as UTC noon (12:00:00 UTC)
 * This ensures the date is the same in all timezones from UTC-12 to UTC+12
 */

/**
 * Format a date for display in the user's local timezone
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date for the HTML date input (YYYY-MM-DD in local timezone)
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Get the date parts in local timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date formatted for HTML date input
 */
export function getTodayForInput(): string {
  return formatDateForInput(new Date());
}

/**
 * Format a relative date (e.g., "5 days ago", "in 3 days")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Compare dates without time
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = dateOnly.getTime() - todayOnly.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

/**
 * Events are date-only when stored at the 12:00:00 UTC sentinel (see storage
 * strategy above); any other stored time is a real, user-chosen time.
 */
export function isDateOnlyEvent(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getUTCHours() === 12 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
}

/**
 * Format a date's time for the HTML time input (HH:mm in local timezone)
 */
export function formatTimeForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Combine date + time form inputs into a UTC ISO string. Must run in the
 * browser so the user's timezone is applied — the server runs in UTC.
 */
export function combineDateTimeToISO(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}`).toISOString();
}
