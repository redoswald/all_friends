/**
 * Cadence status calculation — direct port of lib/cadence.ts.
 * Determines whether a contact is due, overdue, or away,
 * with OOO-aware due date shifting.
 */

export function calculateContactStatus(
  lastEventDate,
  cadenceDays,
  nextEventDate = null,
  oooPeriods = []
) {
  const now = new Date();
  const daysSince = lastEventDate ? daysBetween(lastEventDate, now) : null;
  const hasCadence = cadenceDays !== null;
  const hasUpcomingEvent = nextEventDate !== null;
  const daysUntilNextEvent = nextEventDate
    ? daysBetween(now, nextEventDate)
    : null;

  const currentOOOPeriod =
    oooPeriods.find(
      (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
    ) || null;

  const isAway = currentOOOPeriod !== null;
  const daysUntilBack = isAway
    ? daysBetween(now, new Date(currentOOOPeriod.endDate))
    : null;

  const upcomingOOOCount = oooPeriods.filter(
    (p) => new Date(p.startDate) > now
  ).length;

  if (!lastEventDate || !cadenceDays) {
    return {
      daysSinceLastEvent: daysSince,
      daysUntilDue: null,
      isDue: !isAway && !lastEventDate && hasCadence && !hasUpcomingEvent,
      isDueSoon: false,
      isOverdue: false,
      hasCadence,
      hasUpcomingEvent,
      daysUntilNextEvent,
      isAway,
      daysUntilBack,
      currentOOOPeriod: currentOOOPeriod
        ? {
            label: currentOOOPeriod.label,
            endDate: new Date(currentOOOPeriod.endDate),
            destination: currentOOOPeriod.destination,
          }
        : null,
      upcomingOOOCount,
    };
  }

  const baseDueDate = new Date(lastEventDate);
  baseDueDate.setDate(baseDueDate.getDate() + cadenceDays);

  const adjustedDueDate = findNextAvailableDate(baseDueDate, oooPeriods);
  const daysUntil =
    daysBetween(now, adjustedDueDate) * (adjustedDueDate >= now ? 1 : -1);

  return {
    daysSinceLastEvent: daysSince,
    daysUntilDue: daysUntil,
    isDue: !isAway && !hasUpcomingEvent && daysUntil <= 7 && daysUntil > 0,
    isDueSoon:
      !isAway && !hasUpcomingEvent && daysUntil <= 14 && daysUntil > 7,
    isOverdue: !isAway && !hasUpcomingEvent && daysUntil <= 0,
    hasCadence,
    hasUpcomingEvent,
    daysUntilNextEvent,
    isAway,
    daysUntilBack,
    currentOOOPeriod: currentOOOPeriod
      ? {
          label: currentOOOPeriod.label,
          endDate: new Date(currentOOOPeriod.endDate),
          destination: currentOOOPeriod.destination,
        }
      : null,
    upcomingOOOCount,
  };
}

function findNextAvailableDate(date, periods) {
  let result = new Date(date);
  let changed = true;

  while (changed) {
    changed = false;
    for (const period of periods) {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      if (result >= start && result <= end) {
        result = new Date(end);
        result.setDate(result.getDate() + 1);
        changed = true;
      }
    }
  }

  return result;
}

export function daysBetween(date1, date2) {
  const diffTime = new Date(date2).getTime() - new Date(date1).getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
