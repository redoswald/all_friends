import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

const awaySchema = z.object({
  awayUntil: z.string().nullable(), // ISO date string or null to clear
});

async function getUserFromCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("prm_session")?.value;
  if (!sessionId) return null;
  return prisma.user.findUnique({ where: { id: sessionId } });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { awayUntil } = awaySchema.parse(body);

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: { awayUntil: awayUntil ? new Date(awayUntil) : null },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Away error:", error);
    return NextResponse.json(
      { error: "Failed to set contact away status" },
      { status: 500 }
    );
  }
}
