import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isMailjetConfigured, sendMailjetPasswordResetEmail } from "@/lib/mailjet";

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return email;
}

function getRedirectTo(request: NextRequest) {
  const url = new URL("/auth/confirm", request.url);
  url.searchParams.set("next", "/update-password");
  return url.toString();
}

function isNotFoundError(message?: string | null) {
  return Boolean(message && /user not found|not found/i.test(message));
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = normalizeEmail(body?.email);

  if (!email) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!isMailjetConfigured()) {
    return NextResponse.json({ error: "Email service is unavailable." }, { status: 503 });
  }

  let supabaseAdmin: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "Email service is unavailable." }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: getRedirectTo(request),
    },
  });

  if (error) {
    if (isNotFoundError(error.message)) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unable to send reset email." }, { status: 502 });
  }

  const actionLink = data?.properties?.action_link;
  if (!actionLink) {
    return NextResponse.json({ error: "Unable to generate reset link." }, { status: 502 });
  }

  const result = await sendMailjetPasswordResetEmail({
    to: { Email: email },
    actionLink,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Unable to send reset email." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, skipped: result.skipped ?? false });
}
