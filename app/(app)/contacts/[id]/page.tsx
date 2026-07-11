import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { calculateContactStatus } from "@/lib/cadence";
import { ContactDetail } from "@/components/contacts/contact-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getContact(id: string) {
  const user = await requireUser();

  const contact = await prisma.contact.findFirst({
    where: {
      id,
      userId: user.id,
      deletedAt: null,
    },
    include: {
      tags: {
        where: { tag: { deletedAt: null } },
        include: { tag: true },
      },
      events: {
        where: { event: { deletedAt: null } },
        include: {
          event: {
            include: {
              contacts: {
                where: { contact: { deletedAt: null } },
                include: { contact: true },
              },
            },
          },
        },
        orderBy: { event: { date: "desc" } },
      },
      // New Monica-like features
      fields: {
        orderBy: { sortOrder: "asc" },
      },
      importantDates: {
        orderBy: [{ dateType: "asc" }, { month: "asc" }, { day: "asc" }],
      },
      relationships: {
        where: { relatedContact: { deletedAt: null } },
        include: {
          relatedContact: {
            select: { id: true, name: true },
          },
        },
      },
      relatedRelationships: {
        where: { contact: { deletedAt: null } },
        include: {
          contact: {
            select: { id: true, name: true },
          },
        },
      },
      oooPeriods: {
        orderBy: { startDate: "asc" },
      },
    },
  });

  if (!contact) {
    return null;
  }

  // Separate past and future events
  const now = new Date();
  const pastEvents = contact.events.filter((e) => e.event.date <= now);
  const futureEvents = contact.events.filter((e) => e.event.date > now);

  const lastEvent = pastEvents[0]?.event;
  const lastEventDate = lastEvent?.date ?? null;

  // Get the nearest future event (sorted desc, so last one is nearest)
  const nextEvent = futureEvents[futureEvents.length - 1]?.event;
  const nextEventDate = nextEvent?.date ?? null;

  const status = calculateContactStatus(lastEventDate, contact.cadenceDays, nextEventDate, contact.oooPeriods);

  return {
    ...contact,
    lastEventDate,
    status,
  };
}

async function getTags() {
  const user = await requireUser();
  return prisma.tag.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

async function getContacts() {
  const user = await requireUser();
  return prisma.contact.findMany({
    where: { userId: user.id, isArchived: false, isSelf: false, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

async function getMentionedInEvents(contactId: string) {
  const user = await requireUser();
  const mentions = await prisma.eventMention.findMany({
    where: { contactId, event: { deletedAt: null } },
    include: {
      event: {
        include: {
          contacts: {
            where: { contact: { deletedAt: null } },
            include: { contact: true },
          },
        },
      },
    },
  });
  // Filter to user's events and return just the events
  return mentions
    .filter((m) => m.event.userId === user.id)
    .map((m) => m.event);
}

export default async function ContactPage({ params }: PageProps) {
  const { id } = await params;
  const [contact, tags, contacts, mentionedInEvents] = await Promise.all([
    getContact(id),
    getTags(),
    getContacts(),
    getMentionedInEvents(id),
  ]);

  if (!contact) {
    notFound();
  }

  return <ContactDetail contact={contact} tags={tags} contacts={contacts} mentionedInEvents={mentionedInEvents} />;
}
