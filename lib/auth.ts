"use server";

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { cache } from "react";

// Helper: Ensure a self-contact record exists for the user
async function ensureSelfContact(userId: string, name: string | null, email: string) {
  const existing = await prisma.contact.findFirst({
    where: { userId, isSelf: true },
  });

  if (!existing) {
    await prisma.contact.create({
      data: {
        userId,
        name: name || email,
        isSelf: true,
        funnelStage: "CLOSE",
      },
    });
  }
}

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

  // Check if user exists by email (for migrating existing users)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  let user;
  if (existingUser) {
    // Update existing user with supabaseId
    user = await prisma.user.update({
      where: { email },
      data: {
        supabaseId: supabaseUser.id,
        name: name || existingUser.name,
        avatarUrl: avatarUrl || existingUser.avatarUrl
      },
    });
  } else {
    // Create new user
    user = await prisma.user.create({
      data: { supabaseId: supabaseUser.id, email, name, avatarUrl },
    });
  }

  // Ensure self-contact exists
  await ensureSelfContact(user.id, user.name, email);

  return user;
}

// Email/Password Sign Up
export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await syncUserToPrisma(data.user);
  }

  redirect("/dashboard");
}

// Email/Password Sign In
export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await syncUserToPrisma(data.user);
  }

  redirect("/dashboard");
}

// OAuth Sign In (Google)
export async function signInWithGoogle() {
  const supabase = await createClient();

  // Use SITE_URL env var, with production fallback
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "https://all-friends.vercel.app";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

// Sign Out
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Get current user (cached per request)
export const getUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return null;
  }

  // Get Prisma user by supabaseId
  let user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  // If user doesn't exist in Prisma yet (e.g., OAuth first login), create them
  if (!user) {
    user = await syncUserToPrisma(supabaseUser);
  } else {
    // Ensure self-contact exists for existing users
    await ensureSelfContact(user.id, user.name, supabaseUser.email!);
  }

  return user;
});

// Require authenticated user (redirects if not authenticated)
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
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
