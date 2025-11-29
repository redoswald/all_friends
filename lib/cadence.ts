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
}

export function calculateContactStatus(
  lastEventDate: Date | null,
  cadenceDays: number | null,
  nextEventDate: Date | null = null,
  awayUntil: Date | null = null
): ContactStatus {
  const now = new Date();
  const daysSince = lastEventDate ? daysBetween(lastEventDate, now) : null;
  const hasCadence = cadenceDays !== null;
  const hasUpcomingEvent = nextEventDate !== null;
  const daysUntilNextEvent = nextEventDate ? daysBetween(now, nextEventDate) : null;

  // Check if contact is currently away
  const isAway = awayUntil !== null && awayUntil > now;
  const daysUntilBack = isAway ? daysBetween(now, awayUntil) : null;

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
    };
  }

  // Calculate base days until due
  let daysUntil = cadenceDays - daysSince!;

  // If contact is away and would be due before they return,
  // push the due date to after they return
  if (isAway && daysUntil < daysUntilBack!) {
    daysUntil = daysUntilBack!;
  }

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
  };
}

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
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
