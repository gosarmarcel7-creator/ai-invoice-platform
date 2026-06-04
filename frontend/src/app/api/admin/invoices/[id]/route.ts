import { NextRequest, NextResponse } from "next/server";
import { safeAudit, safeStatusSideEffects } from "@/lib/invoice-server";
import { fetchAllAuthUsers, requireAdmin } from "@/lib/admin-server";
import type { InvoiceStatus } from "@/lib/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { supabaseAdmin } = auth;

  const [users, invoices] = await Promise.all([
    fetchAllAuthUsers(supabaseAdmin),
    supabaseAdmin.from("invoices").select("*, line_items(*)").eq("id", id).maybeSingle(),
  ]);

  if (invoices.error) {
    return NextResponse.json({ error: invoices.error.message }, { status: 500 });
  }

  const invoice = invoices.data;
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const owner = invoice.user_id ? users.find((user) => user.id === invoice.user_id) : null;
  return NextResponse.json({
    ...invoice,
    user_email: owner?.email ?? null,
    user_name:
      (typeof owner?.user_metadata?.full_name === "string" && owner.user_metadata.full_name) ||
      (typeof owner?.user_metadata?.name === "string" && owner.user_metadata.name) ||
      null,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { user: actor, supabaseAdmin } = auth;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("invoices")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const body = await req.json();
  const { line_items, ...fields } = body as Record<string, unknown>;
  const nextStatus = fields.status as InvoiceStatus | undefined;
  const statusChanged = nextStatus && nextStatus !== existing.status;
  const sanitizedFields = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
  if (statusChanged && (nextStatus === "approved" || nextStatus === "rejected")) {
    sanitizedFields.reviewed_by = actor.email ?? actor.id;
    sanitizedFields.reviewed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabaseAdmin.from("invoices").update(sanitizedFields).eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (Array.isArray(line_items)) {
    await supabaseAdmin.from("line_items").delete().eq("invoice_id", id);
    if (line_items.length > 0) {
      await supabaseAdmin.from("line_items").insert(
        line_items.map((item: Record<string, unknown>) => ({ ...item, invoice_id: parseInt(id, 10) }))
      );
    }
  }

  const { data } = await supabaseAdmin.from("invoices").select("*, line_items(*)").eq("id", id).single();
  if (!data) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  await safeAudit({
    invoiceId: parseInt(id, 10),
    userId: actor.id,
    supabaseAdmin,
    action: "review_saved",
    fromStatus: existing.status as InvoiceStatus,
    toStatus: data.status as InvoiceStatus,
    details: {
      updated_fields: Object.keys(sanitizedFields),
      line_items_updated: Array.isArray(line_items),
    },
  });

  if (statusChanged && nextStatus) {
    await safeStatusSideEffects({
      invoiceId: parseInt(id, 10),
      ownerUserId: existing.user_id ?? actor.id,
      actorUserId: actor.id,
      supabaseAdmin,
      fromStatus: existing.status as InvoiceStatus,
      toStatus: nextStatus,
      details: { updated_fields: Object.keys(sanitizedFields) },
    });
  }

  const users = await fetchAllAuthUsers(supabaseAdmin);
  const owner = data.user_id ? users.find((user) => user.id === data.user_id) : null;

  return NextResponse.json({
    ...data,
    user_email: owner?.email ?? null,
    user_name:
      (typeof owner?.user_metadata?.full_name === "string" && owner.user_metadata.full_name) ||
      (typeof owner?.user_metadata?.name === "string" && owner.user_metadata.name) ||
      null,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { user: actor, supabaseAdmin } = auth;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("invoices")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("invoices").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await safeAudit({
    invoiceId: parseInt(id, 10),
    userId: actor.id,
    supabaseAdmin,
    action: "deleted",
  });

  return new NextResponse(null, { status: 204 });
}
