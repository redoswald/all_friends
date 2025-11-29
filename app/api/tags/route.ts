import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createTagSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireUser();

    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const data = createTagSchema.parse(body);

    // Check for duplicate name
    const existing = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name: data.name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        ...data,
        userId: user.id,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
