import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserFromRequest, handleAPIAuthError } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserFromRequest(request);
    const { id } = await params;

    const event = await prisma.event.findFirst({
      where: { id, userId: user.id, deletedAt: { not: null } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const restored = await prisma.event.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json(restored);
  } catch (error) {
    console.error("Error restoring event:", error);
    const authResponse = handleAPIAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Failed to restore event" },
      { status: 500 }
    );
  }
}
