import { NextResponse } from "next/server";
import {
  buildSummary,
  buildUserRows,
  fetchAdminRows,
  fetchAllAuthUsers,
  fetchInvoiceStats,
  requireAdmin,
} from "@/lib/admin-server";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { supabaseAdmin } = auth;

  try {
    const [users, adminRows, invoices] = await Promise.all([
      fetchAllAuthUsers(supabaseAdmin),
      fetchAdminRows(supabaseAdmin),
      fetchInvoiceStats(supabaseAdmin),
    ]);

    const userRows = buildUserRows(users, adminRows, invoices);
    const summary = buildSummary(userRows, invoices);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load admin summary" },
      { status: 500 }
    );
  }
}
