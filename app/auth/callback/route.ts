import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Sync user to Prisma database
      const email = data.user.email;
      if (email) {
        const name =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          null;
        const avatarUrl = data.user.user_metadata?.avatar_url || null;

        // Check if user exists by email (for migrating existing users)
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Update existing user with supabaseId
          await prisma.user.update({
            where: { email },
            data: { supabaseId: data.user.id, name: name || existingUser.name, avatarUrl: avatarUrl || existingUser.avatarUrl },
          });
        } else {
          // Create new user
          await prisma.user.create({
            data: { supabaseId: data.user.id, email, name, avatarUrl },
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
