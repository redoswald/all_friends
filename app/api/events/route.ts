import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createEventSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const events = await prisma.event.findMany({
      where: {
        userId: user.id,
        ...(contactId && {
          contacts: {
            some: { contactId },
          },
        }),
      },
      include: {
        contacts: {
          include: { contact: true },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.event.count({
      where: {
        userId: user.id,
        ...(contactId && {
          contacts: {
            some: { contactId },
          },
        }),
      },
    });

    return NextResponse.json({ events, total });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const data = createEventSchema.parse(body);

    const { contactIds, newContactNames, ...eventData } = data;

    // Verify all existing contacts belong to user
    if (contactIds.length > 0) {
      const existingContacts = await prisma.contact.findMany({
        where: {
          id: { in: contactIds },
          userId: user.id,
        },
      });

      if (existingContacts.length !== contactIds.length) {
        return NextResponse.json(
          { error: "One or more contacts not found" },
          { status: 400 }
        );
      }
    }

    // Create new contacts and collect all contact IDs
    const allContactIds = [...contactIds];

    if (newContactNames.length > 0) {
      const newContacts = await prisma.$transaction(
        newContactNames.map((name) =>
          prisma.contact.create({
            data: {
              name,
              userId: user.id,
              funnelStage: "ACQUAINTANCE",
            },
          })
        )
      );
      allContactIds.push(...newContacts.map((c) => c.id));
    }

    const event = await prisma.event.create({
      data: {
        ...eventData,
        userId: user.id,
        contacts: {
          create: allContactIds.map((contactId) => ({ contactId })),
        },
      },
      include: {
        contacts: {
          include: { contact: true },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
