import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

const snoozeSchema = z.object({
  days: z.number().int().positive().nullable(),
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
    const { days } = snoozeSchema.parse(body);

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Calculate snooze end date or clear it
    const snoozedUntil = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      : null;

    const updated = await prisma.contact.update({
      where: { id },
      data: { snoozedUntil },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Snooze error:", error);
    return NextResponse.json(
      { error: "Failed to snooze contact" },
      { status: 500 }
    );
  }
}
