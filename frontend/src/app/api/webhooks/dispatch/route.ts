import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const TARGET_URL = process.env.INVOICE_WEBHOOK_TARGET_URL;
const SHARED_SECRET = process.env.INVOICE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const headerSecret = req.headers.get("x-webhook-secret");
  if (SHARED_SECRET && headerSecret !== SHARED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!TARGET_URL) {
    return NextResponse.json({ ok: true, dispatched: 0, skipped: true });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: events, error } = await supabaseAdmin
    .from("webhook_outbox")
    .select("*")
    .in("delivery_status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let dispatched = 0;
  for (const event of events ?? []) {
    try {
      const response = await fetch(TARGET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(SHARED_SECRET ? { Authorization: `Bearer ${SHARED_SECRET}` } : {}),
        },
        body: JSON.stringify(event.payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook target returned ${response.status}`);
      }

      dispatched++;
      await supabaseAdmin
        .from("webhook_outbox")
        .update({
          delivery_status: "delivered",
          delivery_attempts: (event.delivery_attempts ?? 0) + 1,
          delivered_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", event.id);
    } catch (dispatchError) {
      await supabaseAdmin
        .from("webhook_outbox")
        .update({
          delivery_status: "failed",
          delivery_attempts: (event.delivery_attempts ?? 0) + 1,
          last_error:
            dispatchError instanceof Error ? dispatchError.message : "Webhook dispatch failed.",
        })
        .eq("id", event.id);
    }
  }

  return NextResponse.json({ ok: true, dispatched });
}
