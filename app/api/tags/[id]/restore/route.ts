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

    const tag = await prisma.tag.findFirst({
      where: { id, userId: user.id, deletedAt: { not: null } },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const restored = await prisma.tag.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json(restored);
  } catch (error) {
    console.error("Error restoring tag:", error);
    const authResponse = handleAPIAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Failed to restore tag" },
      { status: 500 }
    );
  }
}
