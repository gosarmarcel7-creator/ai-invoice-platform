import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, "public", any>;

let cachedAdmin: AdminClient | null = null;

// Service-role client for server-side API routes (bypasses RLS).
// Keep initialization lazy so `next build` can evaluate route modules without runtime env vars.
export function getSupabaseAdmin() {
  if (!cachedAdmin) {
    cachedAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    ) as AdminClient;
  }
  return cachedAdmin;
}

// User-scoped client using their JWT (enforces RLS)
export function supabaseForUser(accessToken: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  client.auth.setSession({ access_token: accessToken, refresh_token: "" });
  return client;
}

export function getUserFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
