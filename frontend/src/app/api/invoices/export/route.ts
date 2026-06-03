import { NextRequest, NextResponse } from "next/server";
import { buildCsvResponse, requireUser, safeAudit } from "@/lib/invoice-server";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const { user, supabaseAdmin } = auth;

  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");

  let query = supabaseAdmin
    .from("invoices")
    .select("*, line_items(*)")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.or(
      `filename.ilike.%${search}%,vendor_name.ilike.%${search}%,invoice_number.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await Promise.all(
    (data ?? []).map((invoice) =>
      safeAudit({
        invoiceId: invoice.id,
        userId: user.id,
        action: "exported",
        details: { status: status ?? "all", search: search ?? "" },
      })
    )
  );

  return new NextResponse(buildCsvResponse(data ?? []), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="invoices-export.csv"',
    },
  });
}
