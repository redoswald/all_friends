import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { z } from "zod";

const bulkUpdateSchema = z.object({
  contactIds: z.array(z.string()).min(1),
  updates: z.object({
    funnelStage: z.enum([
      "PROSPECT",
      "ACQUAINTANCE",
      "DEVELOPING",
      "ESTABLISHED",
      "CLOSE",
      "DORMANT",
    ]).optional(),
    cadenceDays: z.number().int().positive().nullable().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { contactIds, updates } = bulkUpdateSchema.parse(body);

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

    // Build update data, only including defined fields
    const updateData: Record<string, unknown> = {};
    if (updates.funnelStage !== undefined) {
      updateData.funnelStage = updates.funnelStage;
    }
    if (updates.cadenceDays !== undefined) {
      updateData.cadenceDays = updates.cadenceDays;
    }

    // Update all contacts
    await prisma.contact.updateMany({
      where: {
        id: { in: contactIds },
        userId: user.id,
      },
      data: updateData,
    });

    return NextResponse.json({ success: true, count: contactIds.length });
  } catch (error) {
    console.error("Error bulk updating contacts:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update contacts" },
      { status: 500 }
    );
  }
}
