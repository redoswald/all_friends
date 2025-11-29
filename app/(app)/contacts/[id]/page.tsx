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
    },
    include: {
      tags: {
        include: { tag: true },
      },
      events: {
        include: {
          event: {
            include: {
              contacts: {
                include: { contact: true },
              },
            },
          },
        },
        orderBy: { event: { date: "desc" } },
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

  const status = calculateContactStatus(lastEventDate, contact.cadenceDays, nextEventDate, contact.awayUntil);

  return {
    ...contact,
    lastEventDate,
    status,
  };
}

async function getTags() {
  const user = await requireUser();
  return prisma.tag.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
}

async function getContacts() {
  const user = await requireUser();
  return prisma.contact.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export default async function ContactPage({ params }: PageProps) {
  const { id } = await params;
  const [contact, tags, contacts] = await Promise.all([
    getContact(id),
    getTags(),
    getContacts(),
  ]);

  if (!contact) {
    notFound();
  }

  return <ContactDetail contact={contact} tags={tags} contacts={contacts} />;
}
