import { createClient } from "@supabase/supabase-js";

// Service-role client for server-side API routes (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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
