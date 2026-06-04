import { supabaseForUser, getUserFromRequest } from "@/lib/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { buildCsvRows, canRetryInvoice, validateExtractionResult } from "@/lib/invoice-workflow";
import { extractInvoiceData } from "@/lib/extraction";
import { sendInvoiceStatusEmail } from "@/lib/mailjet";

type AuditAction =
  | "uploaded"
  | "processing_started"
  | "processing_failed"
  | "processing_retried"
  | "extraction_completed"
  | "review_saved"
  | "approved"
  | "rejected"
  | "deleted"
  | "bulk_updated"
  | "exported";

type EventType =
  | "invoice.review"
  | "invoice.approved"
  | "invoice.rejected"
  | "invoice.failed";

export async function requireUser(req: Request) {
  const token = getUserFromRequest(req);
  if (!token) {
    return { error: new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 }) };
  }

  const supabaseAdmin = supabaseForUser(token);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser();

  if (error || !user) {
    return { error: new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 }) };
  }

  return { user, supabaseAdmin };
}

export async function processInvoiceExtraction(
  invoiceId: number,
  text: string,
  ownerUserId: string,
  supabaseAdmin: SupabaseClient,
  actorUserId: string = ownerUserId
) {

  try {
    const extracted = await extractInvoiceData(text);
    const validated = validateExtractionResult(extracted);

    if (!validated.ok) {
      await markInvoiceFailed({
        invoiceId,
        ownerUserId,
        actorUserId,
        supabaseAdmin,
        message: validated.error,
      });
      return;
    }

    const { data, attentionReasons, needsAttention } = validated;

    await supabaseAdmin
      .from("invoices")
      .update({
        vendor_name: data.vendor_name,
        invoice_number: data.invoice_number,
        total_amount: data.total_amount,
        date: data.date,
        due_date: data.due_date,
        confidence_score: data.confidence_score,
        status: "review",
        needs_attention: needsAttention,
        attention_reasons: attentionReasons,
        last_error: null,
        processed_at: new Date().toISOString(),
      })
        .eq("id", invoiceId)
        .eq("user_id", ownerUserId);

    await supabaseAdmin.from("line_items").delete().eq("invoice_id", invoiceId);
    if (data.line_items.length > 0) {
      await supabaseAdmin.from("line_items").insert(
        data.line_items.map((item) => ({
          invoice_id: invoiceId,
          description: item.description ?? null,
          quantity: item.quantity ?? null,
          unit_price: item.unit_price ?? null,
          total_price: item.total_price ?? null,
        }))
      );
    }

    await safeAudit({
      invoiceId,
      userId: actorUserId,
      supabaseAdmin,
      action: "extraction_completed",
      fromStatus: "processing",
      toStatus: "review",
      details: { needsAttention, attentionReasons },
    });

    await safeOutbox({
      invoiceId,
      userId: ownerUserId,
      supabaseAdmin,
      eventType: "invoice.review",
      payload: {
        invoice_id: invoiceId,
        user_id: ownerUserId,
        status: "review",
        needs_attention: needsAttention,
        attention_reasons: attentionReasons,
      },
    });
  } catch (error) {
    await markInvoiceFailed({
      invoiceId,
      ownerUserId,
      actorUserId,
      supabaseAdmin,
      message: error instanceof Error ? error.message : "Invoice extraction failed.",
    });
  }
}

async function markInvoiceFailed({
  invoiceId,
  ownerUserId,
  actorUserId = ownerUserId,
  supabaseAdmin,
  message,
}: {
  invoiceId: number;
  ownerUserId: string;
  actorUserId?: string;
  supabaseAdmin: SupabaseClient;
  message: string;
}) {
  await supabaseAdmin
    .from("invoices")
    .update({
      status: "failed",
      last_error: message,
      processed_at: new Date().toISOString(),
      needs_attention: true,
      attention_reasons: ["empty_extraction"],
    })
    .eq("id", invoiceId)
    .eq("user_id", ownerUserId);

  await safeAudit({
    invoiceId,
    userId: actorUserId,
    supabaseAdmin,
    action: "processing_failed",
    fromStatus: "processing",
    toStatus: "failed",
    details: { error: message },
  });

  await safeOutbox({
    invoiceId,
    userId: ownerUserId,
    supabaseAdmin,
    eventType: "invoice.failed",
    payload: { invoice_id: invoiceId, user_id: ownerUserId, status: "failed", error: message },
  });
}

export async function safeAudit({
  invoiceId,
  userId,
  supabaseAdmin,
  action,
  fromStatus,
  toStatus,
  details,
}: {
  invoiceId: number;
  userId: string | null;
  supabaseAdmin: SupabaseClient;
  action: AuditAction;
  fromStatus?: InvoiceStatus | null;
  toStatus?: InvoiceStatus | null;
  details?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("invoice_audit_log").insert({
      invoice_id: invoiceId,
      user_id: userId,
      action,
      from_status: fromStatus ?? null,
      to_status: toStatus ?? null,
      details: details ?? null,
    });
  } catch (error) {
    console.warn("Audit insert failed", error);
  }
}

export async function safeOutbox({
  invoiceId,
  userId,
  supabaseAdmin,
  eventType,
  payload,
}: {
  invoiceId: number;
  userId: string;
  supabaseAdmin: SupabaseClient;
  eventType: EventType;
  payload: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("webhook_outbox").insert({
      invoice_id: invoiceId,
      user_id: userId,
      event_type: eventType,
      payload,
      delivery_status: "pending",
      delivery_attempts: 0,
    });
  } catch (error) {
    console.warn("Webhook outbox insert failed", error);
  }
}

export function buildCsvResponse(invoices: Invoice[]) {
  const rows = buildCsvRows(invoices);
  const headers = Object.keys(rows[0] ?? {
    id: "",
    filename: "",
    vendor_name: "",
    invoice_number: "",
    total_amount: "",
    date: "",
    due_date: "",
    confidence_score: "",
    status: "",
    needs_attention: "",
    attention_reasons: "",
    reviewed_at: "",
    line_item_description: "",
    line_item_quantity: "",
    line_item_unit_price: "",
    line_item_total_price: "",
  });
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header as keyof typeof row])).join(",")),
  ];

  return lines.join("\n");
}

function escapeCsv(value: unknown) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function getStatusAuditAction(status: InvoiceStatus): AuditAction {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "review_saved";
}

export function getStatusEventType(status: InvoiceStatus): EventType | null {
  if (status === "approved") return "invoice.approved";
  if (status === "rejected") return "invoice.rejected";
  if (status === "failed") return "invoice.failed";
  if (status === "review") return "invoice.review";
  return null;
}

export async function safeStatusSideEffects({
  invoiceId,
  ownerUserId,
  actorUserId,
  supabaseAdmin,
  fromStatus,
  toStatus,
  details,
}: {
  invoiceId: number;
  ownerUserId: string;
  actorUserId: string;
  supabaseAdmin: SupabaseClient;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
  details?: Record<string, unknown>;
}) {
  await safeAudit({
    invoiceId,
    userId: actorUserId,
    supabaseAdmin,
    action: getStatusAuditAction(toStatus),
    fromStatus,
    toStatus,
    details,
  });

  const eventType = getStatusEventType(toStatus);
  if (eventType) {
    await safeOutbox({
      invoiceId,
      userId: ownerUserId,
      supabaseAdmin,
      eventType,
      payload: {
        invoice_id: invoiceId,
        user_id: ownerUserId,
        from_status: fromStatus,
        status: toStatus,
        ...details,
      },
    });
  }

  const mailjetResult = await sendInvoiceStatusEmail({
    invoiceId,
    userId: ownerUserId,
    supabaseAdmin,
    fromStatus,
    toStatus,
  });
  if (!mailjetResult.ok && !mailjetResult.skipped) {
    console.warn("Mailjet notification failed", mailjetResult.error);
  }
}

export function ensureRetryable(status: InvoiceStatus) {
  return canRetryInvoice(status);
}
