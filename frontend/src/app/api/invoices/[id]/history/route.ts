import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/invoice-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { user, supabaseAdmin } = auth;
  const { id } = await params;

  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("invoices")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("invoice_audit_log")
      .select("*")
      .eq("invoice_id", id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
