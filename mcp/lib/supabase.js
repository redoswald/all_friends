import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let client = null;

export function createClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment"
    );
  }

  client = createSupabaseClient(url, key);
  return client;
}

export function getUserId() {
  const id = process.env.FRIENDS_USER_ID;
  if (!id) {
    throw new Error("Missing FRIENDS_USER_ID in environment");
  }
  return id;
}
