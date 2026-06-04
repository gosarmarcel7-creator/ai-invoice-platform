import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";
import type {
  AdminInvoiceRow,
  AdminSummary,
  AdminUserRow,
} from "@/lib/admin-types";

type InvoiceStatRow = {
  id: number;
  user_id: string | null;
  status: string;
  total_amount: number | null;
  confidence_score: number | null;
  needs_attention: boolean | null;
  uploaded_at: string | null;
  filename: string | null;
  vendor_name: string | null;
  invoice_number: string | null;
  raw_text?: string | null;
  last_error?: string | null;
  retry_count?: number | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  processed_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  duplicate_of_invoice_id?: number | null;
  attention_reasons?: unknown;
};

type AdminRow = {
  user_id: string;
  granted_at: string | null;
  granted_by: string | null;
  note: string | null;
};

const bootstrapEmails = new Set(
  (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function isBootstrapAdminEmail(email: string | null | undefined) {
  return bootstrapEmails.has(normalizeEmail(email));
}

export async function requireAdmin(req: Request) {
  const token = getUserFromRequest(req);
  if (!token) {
    return { error: jsonError("Not authenticated", 401) };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data.user;

  if (error || !user) {
    return { error: jsonError("Invalid token", 401) };
  }

  const isBootstrap = isBootstrapAdminEmail(user.email);
  const { data: row, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("user_id, granted_at, granted_by, note")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return { error: jsonError(adminError.message, 500) };
  }

  if (!row && !isBootstrap) {
    return { error: jsonError("Forbidden", 403) };
  }

  return { user, supabaseAdmin, adminRow: row as AdminRow | null, isBootstrapAdmin: isBootstrap };
}

export async function fetchAllAuthUsers(supabaseAdmin: SupabaseClient) {
  const perPage = 200;
  const users: User[] = [];

  for (let page = 1; page < 1000; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
  }

  return users;
}

export async function fetchAdminRows(supabaseAdmin: SupabaseClient) {
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("user_id, granted_at, granted_by, note");

  if (error) throw error;
  return (data ?? []) as AdminRow[];
}

export async function fetchInvoiceStats(supabaseAdmin: SupabaseClient) {
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select(
      "id, user_id, status, total_amount, confidence_score, needs_attention, uploaded_at, filename, vendor_name, invoice_number, raw_text, last_error, retry_count, mime_type, file_size_bytes, processed_at, reviewed_at, reviewed_by, duplicate_of_invoice_id, attention_reasons"
    );

  if (error) throw error;
  return (data ?? []) as InvoiceStatRow[];
}

function userName(user: User | null | undefined) {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  return (
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    null
  );
}

function isAdminId(userId: string, adminIds: Set<string>) {
  return adminIds.has(userId);
}

export function buildUserRows(users: User[], adminRows: AdminRow[], invoices: InvoiceStatRow[]) {
  const adminIds = new Set(adminRows.map((row) => row.user_id));
  const statsByUser = new Map<
    string,
    {
      invoice_count: number;
      total_value: number;
      approved_count: number;
      review_count: number;
      rejected_count: number;
      processing_count: number;
      failed_count: number;
      last_invoice_at: string | null;
    }
  >();

  for (const invoice of invoices) {
    if (!invoice.user_id) continue;
    const current = statsByUser.get(invoice.user_id) ?? {
      invoice_count: 0,
      total_value: 0,
      approved_count: 0,
      review_count: 0,
      rejected_count: 0,
      processing_count: 0,
      failed_count: 0,
      last_invoice_at: null,
    };

    current.invoice_count += 1;
    current.total_value += Number(invoice.total_amount ?? 0);
    if (invoice.status === "approved") current.approved_count += 1;
    else if (invoice.status === "review") current.review_count += 1;
    else if (invoice.status === "rejected") current.rejected_count += 1;
    else if (invoice.status === "processing") current.processing_count += 1;
    else if (invoice.status === "failed") current.failed_count += 1;

    if (invoice.uploaded_at) {
      if (!current.last_invoice_at || invoice.uploaded_at > current.last_invoice_at) {
        current.last_invoice_at = invoice.uploaded_at;
      }
    }

    statsByUser.set(invoice.user_id, current);
  }

  return users
    .map<AdminUserRow>((user) => {
      const stats = statsByUser.get(user.id) ?? {
        invoice_count: 0,
        total_value: 0,
        approved_count: 0,
        review_count: 0,
        rejected_count: 0,
        processing_count: 0,
        failed_count: 0,
        last_invoice_at: null,
      };

      return {
        id: user.id,
        name: userName(user),
        email: user.email ?? null,
        created_at: user.created_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
        is_admin: isAdminId(user.id, adminIds) || isBootstrapAdminEmail(user.email),
        is_bootstrap_admin: isBootstrapAdminEmail(user.email),
        invoice_count: stats.invoice_count,
        total_value: Math.round(stats.total_value * 100) / 100,
        approved_count: stats.approved_count,
        review_count: stats.review_count,
        rejected_count: stats.rejected_count,
        processing_count: stats.processing_count,
        failed_count: stats.failed_count,
        last_invoice_at: stats.last_invoice_at,
      };
    })
    .sort((left, right) => {
      const leftStamp = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightStamp = right.created_at ? new Date(right.created_at).getTime() : 0;
      return rightStamp - leftStamp;
    });
}

export function buildInvoiceRows(invoices: InvoiceStatRow[], users: User[]) {
  const userMap = new Map(users.map((user) => [user.id, user]));

  return invoices
    .map<AdminInvoiceRow>((invoice) => {
      const owner = invoice.user_id ? userMap.get(invoice.user_id) : undefined;

      return {
        id: invoice.id,
        user_id: invoice.user_id ?? undefined,
        user_email: owner?.email ?? null,
        user_name: userName(owner),
        filename: invoice.filename ?? "",
        raw_text: invoice.raw_text ?? null,
        mime_type: invoice.mime_type ?? null,
        file_size_bytes: invoice.file_size_bytes ?? null,
        file_hash: null,
        duplicate_of_invoice_id: invoice.duplicate_of_invoice_id ?? null,
        vendor_name: invoice.vendor_name ?? null,
        invoice_number: invoice.invoice_number ?? null,
        total_amount: invoice.total_amount ?? null,
        date: null,
        due_date: null,
        confidence_score: invoice.confidence_score ?? null,
        needs_attention: invoice.needs_attention ?? false,
        attention_reasons: Array.isArray(invoice.attention_reasons)
          ? (invoice.attention_reasons as AdminInvoiceRow["attention_reasons"])
          : [],
        processing_started_at: null,
        processed_at: invoice.processed_at ?? null,
        last_error: invoice.last_error ?? null,
        retry_count: invoice.retry_count ?? 0,
        reviewed_by: invoice.reviewed_by ?? null,
        reviewed_at: invoice.reviewed_at ?? null,
        status: invoice.status as AdminInvoiceRow["status"],
        uploaded_at: invoice.uploaded_at,
        line_items: [],
      };
    })
    .sort((left, right) => {
      const leftStamp = left.uploaded_at ? new Date(left.uploaded_at).getTime() : 0;
      const rightStamp = right.uploaded_at ? new Date(right.uploaded_at).getTime() : 0;
      return rightStamp - leftStamp;
    });
}

export function buildSummary(users: AdminUserRow[], invoices: InvoiceStatRow[]): AdminSummary {
  const userMap = new Map(users.map((user) => [user.id, user]));
  let processing = 0;
  let awaitingReview = 0;
  let approved = 0;
  let rejected = 0;
  let failed = 0;
  let totalValue = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;
  let attention = 0;

  for (const invoice of invoices) {
    totalValue += Number(invoice.total_amount ?? 0);
    if (invoice.confidence_score != null) {
      confidenceSum += Number(invoice.confidence_score);
      confidenceCount += 1;
    }
    if (invoice.needs_attention) attention += 1;

    switch (invoice.status) {
      case "processing":
        processing += 1;
        break;
      case "review":
        awaitingReview += 1;
        break;
      case "approved":
        approved += 1;
        break;
      case "rejected":
        rejected += 1;
        break;
      case "failed":
        failed += 1;
        break;
      default:
        break;
    }
  }

  const recentUsers = [...users].slice(0, 5);
  const recentInvoices = [...invoices]
    .sort((left, right) => {
      const leftStamp = left.uploaded_at ? new Date(left.uploaded_at).getTime() : 0;
      const rightStamp = right.uploaded_at ? new Date(right.uploaded_at).getTime() : 0;
      return rightStamp - leftStamp;
    })
    .slice(0, 5);

  return {
    total_users: users.length,
    total_admins: users.filter((user) => user.is_admin).length,
    total_invoices: invoices.length,
    processing,
    awaiting_review: awaitingReview,
    approved,
    rejected,
    failed,
    attention,
    total_value: Math.round(totalValue * 100) / 100,
    avg_confidence: confidenceCount > 0 ? Math.round((confidenceSum / confidenceCount) * 10) / 10 : 0,
    recent_users: recentUsers,
    recent_invoices: recentInvoices.map((invoice) => ({
      id: invoice.id,
      user_id: invoice.user_id ?? undefined,
      user_email: invoice.user_id ? userMap.get(invoice.user_id)?.email ?? null : null,
      user_name: invoice.user_id ? userMap.get(invoice.user_id)?.name ?? null : null,
      filename: invoice.filename ?? "",
      raw_text: invoice.raw_text ?? null,
      mime_type: invoice.mime_type ?? null,
      file_size_bytes: invoice.file_size_bytes ?? null,
      file_hash: null,
      duplicate_of_invoice_id: invoice.duplicate_of_invoice_id ?? null,
      vendor_name: invoice.vendor_name ?? null,
      invoice_number: invoice.invoice_number ?? null,
      total_amount: invoice.total_amount ?? null,
      date: null,
      due_date: null,
      confidence_score: invoice.confidence_score ?? null,
      needs_attention: invoice.needs_attention ?? false,
      attention_reasons: Array.isArray(invoice.attention_reasons)
        ? (invoice.attention_reasons as AdminInvoiceRow["attention_reasons"])
        : [],
      processing_started_at: null,
      processed_at: invoice.processed_at ?? null,
      last_error: invoice.last_error ?? null,
      retry_count: invoice.retry_count ?? 0,
      reviewed_by: invoice.reviewed_by ?? null,
      reviewed_at: invoice.reviewed_at ?? null,
      status: invoice.status as AdminInvoiceRow["status"],
      uploaded_at: invoice.uploaded_at,
      line_items: [],
    })),
  };
}

export async function findUserByEmail(supabaseAdmin: SupabaseClient, email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const users = await fetchAllAuthUsers(supabaseAdmin);
  return users.find((user) => normalizeEmail(user.email) === normalized) ?? null;
}
