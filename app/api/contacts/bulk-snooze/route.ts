import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bulkSnoozeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  snoozeDays: z.number().int().positive(),
});

async function getUserFromCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("prm_session")?.value;
  if (!sessionId) return null;
  return prisma.user.findUnique({ where: { id: sessionId } });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, snoozeDays } = bulkSnoozeSchema.parse(body);

    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const now = new Date();

    // Get all contacts with cadence for this user
    const contacts = await prisma.contact.findMany({
      where: {
        userId: user.id,
        cadenceDays: { not: null },
      },
      include: {
        events: {
          include: { event: true },
          orderBy: { event: { date: "desc" } },
        },
      },
    });

    // Calculate due dates and find contacts due within the range
    const contactsToSnooze: string[] = [];

    for (const contact of contacts) {
      // Skip already snoozed contacts
      if (contact.snoozedUntil && new Date(contact.snoozedUntil) > now) {
        continue;
      }

      // Get past and future events
      const pastEvents = contact.events.filter((e) => e.event.date <= now);
      const futureEvents = contact.events
        .filter((e) => e.event.date > now)
        .sort((a, b) => a.event.date.getTime() - b.event.date.getTime());

      const lastPastEvent = pastEvents[0]?.event;
      const nextFutureEvent = futureEvents[0]?.event;

      let dueDate: Date | null = null;

      if (contact.cadenceDays) {
        if (nextFutureEvent) {
          // Due date is after the planned future event
          dueDate = new Date(nextFutureEvent.date);
          dueDate.setDate(dueDate.getDate() + contact.cadenceDays);
        } else if (lastPastEvent) {
          // Due date from last past event
          dueDate = new Date(lastPastEvent.date);
          dueDate.setDate(dueDate.getDate() + contact.cadenceDays);
        } else {
          // Never seen - due now
          dueDate = new Date();
        }
      }

      // Check if due date falls within the range
      if (dueDate && dueDate >= rangeStart && dueDate <= rangeEnd) {
        contactsToSnooze.push(contact.id);
      }
    }

    if (contactsToSnooze.length === 0) {
      return NextResponse.json({
        message: "No contacts with due dates in this range",
        count: 0,
      });
    }

    // Calculate snooze end date
    const snoozedUntil = new Date(Date.now() + snoozeDays * 24 * 60 * 60 * 1000);

    // Bulk update
    await prisma.contact.updateMany({
      where: {
        id: { in: contactsToSnooze },
      },
      data: { snoozedUntil },
    });

    return NextResponse.json({
      message: `Snoozed ${contactsToSnooze.length} contacts`,
      count: contactsToSnooze.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Bulk snooze error:", error);
    return NextResponse.json(
      { error: "Failed to bulk snooze contacts" },
      { status: 500 }
    );
  }
}
