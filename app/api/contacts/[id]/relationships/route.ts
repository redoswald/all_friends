import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createRelationshipSchema } from "@/lib/validations";
import { INVERSE_RELATIONSHIPS, type RelationshipType } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const relationships = await prisma.contactRelationship.findMany({
      where: { contactId: id },
      include: {
        relatedContact: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(relationships);
  } catch (error) {
    console.error("Error fetching relationships:", error);
    return NextResponse.json(
      { error: "Failed to fetch relationships" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const data = createRelationshipSchema.parse(body);

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify related contact exists and belongs to user
    const relatedContact = await prisma.contact.findFirst({
      where: { id: data.relatedId, userId: user.id },
    });

    if (!relatedContact) {
      return NextResponse.json(
        { error: "Related contact not found" },
        { status: 404 }
      );
    }

    // Prevent self-reference
    if (id === data.relatedId) {
      return NextResponse.json(
        { error: "Cannot create a relationship with self" },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.contactRelationship.findUnique({
      where: {
        contactId_relatedId: {
          contactId: id,
          relatedId: data.relatedId,
        },
      },
    });

    if (existingRelationship) {
      return NextResponse.json(
        { error: "Relationship already exists" },
        { status: 409 }
      );
    }

    // Get the inverse relationship type
    const inverseType = INVERSE_RELATIONSHIPS[data.relationshipType as RelationshipType];

    // Create both relationships in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the primary relationship
      const relationship = await tx.contactRelationship.create({
        data: {
          contactId: id,
          relatedId: data.relatedId,
          relationshipType: data.relationshipType,
        },
        include: {
          relatedContact: {
            select: { id: true, name: true },
          },
        },
      });

      // Create the inverse relationship (if it doesn't exist)
      const existingInverse = await tx.contactRelationship.findUnique({
        where: {
          contactId_relatedId: {
            contactId: data.relatedId,
            relatedId: id,
          },
        },
      });

      if (!existingInverse) {
        await tx.contactRelationship.create({
          data: {
            contactId: data.relatedId,
            relatedId: id,
            relationshipType: inverseType,
          },
        });
      }

      return relationship;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating relationship:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create relationship" },
      { status: 500 }
    );
  }
}
