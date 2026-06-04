import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, "public", any>;

let cachedAdmin: AdminClient | null = null;

function requiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getSupabaseUrl() {
  return requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function getSupabaseAnonKey() {
  return requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Service-role client for server-side API routes (bypasses RLS).
// Keep initialization lazy so `next build` can evaluate route modules without runtime env vars.
export function getSupabaseAdmin() {
  if (!cachedAdmin) {
    cachedAdmin = createClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } }
    ) as AdminClient;
  }
  return cachedAdmin;
}

// User-scoped client using their JWT (enforces RLS)
export function supabaseForUser(accessToken: string) {
  const client = createClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
  return client;
}

export function getUserFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
