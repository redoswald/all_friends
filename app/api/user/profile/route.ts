import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: data.name },
    });

    return NextResponse.json({ name: updated.name });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
