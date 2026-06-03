import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/invoice-server";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { user, supabaseAdmin } = auth;

  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString();

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("uploaded_at, status, total_amount")
    .eq("user_id", user.id)
    .gte("uploaded_at", yearStart);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build weekly map (last 7 days)
  const weeklyMap: Record<string, { day: string; date: string; total: number; approved: number; rejected: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    weeklyMap[ds] = { day: d.toLocaleDateString("en-US", { weekday: "short" }), date: ds, total: 0, approved: 0, rejected: 0 };
  }

  // Build monthly map (YTD)
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyMap: Record<number, { month: string; total: number; value: number }> = {};
  for (let m = 0; m <= today.getMonth(); m++) {
    monthlyMap[m] = { month: months[m], total: 0, value: 0 };
  }

  for (const row of data ?? []) {
    if (!row.uploaded_at) continue;
    const d = new Date(row.uploaded_at);
    const ds = d.toISOString().slice(0, 10);

    if (weeklyMap[ds]) {
      weeklyMap[ds].total++;
      if (row.status === "approved") weeklyMap[ds].approved++;
      else if (row.status === "rejected") weeklyMap[ds].rejected++;
    }

    const m = d.getMonth();
    if (monthlyMap[m] !== undefined) {
      monthlyMap[m].total++;
      if (row.status === "approved" && row.total_amount) monthlyMap[m].value += row.total_amount;
    }
  }

  return NextResponse.json({
    weekly: Object.values(weeklyMap),
    monthly: Object.values(monthlyMap).map((v) => ({ ...v, value: Math.round(v.value * 100) / 100 })),
  });
}
