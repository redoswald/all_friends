import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createImportantDateSchema } from "@/lib/validations";

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

    const dates = await prisma.importantDate.findMany({
      where: { contactId: id },
      orderBy: [{ dateType: "asc" }, { month: "asc" }, { day: "asc" }],
    });

    return NextResponse.json(dates);
  } catch (error) {
    console.error("Error fetching important dates:", error);
    return NextResponse.json(
      { error: "Failed to fetch important dates" },
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
    const data = createImportantDateSchema.parse(body);

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Validate day for month
    const daysInMonth = new Date(data.year || 2000, data.month, 0).getDate();
    if (data.day > daysInMonth) {
      return NextResponse.json(
        { error: `Invalid day for month ${data.month}` },
        { status: 400 }
      );
    }

    const date = await prisma.importantDate.create({
      data: {
        contactId: id,
        ...data,
      },
    });

    return NextResponse.json(date, { status: 201 });
  } catch (error) {
    console.error("Error creating important date:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create important date" },
      { status: 500 }
    );
  }
}
