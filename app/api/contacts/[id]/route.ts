import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateContactSchema } from "@/lib/validations";
import { calculateContactStatus } from "@/lib/cadence";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

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
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const lastEvent = contact.events[0]?.event;
    const lastEventDate = lastEvent?.date ?? null;
    const status = calculateContactStatus(lastEventDate, contact.cadenceDays, null, contact.awayUntil);

    return NextResponse.json({
      ...contact,
      lastEventDate,
      status,
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const data = updateContactSchema.parse(body);

    // Verify ownership
    const existing = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const { tagIds, ...contactData } = data;

    // Update contact and tags in a transaction
    const contact = await prisma.$transaction(async (tx) => {
      // Update tags if provided
      if (tagIds !== undefined) {
        // Remove existing tags
        await tx.contactTag.deleteMany({
          where: { contactId: id },
        });
        // Add new tags
        if (tagIds.length > 0) {
          await tx.contactTag.createMany({
            data: tagIds.map((tagId) => ({ contactId: id, tagId })),
          });
        }
      }

      // Update contact
      return tx.contact.update({
        where: { id },
        data: contactData,
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update contact" },
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

    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
