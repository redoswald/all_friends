import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { calculateContactStatus } from "@/lib/cadence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, AlertCircle, Clock, UserPlus } from "lucide-react";
import Link from "next/link";
import { NeedsAttentionList } from "@/components/dashboard/needs-attention-list";

// Check if a contact is "incomplete" - only has name and default values
function isIncompleteContact(contact: {
  nickname: string | null;
  relationship: string | null;
  notes: string | null;
  cadenceDays: number | null;
  funnelStage: string;
  tags: unknown[];
}): boolean {
  return (
    !contact.nickname &&
    !contact.relationship &&
    !contact.notes &&
    !contact.cadenceDays &&
    contact.funnelStage === "ACQUAINTANCE" &&
    contact.tags.length === 0
  );
}

async function getDashboardData() {
  const user = await requireUser();

  const now = new Date();
  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
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

  const contactsWithStatus = contacts.map((contact) => {
    const pastEvents = contact.events.filter((e) => e.event.date <= now);
    const futureEvents = contact.events.filter((e) => e.event.date > now);

    const lastEvent = pastEvents[0]?.event;
    const lastEventDate = lastEvent?.date ?? null;

    const nextEvent = futureEvents[futureEvents.length - 1]?.event;
    const nextEventDate = nextEvent?.date ?? null;

    const status = calculateContactStatus(lastEventDate, contact.cadenceDays, nextEventDate, contact.awayUntil);
    return {
      ...contact,
      lastEventDate,
      status,
    };
  });

  const needsAttention = contactsWithStatus
    .filter((c) => {
      // Exclude snoozed contacts
      if (c.snoozedUntil && new Date(c.snoozedUntil) > now) {
        return false;
      }
      return c.status.isDue || c.status.isOverdue;
    })
    .sort((a, b) => {
      if (a.status.isOverdue && !b.status.isOverdue) return -1;
      if (!a.status.isOverdue && b.status.isOverdue) return 1;
      return (a.status.daysUntilDue ?? 0) - (b.status.daysUntilDue ?? 0);
    });

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const eventsThisMonth = await prisma.event.count({
    where: {
      userId: user.id,
      date: { gte: startOfMonth },
    },
  });

  // Find incomplete contacts (created but never filled out)
  const incompleteContacts = contacts.filter(isIncompleteContact);

  // Count excluding snoozed contacts
  const nonSnoozedContacts = contactsWithStatus.filter(
    (c) => !c.snoozedUntil || new Date(c.snoozedUntil) <= now
  );

  return {
    needsAttention,
    incompleteContacts,
    stats: {
      totalContacts: contacts.length,
      eventsThisMonth,
      overdueContacts: nonSnoozedContacts.filter((c) => c.status.isOverdue).length,
      dueContacts: nonSnoozedContacts.filter((c) => c.status.isDue).length,
      incompleteContacts: incompleteContacts.length,
    },
  };
}

export default async function DashboardPage() {
  const { needsAttention, incompleteContacts, stats } = await getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Contacts</span>
            </div>
            <p className="text-2xl font-semibold mt-1">{stats.totalContacts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Events this month</span>
            </div>
            <p className="text-2xl font-semibold mt-1">{stats.eventsThisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-gray-500">Overdue</span>
            </div>
            <p className="text-2xl font-semibold mt-1 text-red-600">{stats.overdueContacts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-gray-500">Due soon</span>
            </div>
            <p className="text-2xl font-semibold mt-1 text-amber-600">{stats.dueContacts}</p>
          </CardContent>
        </Card>

        {stats.incompleteContacts > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-500">Incomplete</span>
              </div>
              <p className="text-2xl font-semibold mt-1 text-blue-600">{stats.incompleteContacts}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Needs Attention</CardTitle>
        </CardHeader>
        <CardContent>
          <NeedsAttentionList
            contacts={needsAttention}
            totalContacts={stats.totalContacts}
          />
        </CardContent>
      </Card>

      {incompleteContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incomplete Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              These contacts were quickly added and need more details.
            </p>
            <div className="space-y-2">
              {incompleteContacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-500">
                        Added {new Date(contact.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    Needs details
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
