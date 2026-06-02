import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";
import { extractInvoiceData } from "@/lib/mistral";

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  if (filename.toLowerCase().endsWith(".pdf")) {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch {}
  }
  return buffer.toString("utf-8");
}

async function processInvoice(invoiceId: number, text: string) {
  const extracted = await extractInvoiceData(text);
  const lineItems = (extracted.line_items as any[]) ?? [];

  await supabaseAdmin.from("invoices").update({
    vendor_name: extracted.vendor_name ?? null,
    invoice_number: extracted.invoice_number ?? null,
    total_amount: extracted.total_amount ?? null,
    date: extracted.date ?? null,
    due_date: extracted.due_date ?? null,
    confidence_score: extracted.confidence_score ?? null,
    status: "review",
  }).eq("id", invoiceId);

  if (lineItems.length > 0) {
    await supabaseAdmin.from("line_items").insert(
      lineItems.map((item: any) => ({
        invoice_id: invoiceId,
        description: item.description ?? null,
        quantity: item.quantity ?? null,
        unit_price: item.unit_price ?? null,
        total_price: item.total_price ?? null,
      }))
    );
  }
}

export async function GET(req: NextRequest) {
  const token = getUserFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "20");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  // Get user from token
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  let query = supabaseAdmin
    .from("invoices")
    .select("*, line_items(*)", { count: "exact" })
    .eq("user_id", user.id);

  if (status && status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.or(`filename.ilike.%${search}%,vendor_name.ilike.%${search}%,invoice_number.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const { data, count, error } = await query
    .order("uploaded_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  return NextResponse.json({
    items: data ?? [],
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function POST(req: NextRequest) {
  const token = getUserFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractText(buffer, file.name);

  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .insert({ filename: file.name, raw_text: text, user_id: user.id, status: "processing" })
    .select("*, line_items(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Process async (fire and forget)
  processInvoice(invoice.id, text).catch(console.error);

  return NextResponse.json(invoice);
}
