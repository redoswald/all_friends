import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { z } from "zod";

const bulkTagSchema = z.object({
  contactIds: z.array(z.string()).min(1),
  tagId: z.string(),
  action: z.enum(["add", "remove"]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { contactIds, tagId, action } = bulkTagSchema.parse(body);

    // Verify all contacts belong to user
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        userId: user.id,
      },
    });

    if (contacts.length !== contactIds.length) {
      return NextResponse.json(
        { error: "One or more contacts not found" },
        { status: 400 }
      );
    }

    // Verify tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId: user.id,
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 400 }
      );
    }

    if (action === "add") {
      // Add tag to all contacts (skip if already exists)
      await prisma.$transaction(
        contactIds.map((contactId) =>
          prisma.contactTag.upsert({
            where: {
              contactId_tagId: { contactId, tagId },
            },
            create: { contactId, tagId },
            update: {},
          })
        )
      );
    } else {
      // Remove tag from all contacts
      await prisma.contactTag.deleteMany({
        where: {
          contactId: { in: contactIds },
          tagId,
        },
      });
    }

    return NextResponse.json({ success: true, count: contactIds.length });
  } catch (error) {
    console.error("Error bulk tagging contacts:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 }
    );
  }
}
