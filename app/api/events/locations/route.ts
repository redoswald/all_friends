import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserFromRequest, handleAPIAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);

    const events = await prisma.event.findMany({
      where: {
        userId: user.id,
        location: { not: null },
      },
      select: { location: true },
      distinct: ["location"],
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const locations = events
      .map((e) => e.location)
      .filter((loc): loc is string => loc !== null);

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    const authResponse = handleAPIAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json([], { status: 500 });
  }
}
