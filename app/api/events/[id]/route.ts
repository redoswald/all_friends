import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateEventSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const data = updateEventSchema.parse(body);

    // Verify ownership
    const existing = await prisma.event.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { contactIds, newContactNames, ...eventData } = data;

    const event = await prisma.$transaction(async (tx) => {
      // Handle contact updates if either contactIds or newContactNames is provided
      if (contactIds !== undefined || (newContactNames && newContactNames.length > 0)) {
        const allContactIds = [...(contactIds || [])];

        // Create new contacts if any
        if (newContactNames && newContactNames.length > 0) {
          for (const name of newContactNames) {
            const newContact = await tx.contact.create({
              data: {
                name,
                userId: user.id,
                funnelStage: "ACQUAINTANCE",
              },
            });
            allContactIds.push(newContact.id);
          }
        }

        // Verify all existing contacts belong to user
        if (contactIds && contactIds.length > 0) {
          const contacts = await tx.contact.findMany({
            where: {
              id: { in: contactIds },
              userId: user.id,
            },
          });

          if (contacts.length !== contactIds.length) {
            throw new Error("One or more contacts not found");
          }
        }

        // Remove existing event-contact links
        await tx.eventContact.deleteMany({
          where: { eventId: id },
        });

        // Add all contacts (existing + newly created)
        if (allContactIds.length > 0) {
          await tx.eventContact.createMany({
            data: allContactIds.map((contactId) => ({ eventId: id, contactId })),
          });
        }
      }

      // Update event
      return tx.event.update({
        where: { id },
        data: eventData,
        include: {
          contacts: {
            include: { contact: true },
          },
        },
      });
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    if (error instanceof Error && error.message === "One or more contacts not found") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const event = await prisma.event.findFirst({
      where: { id, userId: user.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
