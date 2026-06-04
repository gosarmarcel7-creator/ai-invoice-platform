import { NextResponse } from "next/server";
import { buildInvoiceRows, fetchAllAuthUsers, fetchInvoiceStats, requireAdmin } from "@/lib/admin-server";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { supabaseAdmin } = auth;
  const url = new URL(req.url);
  const page = clamp(Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1, 10_000);
  const limit = clamp(Number.parseInt(url.searchParams.get("limit") ?? "25", 10) || 25, 1, 100);
  const status = (url.searchParams.get("status") ?? "").trim().toLowerCase();
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

  try {
    const [users, invoices] = await Promise.all([
      fetchAllAuthUsers(supabaseAdmin),
      fetchInvoiceStats(supabaseAdmin),
    ]);

    const rows = buildInvoiceRows(invoices, users).filter((invoice) => {
      if (status && status !== "all" && invoice.status !== status) return false;
      if (!search) return true;
      return [
        invoice.filename,
        invoice.vendor_name,
        invoice.invoice_number,
        invoice.user_email,
        invoice.user_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });

    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, pages);
    const start = (safePage - 1) * limit;

    return NextResponse.json({
      items: rows.slice(start, start + limit),
      total,
      page: safePage,
      limit,
      pages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load invoices" },
      { status: 500 }
    );
  }
}
