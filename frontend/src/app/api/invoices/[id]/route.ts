import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";

async function getUser(req: NextRequest) {
  const token = getUserFromRequest(req);
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user ?? null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from("invoices")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const body = await req.json();
  const { line_items, ...fields } = body;

  const { error: updateError } = await supabaseAdmin
    .from("invoices")
    .update(fields)
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (Array.isArray(line_items)) {
    await supabaseAdmin.from("line_items").delete().eq("invoice_id", id);
    if (line_items.length > 0) {
      await supabaseAdmin.from("line_items").insert(
        line_items.map((item: any) => ({ ...item, invoice_id: parseInt(id) }))
      );
    }
  }

  const { data } = await supabaseAdmin
    .from("invoices")
    .select("*, line_items(*)")
    .eq("id", id)
    .single();

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
