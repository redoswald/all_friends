import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateContactFieldSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, fieldId } = await params;
    const body = await request.json();
    const data = updateContactFieldSchema.parse(body);

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify field belongs to contact
    const existingField = await prisma.contactField.findFirst({
      where: { id: fieldId, contactId: id },
    });

    if (!existingField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    const field = await prisma.contactField.update({
      where: { id: fieldId },
      data,
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("Error updating contact field:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update contact field" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, fieldId } = await params;

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify field belongs to contact
    const existingField = await prisma.contactField.findFirst({
      where: { id: fieldId, contactId: id },
    });

    if (!existingField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    await prisma.contactField.delete({
      where: { id: fieldId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact field:", error);
    return NextResponse.json(
      { error: "Failed to delete contact field" },
      { status: 500 }
    );
  }
}
