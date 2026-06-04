import { NextRequest, NextResponse } from "next/server";
import { requireUser, safeAudit, safeStatusSideEffects } from "@/lib/invoice-server";
import type { InvoiceStatus } from "@/lib/types";

const VALID_ACTIONS = new Set<InvoiceStatus>(["review", "approved", "rejected"]);

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { user, supabaseAdmin } = auth;

  const body = await req.json();
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];
  const status = body.action as InvoiceStatus;

  if (ids.length === 0) {
    return NextResponse.json({ error: "No invoices selected." }, { status: 400 });
  }
  if (!VALID_ACTIONS.has(status)) {
    return NextResponse.json({ error: "Unsupported bulk action." }, { status: 400 });
  }

  const { data: invoices, error } = await supabaseAdmin
    .from("invoices")
    .select("id, status")
    .eq("user_id", user.id)
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!invoices?.length) {
    return NextResponse.json({ error: "No matching invoices found." }, { status: 404 });
  }

  const timestamp = new Date().toISOString();
  const updatePayload: Record<string, unknown> = { status };
  if (status === "approved" || status === "rejected") {
    updatePayload.reviewed_by = user.email ?? user.id;
    updatePayload.reviewed_at = timestamp;
  }

  const { error: updateError } = await supabaseAdmin
    .from("invoices")
    .update(updatePayload)
    .eq("user_id", user.id)
    .in("id", invoices.map((invoice) => invoice.id));

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await Promise.all(
    invoices.map(async (invoice) => {
      await safeAudit({
        invoiceId: invoice.id,
        userId: user.id,
        supabaseAdmin,
        action: "bulk_updated",
        fromStatus: invoice.status as InvoiceStatus,
        toStatus: status,
        details: { bulk: true },
      });
      await safeStatusSideEffects({
        invoiceId: invoice.id,
        ownerUserId: user.id,
        actorUserId: user.id,
        supabaseAdmin,
        fromStatus: invoice.status as InvoiceStatus,
        toStatus: status,
        details: { bulk: true },
      });
    })
  );

  const { data: updated } = await supabaseAdmin
    .from("invoices")
    .select("*, line_items(*)")
    .eq("user_id", user.id)
    .in("id", invoices.map((invoice) => invoice.id));

  return NextResponse.json({
    ok: true,
    updated: updated ?? [],
    count: invoices.length,
  });
}
