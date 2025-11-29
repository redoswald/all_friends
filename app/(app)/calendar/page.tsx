import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CalendarView } from "@/components/calendar/calendar-view";

async function getCalendarData(year: number, month: number) {
  const user = await requireUser();

  // Get first and last day of the month view (including overflow days)
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Extend to include full weeks
  const startOfView = new Date(firstOfMonth);
  startOfView.setDate(startOfView.getDate() - startOfView.getDay());

  const endOfView = new Date(lastOfMonth);
  endOfView.setDate(endOfView.getDate() + (6 - endOfView.getDay()));
  endOfView.setHours(23, 59, 59, 999);

  const [events, allContacts] = await Promise.all([
    prisma.event.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfView,
          lte: endOfView,
        },
      },
      include: {
        contacts: {
          include: {
            contact: {
              include: {
                tags: {
                  include: { tag: true },
                },
              },
            },
          },
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.contact.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Get contacts with cadence to calculate due dates
  const now = new Date();
  const contacts = await prisma.contact.findMany({
    where: {
      userId: user.id,
      cadenceDays: { not: null },
    },
    include: {
      tags: {
        include: { tag: true },
      },
      events: {
        include: { event: true },
        orderBy: { event: { date: "desc" } },
      },
    },
  });

  // Calculate due dates for each contact
  const contactDueDates = contacts.map((contact) => {
    // Get last past event
    const pastEvents = contact.events.filter((e) => e.event.date <= now);
    const lastPastEvent = pastEvents[0]?.event;

    // Get future events (already planned), sorted by date ascending
    const futureEvents = contact.events
      .filter((e) => e.event.date > now)
      .sort((a, b) => a.event.date.getTime() - b.event.date.getTime());
    const nextFutureEvent = futureEvents[0]?.event;

    // Check if contact is snoozed
    const isSnoozed = contact.snoozedUntil && new Date(contact.snoozedUntil) > now;

    // Calculate due date based on:
    // 1. If snoozed, due date = snooze end date
    // 2. If there's a future event, due date = future event date + cadence
    // 3. If no future event but has past event, due date = last past event + cadence
    // 4. If no events at all, due now
    let dueDate: Date | null = null;
    let isFutureDueDate = false;
    let isSnoozedDueDate = false;

    if (contact.cadenceDays) {
      if (isSnoozed) {
        // Snoozed - show on snooze end date
        dueDate = new Date(contact.snoozedUntil!);
        isSnoozedDueDate = true;
      } else if (nextFutureEvent) {
        // Calculate next due date after the planned future event
        dueDate = new Date(nextFutureEvent.date);
        dueDate.setDate(dueDate.getDate() + contact.cadenceDays);
        isFutureDueDate = true;
      } else if (lastPastEvent) {
        // Calculate due date from last past event
        dueDate = new Date(lastPastEvent.date);
        dueDate.setDate(dueDate.getDate() + contact.cadenceDays);
      } else {
        // Never seen - due now
        dueDate = new Date();
      }
    }

    return {
      id: contact.id,
      name: contact.name,
      cadenceDays: contact.cadenceDays,
      tags: contact.tags,
      dueDate,
      isFutureDueDate,
      isSnoozedDueDate,
    };
  }).filter((c): c is typeof c & { dueDate: Date } => c.dueDate !== null);

  return { events, contactDueDates, allContacts };
}

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth();

  const { events, contactDueDates, allContacts } = await getCalendarData(year, month);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <CalendarView
        events={events}
        contactDueDates={contactDueDates}
        contacts={allContacts}
        year={year}
        month={month}
      />
    </div>
  );
}
