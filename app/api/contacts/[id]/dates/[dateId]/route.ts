import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateImportantDateSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, dateId } = await params;
    const body = await request.json();
    const data = updateImportantDateSchema.parse(body);

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify date belongs to contact
    const existingDate = await prisma.importantDate.findFirst({
      where: { id: dateId, contactId: id },
    });

    if (!existingDate) {
      return NextResponse.json({ error: "Date not found" }, { status: 404 });
    }

    // Validate day for month if both are provided
    const month = data.month ?? existingDate.month;
    const day = data.day ?? existingDate.day;
    const year = data.year !== undefined ? data.year : existingDate.year;
    const daysInMonth = new Date(year || 2000, month, 0).getDate();
    if (day > daysInMonth) {
      return NextResponse.json(
        { error: `Invalid day for month ${month}` },
        { status: 400 }
      );
    }

    const date = await prisma.importantDate.update({
      where: { id: dateId },
      data,
    });

    return NextResponse.json(date);
  } catch (error) {
    console.error("Error updating important date:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update important date" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, dateId } = await params;

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify date belongs to contact
    const existingDate = await prisma.importantDate.findFirst({
      where: { id: dateId, contactId: id },
    });

    if (!existingDate) {
      return NextResponse.json({ error: "Date not found" }, { status: 404 });
    }

    await prisma.importantDate.delete({
      where: { id: dateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting important date:", error);
    return NextResponse.json(
      { error: "Failed to delete important date" },
      { status: 500 }
    );
  }
}
