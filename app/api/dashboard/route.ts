import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { calculateContactStatus } from "@/lib/cadence";

export async function GET() {
  try {
    const user = await requireUser();

    // Get all contacts with their latest event and OOO periods
    const contacts = await prisma.contact.findMany({
      where: { userId: user.id },
      include: {
        tags: {
          include: { tag: true },
        },
        events: {
          include: { event: true },
          orderBy: { event: { date: "desc" } },
          take: 1,
        },
        oooPeriods: {
          orderBy: { startDate: "asc" },
        },
      },
    });

    // Calculate status for each contact
    const contactsWithStatus = contacts.map((contact) => {
      const lastEvent = contact.events[0]?.event;
      const lastEventDate = lastEvent?.date ?? null;
      const status = calculateContactStatus(lastEventDate, contact.cadenceDays, null, contact.oooPeriods);
      return {
        ...contact,
        lastEventDate,
        status,
      };
    });

    // Filter and sort needs attention contacts
    const needsAttention = contactsWithStatus
      .filter((c) => c.status.isDue || c.status.isOverdue)
      .sort((a, b) => {
        // Overdue first, then by how overdue/due
        if (a.status.isOverdue && !b.status.isOverdue) return -1;
        if (!a.status.isOverdue && b.status.isOverdue) return 1;
        return (a.status.daysUntilDue ?? 0) - (b.status.daysUntilDue ?? 0);
      });

    // Get events this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const eventsThisMonth = await prisma.event.count({
      where: {
        userId: user.id,
        date: {
          gte: startOfMonth,
        },
      },
    });

    const stats = {
      totalContacts: contacts.length,
      eventsThisMonth,
      overdueContacts: contactsWithStatus.filter((c) => c.status.isOverdue).length,
      dueContacts: contactsWithStatus.filter((c) => c.status.isDue).length,
    };

    return NextResponse.json({
      needsAttention,
      stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
