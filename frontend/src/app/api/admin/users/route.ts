import { NextResponse } from "next/server";
import {
  buildUserRows,
  fetchAdminRows,
  fetchAllAuthUsers,
  fetchInvoiceStats,
  requireAdmin,
} from "@/lib/admin-server";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { supabaseAdmin } = auth;
  const url = new URL(req.url);
  const page = clamp(Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1, 10_000);
  const limit = clamp(Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1, 100);
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

  try {
    const [users, adminRows, invoices] = await Promise.all([
      fetchAllAuthUsers(supabaseAdmin),
      fetchAdminRows(supabaseAdmin),
      fetchInvoiceStats(supabaseAdmin),
    ]);

    const rows = buildUserRows(users, adminRows, invoices).filter((user) => {
      if (!search) return true;
      return [user.email, user.name, user.id]
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
      { error: error instanceof Error ? error.message : "Failed to load users" },
      { status: 500 }
    );
  }
}
