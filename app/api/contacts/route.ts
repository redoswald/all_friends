import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createContactSchema } from "@/lib/validations";
import { calculateContactStatus } from "@/lib/cadence";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const searchParams = request.nextUrl.searchParams;
    const tagId = searchParams.get("tagId");
    const funnelStage = searchParams.get("funnelStage");
    const status = searchParams.get("status"); // due, overdue, ok
    const search = searchParams.get("search");

    const contacts = await prisma.contact.findMany({
      where: {
        userId: user.id,
        ...(tagId && {
          tags: {
            some: { tagId },
          },
        }),
        ...(funnelStage && {
          funnelStage: funnelStage as any,
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
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    // Add derived fields
    const contactsWithDerived = contacts.map((contact) => {
      const lastEvent = contact.events[0]?.event;
      const lastEventDate = lastEvent?.date ?? null;
      const contactStatus = calculateContactStatus(lastEventDate, contact.cadenceDays, null, contact.awayUntil);

      return {
        ...contact,
        lastEventDate,
        status: contactStatus,
      };
    });

    // Filter by status if requested
    let filteredContacts = contactsWithDerived;
    if (status === "due") {
      filteredContacts = contactsWithDerived.filter((c) => c.status.isDue);
    } else if (status === "overdue") {
      filteredContacts = contactsWithDerived.filter((c) => c.status.isOverdue);
    } else if (status === "ok") {
      filteredContacts = contactsWithDerived.filter(
        (c) => !c.status.isDue && !c.status.isOverdue
      );
    }

    return NextResponse.json(filteredContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const data = createContactSchema.parse(body);

    const { tagIds, ...contactData } = data;

    const contact = await prisma.contact.create({
      data: {
        ...contactData,
        userId: user.id,
        ...(tagIds?.length && {
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
