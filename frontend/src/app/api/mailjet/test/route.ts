import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/invoice-server";
import { sendMailjetTestEmail } from "@/lib/mailjet";

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;

  const result = await sendMailjetTestEmail({
    supabaseAdmin: auth.supabaseAdmin,
    userId: auth.user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Mailjet test failed." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, skipped: result.skipped ?? false, status: result.status ?? null });
}
