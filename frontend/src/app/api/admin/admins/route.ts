import { NextResponse } from "next/server";
import {
  buildUserRows,
  fetchAdminRows,
  fetchAllAuthUsers,
  fetchInvoiceStats,
  findUserByEmail,
  isBootstrapAdminEmail,
  requireAdmin,
} from "@/lib/admin-server";

async function resolveTarget(
  supabaseAdmin: Parameters<typeof fetchAllAuthUsers>[0],
  body: { user_id?: string; email?: string }
) {
  if (body.user_id) {
    const users = await fetchAllAuthUsers(supabaseAdmin);
    return users.find((user) => user.id === body.user_id) ?? null;
  }
  if (body.email) {
    return findUserByEmail(supabaseAdmin, body.email);
  }
  return null;
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { supabaseAdmin, user: actor } = auth;
  const body = (await req.json()) as { user_id?: string; email?: string };

  try {
    const target = await resolveTarget(supabaseAdmin, body);
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (isBootstrapAdminEmail(target.email)) {
      return NextResponse.json(
        { error: "This admin is controlled by ADMIN_BOOTSTRAP_EMAILS." },
        { status: 409 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", target.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existing) {
      const { error } = await supabaseAdmin.from("admin_users").insert({
        user_id: target.id,
        granted_by: actor.id,
        note: "Granted from admin console",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, is_admin: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to grant admin access" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { supabaseAdmin } = auth;
  const body = (await req.json()) as { user_id?: string; email?: string };

  try {
    const users = await fetchAllAuthUsers(supabaseAdmin);
    const adminRows = await fetchAdminRows(supabaseAdmin);
    const invoices = await fetchInvoiceStats(supabaseAdmin);
    const rows = buildUserRows(users, adminRows, invoices);

    const target = body.user_id
      ? rows.find((row) => row.id === body.user_id)
      : rows.find((row) => row.email?.toLowerCase() === body.email?.trim().toLowerCase());

    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!target.is_admin) {
      return NextResponse.json({ ok: true, is_admin: false });
    }

    if (target.is_bootstrap_admin) {
      return NextResponse.json(
        { error: "This admin is controlled by ADMIN_BOOTSTRAP_EMAILS." },
        { status: 409 }
      );
    }

    const adminCount = rows.filter((row) => row.is_admin).length;
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "You need at least one admin account." },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from("admin_users").delete().eq("user_id", target.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, is_admin: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke admin access" },
      { status: 500 }
    );
  }
}
