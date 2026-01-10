import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, relationshipId } = await params;

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify relationship belongs to contact
    const existingRelationship = await prisma.contactRelationship.findFirst({
      where: { id: relationshipId, contactId: id },
    });

    if (!existingRelationship) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }

    // Delete both the relationship and its inverse in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the primary relationship
      await tx.contactRelationship.delete({
        where: { id: relationshipId },
      });

      // Delete the inverse relationship
      await tx.contactRelationship.deleteMany({
        where: {
          contactId: existingRelationship.relatedId,
          relatedId: id,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting relationship:", error);
    return NextResponse.json(
      { error: "Failed to delete relationship" },
      { status: 500 }
    );
  }
}
