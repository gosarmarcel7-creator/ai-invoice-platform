import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const token = getUserFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("status, total_amount, confidence_score")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const byStatus: Record<string, number> = {};
  let totalValue = 0;
  let confSum = 0;
  let confCount = 0;

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    if (row.total_amount) totalValue += row.total_amount;
    if (row.confidence_score != null) { confSum += row.confidence_score; confCount++; }
  }

  return NextResponse.json({
    total_documents: rows.length,
    processing: byStatus.processing ?? 0,
    awaiting_review: byStatus.review ?? 0,
    approved: byStatus.approved ?? 0,
    rejected: byStatus.rejected ?? 0,
    total_value: Math.round(totalValue * 100) / 100,
    avg_confidence: confCount > 0 ? Math.round((confSum / confCount) * 1000) / 10 : 0,
  });
}
