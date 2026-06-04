import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  processInvoiceExtraction,
  requireUser,
  safeAudit,
} from "@/lib/invoice-server";
import { sanitizeDatabaseText, validateUpload } from "@/lib/invoice-workflow";

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  if (filename.toLowerCase().endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const data = await parser.getText();
      await parser.destroy();
      return data.text;
    } catch {}
  }
  return buffer.toString("utf-8");
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { user, supabaseAdmin } = auth;

  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "20");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

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
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { user, supabaseAdmin } = auth;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  const uploadValidation = validateUpload({
    name: file.name,
    type: file.type,
    size: file.size,
  });
  if (!uploadValidation.ok) {
    return NextResponse.json({ error: uploadValidation.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = sanitizeDatabaseText(await extractText(buffer, file.name));
  const fileHash = createHash("sha256").update(buffer).digest("hex");

  const { data: duplicate } = await supabaseAdmin
    .from("invoices")
    .select("id")
    .eq("user_id", user.id)
    .eq("file_hash", fileHash)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .insert({
      filename: file.name,
      raw_text: text,
      user_id: user.id,
      status: "processing",
      processing_started_at: new Date().toISOString(),
      mime_type: uploadValidation.normalizedMimeType,
      file_size_bytes: file.size,
      file_hash: fileHash,
      duplicate_of_invoice_id: duplicate?.id ?? null,
      needs_attention: Boolean(duplicate?.id),
      attention_reasons: duplicate?.id ? ["duplicate_upload"] : [],
      retry_count: 0,
    })
    .select("*, line_items(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await safeAudit({
    invoiceId: invoice.id,
    userId: user.id,
    supabaseAdmin,
    action: "uploaded",
    toStatus: "processing",
    details: {
      mime_type: uploadValidation.normalizedMimeType,
      file_size_bytes: file.size,
      duplicate_of_invoice_id: duplicate?.id ?? null,
    },
  });

  processInvoiceExtraction(invoice.id, text, user.id, supabaseAdmin, user.id).catch(console.error);

  return NextResponse.json(invoice);
}
