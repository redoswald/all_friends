export interface OOOPeriod {
  startDate: Date;
  endDate: Date;
  label?: string | null;
}

export interface ContactStatus {
  daysSinceLastEvent: number | null;
  daysUntilDue: number | null;
  isDue: boolean;
  isDueSoon: boolean; // Under 14 days until due
  isOverdue: boolean;
  hasCadence: boolean;
  hasUpcomingEvent: boolean;
  daysUntilNextEvent: number | null;
  isAway: boolean;
  daysUntilBack: number | null;
  currentOOOPeriod: { label?: string | null; endDate: Date } | null;
  upcomingOOOCount: number;
}

export function calculateContactStatus(
  lastEventDate: Date | null,
  cadenceDays: number | null,
  nextEventDate: Date | null = null,
  oooPeriods: OOOPeriod[] = []
): ContactStatus {
  const now = new Date();
  const daysSince = lastEventDate ? daysBetween(lastEventDate, now) : null;
  const hasCadence = cadenceDays !== null;
  const hasUpcomingEvent = nextEventDate !== null;
  const daysUntilNextEvent = nextEventDate ? daysBetween(now, nextEventDate) : null;

  // Find current OOO period (if contact is currently away)
  const currentOOOPeriod = oooPeriods.find(
    (p) => p.startDate <= now && p.endDate >= now
  ) || null;

  const isAway = currentOOOPeriod !== null;
  const daysUntilBack = isAway ? daysBetween(now, currentOOOPeriod!.endDate) : null;

  // Count future OOO periods (for UI badge)
  const upcomingOOOCount = oooPeriods.filter((p) => p.startDate > now).length;

  if (!lastEventDate || !cadenceDays) {
    return {
      daysSinceLastEvent: daysSince,
      daysUntilDue: null,
      // If contact is away, they're not due
      isDue: !isAway && !lastEventDate && hasCadence && !hasUpcomingEvent,
      isDueSoon: false,
      isOverdue: false,
      hasCadence,
      hasUpcomingEvent,
      daysUntilNextEvent,
      isAway,
      daysUntilBack,
      currentOOOPeriod: currentOOOPeriod
        ? { label: currentOOOPeriod.label, endDate: currentOOOPeriod.endDate }
        : null,
      upcomingOOOCount,
    };
  }

  // Calculate base due date
  const baseDueDate = new Date(lastEventDate);
  baseDueDate.setDate(baseDueDate.getDate() + cadenceDays);

  // Find the next available date after all OOO periods
  const adjustedDueDate = findNextAvailableDate(baseDueDate, oooPeriods);
  const daysUntil = daysBetween(now, adjustedDueDate) * (adjustedDueDate >= now ? 1 : -1);

  return {
    daysSinceLastEvent: daysSince,
    daysUntilDue: daysUntil,
    // Not due/overdue if contact is away or there's an upcoming event planned
    isDue: !isAway && !hasUpcomingEvent && daysUntil <= 7 && daysUntil > 0,
    isDueSoon: !isAway && !hasUpcomingEvent && daysUntil <= 14 && daysUntil > 7,
    isOverdue: !isAway && !hasUpcomingEvent && daysUntil <= 0,
    hasCadence,
    hasUpcomingEvent,
    daysUntilNextEvent,
    isAway,
    daysUntilBack,
    currentOOOPeriod: currentOOOPeriod
      ? { label: currentOOOPeriod.label, endDate: currentOOOPeriod.endDate }
      : null,
    upcomingOOOCount,
  };
}

/**
 * Find the next available date that doesn't fall within any OOO period.
 * If the date falls within a period, push it to the day after that period ends.
 * Handles overlapping periods by iterating until a clear date is found.
 */
function findNextAvailableDate(date: Date, periods: OOOPeriod[]): Date {
  let result = new Date(date);
  let changed = true;

  // Keep iterating until we find a date outside all periods
  while (changed) {
    changed = false;
    for (const period of periods) {
      if (result >= period.startDate && result <= period.endDate) {
        // Push to the day after this period ends
        result = new Date(period.endDate);
        result.setDate(result.getDate() + 1);
        changed = true;
      }
    }
  }

  return result;
}

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: ContactStatus): string {
  if (status.isOverdue) return "destructive";
  if (status.isDue) return "warning";
  return "success";
}

export function getStatusText(status: ContactStatus): string {
  if (status.isAway) {
    if (status.daysUntilBack === 0) return "Back today";
    if (status.daysUntilBack === 1) return "Back tomorrow";
    return `Away for ${status.daysUntilBack} days`;
  }
  if (status.hasUpcomingEvent) {
    if (status.daysUntilNextEvent === 0) return "Planned for today";
    if (status.daysUntilNextEvent === 1) return "Planned for tomorrow";
    return `Planned in ${status.daysUntilNextEvent} days`;
  }
  if (!status.hasCadence) return "No cadence set";
  if (status.daysUntilDue === null) return "Never seen";
  if (status.isOverdue) {
    const overdueDays = Math.abs(status.daysUntilDue);
    return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
  }
  if (status.isDue) {
    return `Due in ${status.daysUntilDue} day${status.daysUntilDue === 1 ? "" : "s"}`;
  }
  return `${status.daysUntilDue} days until due`;
}

/**
 * Calculate how many times per year you'd see someone based on cadence
 */
export function getAnnualFrequency(cadenceDays: number | null): number | null {
  if (!cadenceDays) return null;
  return Math.round(365 / cadenceDays);
}

/**
 * Get a formatted string for annual frequency
 */
export function getAnnualFrequencyText(cadenceDays: number | null): string {
  const frequency = getAnnualFrequency(cadenceDays);
  if (frequency === null) return "";
  return `~${frequency}x per year`;
}

export const CADENCE_OPTIONS = [
  { label: "Weekly", value: 7 },
  { label: "Biweekly", value: 14 },
  { label: "Monthly", value: 30 },
  { label: "Quarterly", value: 90 },
  { label: "Custom", value: "custom" },
  { label: "No target", value: null },
] as const;

export function isPresetCadence(days: number | null): boolean {
  if (days === null) return true;
  return [7, 14, 30, 90].includes(days);
}
