import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();

    const data = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        contacts: {
          include: {
            fields: true,
            importantDates: true,
            relationships: {
              include: {
                relatedContact: { select: { id: true, name: true } },
              },
            },
            oooPeriods: true,
            tags: {
              include: { tag: { select: { name: true, color: true } } },
            },
          },
        },
        events: {
          include: {
            contacts: {
              include: {
                contact: { select: { id: true, name: true } },
              },
            },
            actionItems: true,
          },
        },
        tags: true,
      },
    });

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="all-friends-export.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
