import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserFromRequest, handleAPIAuthError } from "@/lib/auth";
import { normalizeMetroArea } from "@/lib/metro";
import { z } from "zod";

const updateSelfContactSchema = z.object({
  location: z.string().max(200).optional().nullable(),
  metroArea: z.string().max(100).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);

    const selfContact = await prisma.contact.findFirst({
      where: { userId: user.id, isSelf: true },
      include: {
        oooPeriods: {
          orderBy: { startDate: "asc" },
        },
      },
    });

    if (!selfContact) {
      return NextResponse.json({ error: "Self-contact not found" }, { status: 404 });
    }

    return NextResponse.json(selfContact);
  } catch (error) {
    console.error("Error fetching self-contact:", error);
    const authResponse = handleAPIAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Failed to fetch self-contact" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);
    const body = await request.json();
    const data = updateSelfContactSchema.parse(body);

    const selfContact = await prisma.contact.findFirst({
      where: { userId: user.id, isSelf: true },
    });

    if (!selfContact) {
      return NextResponse.json({ error: "Self-contact not found" }, { status: 404 });
    }

    // Normalize metro area if provided
    const updateData: Record<string, unknown> = {};
    if (data.location !== undefined) updateData.location = data.location;
    if (data.metroArea !== undefined) {
      updateData.metroArea = normalizeMetroArea(data.metroArea);
    }

    const updated = await prisma.contact.update({
      where: { id: selfContact.id },
      data: updateData,
    });

    return NextResponse.json({
      location: updated.location,
      metroArea: updated.metroArea,
    });
  } catch (error) {
    console.error("Error updating self-contact:", error);
    const authResponse = handleAPIAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update self-contact" },
      { status: 500 }
    );
  }
}
