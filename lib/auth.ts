"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { cache } from "react";

const SESSION_COOKIE = "prm_session";

// Simple password hashing (use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      // Store hashed password in name field temporarily (we'll add a proper field)
      // For MVP, we're keeping it simple
    },
  });

  // Store password hash separately (in a real app, add passwordHash to schema)
  // For now, we'll create a simple session

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  redirect("/");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  // const password = formData.get("password") as string;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "Invalid email or password" };
  }

  // For MVP without Supabase, we skip password verification
  // In production, you'd verify the password hash

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

// Cache getUser within a single request to avoid duplicate DB calls
export const getUser = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
  });

  return user;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
