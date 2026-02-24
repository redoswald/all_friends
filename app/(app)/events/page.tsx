import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EventsList } from "@/components/events/events-list";
import { EventsHeader } from "@/components/events/events-header";

async function getEvents() {
  const user = await requireUser();

  const events = await prisma.event.findMany({
    where: { userId: user.id },
    include: {
      contacts: {
        include: {
          contact: {
            include: { tags: { include: { tag: true } } },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return events;
}

async function getContacts() {
  const user = await requireUser();
  return prisma.contact.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export default async function EventsPage() {
  const [events, contacts] = await Promise.all([getEvents(), getContacts()]);

  return (
    <div className="space-y-6">
      <EventsHeader contacts={contacts} />
      <EventsList events={events} contacts={contacts} />
    </div>
  );
}
