import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { calculateContactStatus } from "@/lib/cadence";
import { ContactsView } from "@/components/contacts/contacts-view";
import { FunnelStage } from "@/types";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    tagId?: string;
    funnelStage?: string;
    status?: string;
    archived?: string;
  }>;
}

async function getContacts(searchParams: {
  search?: string;
  tagId?: string;
  funnelStage?: string;
  status?: string;
  archived?: string;
}) {
  const user = await requireUser();
  const { search, tagId, funnelStage, status, archived } = searchParams;

  const contacts = await prisma.contact.findMany({
    where: {
      userId: user.id,
      isSelf: false,
      isArchived: archived === "true" ? true : false,
      ...(tagId && {
        tags: { some: { tagId } },
      }),
      ...(funnelStage && {
        funnelStage: funnelStage as FunnelStage,
      }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { nickname: { contains: search } },
        ],
      }),
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
    orderBy: { name: "asc" },
  });

  const now = new Date();

  // Get user's own OOO periods
  const selfContact = await prisma.contact.findFirst({
    where: { userId: user.id, isSelf: true },
    select: { oooPeriods: { orderBy: { startDate: "asc" } } },
  });
  const userOOOPeriods = selfContact?.oooPeriods ?? [];

  const contactsWithStatus = contacts.map((contact) => {
    const pastEvents = contact.events.filter((e) => e.event.date <= now);
    const futureEvents = contact.events.filter((e) => e.event.date > now);

    const lastEvent = pastEvents[0]?.event;
    const lastEventDate = lastEvent?.date ?? null;

    const nextEvent = futureEvents[futureEvents.length - 1]?.event;
    const nextEventDate = nextEvent?.date ?? null;

    const allOOOPeriods = [...contact.oooPeriods, ...userOOOPeriods];
    const contactStatus = calculateContactStatus(lastEventDate, contact.cadenceDays, nextEventDate, allOOOPeriods);
    return {
      ...contact,
      lastEventDate,
      status: contactStatus,
    };
  });

  // Filter by status if requested
  if (status === "due") {
    return contactsWithStatus.filter((c) => c.status.isDue);
  } else if (status === "overdue") {
    return contactsWithStatus.filter((c) => c.status.isOverdue);
  } else if (status === "ok") {
    return contactsWithStatus.filter((c) => !c.status.isDue && !c.status.isOverdue);
  }

  return contactsWithStatus;
}

async function getTags() {
  const user = await requireUser();
  return prisma.tag.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [contacts, tags] = await Promise.all([getContacts(params), getTags()]);

  return <ContactsView contacts={contacts} tags={tags} />;
}
