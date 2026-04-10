import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserFromRequest, handleAPIAuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request);

    // Delete Prisma user (all relations cascade)
    await prisma.user.delete({
      where: { id: user.id },
    });

    // Sign out the Supabase session
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    const authResponse = handleAPIAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
