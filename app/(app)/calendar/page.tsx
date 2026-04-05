import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CalendarView } from "@/components/calendar/calendar-view";

interface OOOBlock {
  id: string;
  contactId: string;
  contactName: string;
  isSelf: boolean;
  startDate: Date;
  endDate: Date;
  label: string | null;
  destination: string | null;
}

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
      where: { userId: user.id, isArchived: false, isSelf: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Get user's own OOO periods (from self-contact)
  const now = new Date();
  const selfContact = await prisma.contact.findFirst({
    where: { userId: user.id, isSelf: true },
    select: {
      id: true,
      name: true,
      oooPeriods: { orderBy: { startDate: "asc" } },
    },
  });
  const userOOOPeriods = selfContact?.oooPeriods ?? [];

  // Get contacts with cadence to calculate due dates (include OOO periods)
  const contacts = await prisma.contact.findMany({
    where: {
      userId: user.id,
      isArchived: false,
      isSelf: false,
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
      oooPeriods: {
        orderBy: { startDate: "asc" },
      },
    },
  });

  // Calculate due dates for each contact (adjusting for OOO periods)
  const contactDueDates = contacts.map((contact) => {
    const pastEvents = contact.events.filter((e) => e.event.date <= now);
    const lastPastEvent = pastEvents[0]?.event;

    const futureEvents = contact.events
      .filter((e) => e.event.date > now)
      .sort((a, b) => a.event.date.getTime() - b.event.date.getTime());
    const nextFutureEvent = futureEvents[0]?.event;

    let dueDate: Date | null = null;
    let isFutureDueDate = false;

    if (contact.cadenceDays) {
      if (nextFutureEvent) {
        dueDate = new Date(nextFutureEvent.date);
        dueDate.setDate(dueDate.getDate() + contact.cadenceDays);
        isFutureDueDate = true;
      } else if (lastPastEvent) {
        dueDate = new Date(lastPastEvent.date);
        dueDate.setDate(dueDate.getDate() + contact.cadenceDays);
      } else {
        dueDate = new Date();
      }

      // Shift due date past contact's OOO periods AND user's OOO periods
      const allBlockingPeriods = [...contact.oooPeriods, ...userOOOPeriods];
      if (dueDate && allBlockingPeriods.length > 0) {
        let changed = true;
        while (changed) {
          changed = false;
          for (const period of allBlockingPeriods) {
            if (dueDate >= period.startDate && dueDate <= period.endDate) {
              dueDate = new Date(period.endDate);
              dueDate.setDate(dueDate.getDate() + 1);
              changed = true;
            }
          }
        }
      }
    }

    return {
      id: contact.id,
      name: contact.name,
      cadenceDays: contact.cadenceDays,
      tags: contact.tags,
      dueDate,
      isFutureDueDate,
    };
  }).filter((c): c is typeof c & { dueDate: Date } => c.dueDate !== null);

  // Get OOO periods for all contacts (including self) that overlap with the view
  const oooContacts = await prisma.contact.findMany({
    where: {
      userId: user.id,
      oooPeriods: {
        some: {
          OR: [
            { startDate: { lte: endOfView }, endDate: { gte: startOfView } },
          ],
        },
      },
    },
    select: {
      id: true,
      name: true,
      isSelf: true,
      oooPeriods: {
        where: {
          startDate: { lte: endOfView },
          endDate: { gte: startOfView },
        },
        orderBy: { startDate: "asc" },
      },
    },
  });

  const oooBlocks: OOOBlock[] = oooContacts.flatMap((contact) =>
    contact.oooPeriods.map((period) => ({
      id: period.id,
      contactId: contact.id,
      contactName: contact.isSelf ? "You" : contact.name,
      isSelf: contact.isSelf,
      startDate: period.startDate,
      endDate: period.endDate,
      label: period.label,
      destination: period.destination,
    }))
  );

  const selfContactInfo = selfContact ? { id: selfContact.id, name: selfContact.name } : null;

  return { events, contactDueDates, allContacts, oooBlocks, selfContactInfo };
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

  const { events, contactDueDates, allContacts, oooBlocks, selfContactInfo } = await getCalendarData(year, month);

  return (
    <div className="space-y-6">
      <h1 className="text-[2rem] font-semibold leading-tight">Calendar</h1>
      <CalendarView
        events={events}
        contactDueDates={contactDueDates}
        contacts={allContacts}
        selfContact={selfContactInfo}
        oooBlocks={oooBlocks}
        year={year}
        month={month}
      />
    </div>
  );
}
