import { NextRequest, NextResponse } from "next/server";
import { ensureRetryable, processInvoiceExtraction, requireUser, safeAudit } from "@/lib/invoice-server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { user, supabaseAdmin } = auth;
  const { id } = await params;

  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .select("id, raw_text, status, retry_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (!ensureRetryable(invoice.status)) {
    return NextResponse.json({ error: "Only failed invoices can be retried." }, { status: 409 });
  }

  const retryCount = (invoice.retry_count ?? 0) + 1;
  const { error: updateError } = await supabaseAdmin
    .from("invoices")
    .update({
      status: "processing",
      last_error: null,
      processing_started_at: new Date().toISOString(),
      processed_at: null,
      retry_count: retryCount,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await safeAudit({
    invoiceId: parseInt(id, 10),
    userId: user.id,
    supabaseAdmin,
    action: "processing_retried",
    fromStatus: "failed",
    toStatus: "processing",
    details: { retry_count: retryCount },
  });

  processInvoiceExtraction(parseInt(id, 10), invoice.raw_text ?? "", user.id, supabaseAdmin).catch(console.error);

  return NextResponse.json({ ok: true, retry_count: retryCount });
}
