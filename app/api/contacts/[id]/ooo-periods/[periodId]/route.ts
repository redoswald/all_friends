import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateOOOPeriodSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; periodId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, periodId } = await params;
    const body = await request.json();
    const data = updateOOOPeriodSchema.parse(body);

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify period belongs to contact
    const existingPeriod = await prisma.contactOOOPeriod.findFirst({
      where: { id: periodId, contactId: id },
    });

    if (!existingPeriod) {
      return NextResponse.json({ error: "OOO period not found" }, { status: 404 });
    }

    // Validate that endDate >= startDate if both are being updated
    const newStartDate = data.startDate ?? existingPeriod.startDate;
    const newEndDate = data.endDate ?? existingPeriod.endDate;
    if (newEndDate < newStartDate) {
      return NextResponse.json(
        { error: "End date must be on or after start date" },
        { status: 400 }
      );
    }

    const period = await prisma.contactOOOPeriod.update({
      where: { id: periodId },
      data,
    });

    return NextResponse.json(period);
  } catch (error) {
    console.error("Error updating OOO period:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update OOO period" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; periodId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, periodId } = await params;

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify period belongs to contact
    const existingPeriod = await prisma.contactOOOPeriod.findFirst({
      where: { id: periodId, contactId: id },
    });

    if (!existingPeriod) {
      return NextResponse.json({ error: "OOO period not found" }, { status: 404 });
    }

    await prisma.contactOOOPeriod.delete({
      where: { id: periodId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting OOO period:", error);
    return NextResponse.json(
      { error: "Failed to delete OOO period" },
      { status: 500 }
    );
  }
}
