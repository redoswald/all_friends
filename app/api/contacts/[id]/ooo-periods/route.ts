import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createOOOPeriodSchema } from "@/lib/validations";

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

    const periods = await prisma.contactOOOPeriod.findMany({
      where: { contactId: id },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(periods);
  } catch (error) {
    console.error("Error fetching OOO periods:", error);
    return NextResponse.json(
      { error: "Failed to fetch OOO periods" },
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
    const data = createOOOPeriodSchema.parse(body);

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const period = await prisma.contactOOOPeriod.create({
      data: {
        contactId: id,
        ...data,
      },
    });

    return NextResponse.json(period, { status: 201 });
  } catch (error) {
    console.error("Error creating OOO period:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create OOO period" },
      { status: 500 }
    );
  }
}
