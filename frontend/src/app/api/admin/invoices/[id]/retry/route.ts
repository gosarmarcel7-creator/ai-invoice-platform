import { NextRequest, NextResponse } from "next/server";
import { processInvoiceExtraction, safeAudit, ensureRetryable } from "@/lib/invoice-server";
import { fetchAllAuthUsers, requireAdmin } from "@/lib/admin-server";
import type { InvoiceStatus } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { user: actor, supabaseAdmin } = auth;

  const [users, invoiceResult] = await Promise.all([
    fetchAllAuthUsers(supabaseAdmin),
    supabaseAdmin
      .from("invoices")
      .select("id, raw_text, status, retry_count, user_id")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (invoiceResult.error) {
    return NextResponse.json({ error: invoiceResult.error.message }, { status: 500 });
  }

  const invoice = invoiceResult.data;
  if (!invoice || !invoice.user_id) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (!ensureRetryable(invoice.status as InvoiceStatus)) {
    return NextResponse.json({ error: "Only failed invoices can be retried." }, { status: 409 });
  }

  const owner = users.find((user) => user.id === invoice.user_id);
  const retryCount = Number(invoice.retry_count ?? 0) + 1;

  const { error: updateError } = await supabaseAdmin
    .from("invoices")
    .update({
      status: "processing",
      last_error: null,
      processing_started_at: new Date().toISOString(),
      processed_at: null,
      retry_count: retryCount,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await safeAudit({
    invoiceId: parseInt(id, 10),
    userId: actor.id,
    supabaseAdmin,
    action: "processing_retried",
    fromStatus: "failed",
    toStatus: "processing",
    details: { retry_count: retryCount },
  });

  processInvoiceExtraction(
    parseInt(id, 10),
    invoice.raw_text ?? "",
    invoice.user_id,
    supabaseAdmin,
    actor.id
  ).catch(console.error);

  return NextResponse.json({ ok: true, retry_count: retryCount, owner_email: owner?.email ?? null });
}
