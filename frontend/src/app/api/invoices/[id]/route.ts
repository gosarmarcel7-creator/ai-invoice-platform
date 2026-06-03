import { NextRequest, NextResponse } from "next/server";
import {
  requireUser,
  safeAudit,
  safeStatusSideEffects,
} from "@/lib/invoice-server";
import type { InvoiceStatus } from "@/lib/types";

async function getUser(req: NextRequest) {
  const auth = await requireUser(req);
  if ("error" in auth) return null;
  return auth.user ?? null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { supabaseAdmin } = auth;

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("*, line_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { user, supabaseAdmin } = auth;

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from("invoices")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const body = await req.json();
  const { line_items, ...fields } = body;
  const nextStatus = fields.status as InvoiceStatus | undefined;
  const statusChanged = nextStatus && nextStatus !== existing.status;
  const sanitizedFields = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
  if (statusChanged && (nextStatus === "approved" || nextStatus === "rejected")) {
    sanitizedFields.reviewed_by = user.email ?? user.id;
    sanitizedFields.reviewed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabaseAdmin
    .from("invoices")
    .update(sanitizedFields)
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (Array.isArray(line_items)) {
    await supabaseAdmin.from("line_items").delete().eq("invoice_id", id);
    if (line_items.length > 0) {
      await supabaseAdmin.from("line_items").insert(
        line_items.map((item: Record<string, unknown>) => ({ ...item, invoice_id: parseInt(id) }))
      );
    }
  }

  const { data } = await supabaseAdmin
    .from("invoices")
    .select("*, line_items(*)")
    .eq("id", id)
    .single();

  await safeAudit({
    invoiceId: parseInt(id, 10),
    userId: user.id,
    action: "review_saved",
    fromStatus: existing.status as InvoiceStatus,
    toStatus: (data?.status as InvoiceStatus | undefined) ?? (existing.status as InvoiceStatus),
    details: { updated_fields: Object.keys(sanitizedFields), line_items_updated: Array.isArray(line_items) },
  });

  if (statusChanged) {
    await safeStatusSideEffects({
      invoiceId: parseInt(id, 10),
      userId: user.id,
      fromStatus: existing.status as InvoiceStatus,
      toStatus: nextStatus,
      details: { updated_fields: Object.keys(sanitizedFields) },
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { user, supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await safeAudit({
    invoiceId: parseInt(id, 10),
    userId: user.id,
    action: "deleted",
  });
  return new NextResponse(null, { status: 204 });
}
