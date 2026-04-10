import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

// Helper: Sync Supabase user to Prisma User table
async function syncUserToPrisma(supabaseUser: {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
}) {
  const email = supabaseUser.email;
  if (!email) throw new Error("User email is required");

  const name =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    null;
  const avatarUrl = supabaseUser.user_metadata?.avatar_url || null;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  let user;
  if (existingUser) {
    user = await prisma.user.update({
      where: { email },
      data: {
        supabaseId: supabaseUser.id,
        name: name || existingUser.name,
        avatarUrl: avatarUrl || existingUser.avatarUrl,
      },
    });
  } else {
    user = await prisma.user.create({
      data: { supabaseId: supabaseUser.id, email, name, avatarUrl },
    });
  }

  return user;
}

// Token-based auth for API routes (supports both mobile bearer tokens and web cookies)
export async function requireUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      throw new APIAuthError();
    }

    let user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      user = await syncUserToPrisma(supabaseUser);
    }

    return user;
  }

  // Fall back to cookie-based auth (existing web behavior)
  const { requireUser } = await import("@/lib/auth");
  return requireUser();
}

// Error class for API auth failures (returns 401 JSON instead of redirect)
export class APIAuthError extends Error {
  status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "APIAuthError";
  }
}

// Helper: if an error is an APIAuthError, return a 401 response; otherwise return null
export function handleAPIAuthError(error: unknown): NextResponse | null {
  if (error instanceof APIAuthError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
