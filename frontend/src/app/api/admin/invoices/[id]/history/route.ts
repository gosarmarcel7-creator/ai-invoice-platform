import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { supabaseAdmin } = auth;
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("invoice_audit_log")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
