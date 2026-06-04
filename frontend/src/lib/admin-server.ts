import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";
import type {
  AdminActivityRow,
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

type PersonLike = {
  email?: string | null;
  name?: string | null;
  user_metadata?: Record<string, unknown> | undefined;
};

type ActivityStats = {
  invoice_count: number;
  review_count: number;
  attention_count: number;
  failed_count: number;
  duplicate_count: number;
  review_load_count: number;
  total_value: number;
  last_activity_at: string | null;
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

function userName(user: PersonLike | null | undefined) {
  if (!user) return null;
  if (typeof user.name === "string" && user.name.trim()) return user.name;
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

function buildActivityStats(): ActivityStats {
  return {
    invoice_count: 0,
    review_count: 0,
    attention_count: 0,
    failed_count: 0,
    duplicate_count: 0,
    review_load_count: 0,
    total_value: 0,
    last_activity_at: null,
  };
}

function attentionReasonList(row: InvoiceStatRow): NonNullable<AdminInvoiceRow["attention_reasons"]> {
  return Array.isArray(row.attention_reasons)
    ? (row.attention_reasons as NonNullable<AdminInvoiceRow["attention_reasons"]>)
    : [];
}

function hasDuplicateUpload(row: InvoiceStatRow) {
  const attentionReasons = attentionReasonList(row) ?? [];
  return row.duplicate_of_invoice_id != null || attentionReasons.includes("duplicate_upload");
}

function activityLabel(user: PersonLike | null | undefined) {
  if (!user) return null;
  return user.email ?? userName(user) ?? null;
}

function vendorLabel(invoice: InvoiceStatRow) {
  return invoice.vendor_name?.trim() || invoice.filename?.trim() || "Unknown vendor";
}

function addActivityRow(
  statsByKey: Map<string, ActivityStats>,
  key: string,
  updater: (stats: ActivityStats) => void
) {
  const stats = statsByKey.get(key) ?? buildActivityStats();
  updater(stats);
  statsByKey.set(key, stats);
  return stats;
}

function toActivityRow(
  id: string,
  label: string,
  stats: ActivityStats
): AdminActivityRow {
  return {
    id,
    label,
    invoice_count: stats.invoice_count,
    review_count: stats.review_count,
    attention_count: stats.attention_count,
    failed_count: stats.failed_count,
    duplicate_count: stats.duplicate_count,
    review_load_count: stats.review_load_count,
    total_value: Math.round(stats.total_value * 100) / 100,
    last_activity_at: stats.last_activity_at,
  };
}

function sortByVolume(left: AdminActivityRow, right: AdminActivityRow) {
  const countDiff = right.invoice_count - left.invoice_count;
  if (countDiff !== 0) return countDiff;
  const loadDiff = right.review_load_count - left.review_load_count;
  if (loadDiff !== 0) return loadDiff;
  return right.total_value - left.total_value;
}

function sortByReviewLoad(left: AdminActivityRow, right: AdminActivityRow) {
  const loadDiff = right.review_load_count - left.review_load_count;
  if (loadDiff !== 0) return loadDiff;
  const duplicateDiff = right.duplicate_count - left.duplicate_count;
  if (duplicateDiff !== 0) return duplicateDiff;
  return right.invoice_count - left.invoice_count;
}

function sortByDuplicates(left: AdminActivityRow, right: AdminActivityRow) {
  const duplicateDiff = right.duplicate_count - left.duplicate_count;
  if (duplicateDiff !== 0) return duplicateDiff;
  const loadDiff = right.review_load_count - left.review_load_count;
  if (loadDiff !== 0) return loadDiff;
  return right.invoice_count - left.invoice_count;
}

function sortByUrgency(left: AdminInvoiceRow, right: AdminInvoiceRow) {
  const leftScore =
    (left.status === "failed" ? 3 : 0) + (left.needs_attention ? 2 : 0) + (left.duplicate_of_invoice_id != null ? 1 : 0);
  const rightScore =
    (right.status === "failed" ? 3 : 0) + (right.needs_attention ? 2 : 0) + (right.duplicate_of_invoice_id != null ? 1 : 0);
  if (rightScore !== leftScore) return rightScore - leftScore;

  const leftConfidence = left.confidence_score ?? Number.POSITIVE_INFINITY;
  const rightConfidence = right.confidence_score ?? Number.POSITIVE_INFINITY;
  if (leftConfidence !== rightConfidence) return leftConfidence - rightConfidence;

  const leftStamp = left.uploaded_at ? new Date(left.uploaded_at).getTime() : 0;
  const rightStamp = right.uploaded_at ? new Date(right.uploaded_at).getTime() : 0;
  return rightStamp - leftStamp;
}

function buildInvoiceRow(invoice: InvoiceStatRow, userMap: Map<string, PersonLike>): AdminInvoiceRow {
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
    attention_reasons: attentionReasonList(invoice) as AdminInvoiceRow["attention_reasons"],
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
    .map((invoice) => buildInvoiceRow(invoice, userMap))
    .sort((left, right) => {
      const leftStamp = left.uploaded_at ? new Date(left.uploaded_at).getTime() : 0;
      const rightStamp = right.uploaded_at ? new Date(right.uploaded_at).getTime() : 0;
      return rightStamp - leftStamp;
    });
}

export function buildSummary(users: AdminUserRow[], invoices: InvoiceStatRow[]): AdminSummary {
  const userMap = new Map(users.map((user) => [user.id, user]));
  const activityByUser = new Map<string, ActivityStats>();
  const activityByVendor = new Map<string, ActivityStats>();
  const vendorLabels = new Map<string, string>();
  const invoiceRows = invoices.map((invoice) => buildInvoiceRow(invoice, userMap));
  let processing = 0;
  let awaitingReview = 0;
  let approved = 0;
  let rejected = 0;
  let failed = 0;
  let totalValue = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;
  let attention = 0;
  let duplicateUploads = 0;
  const attentionInvoices: AdminInvoiceRow[] = [];
  const failedInvoices: AdminInvoiceRow[] = [];

  for (let index = 0; index < invoices.length; index += 1) {
    const invoice = invoices[index];
    const row = invoiceRows[index];
    const duplicate = hasDuplicateUpload(invoice);
    const reviewLoad = invoice.status === "review" || invoice.needs_attention || invoice.status === "failed" || duplicate;
    const vendorDisplay = vendorLabel(invoice);
    const vendorKey = vendorDisplay.toLowerCase();

    if (!vendorLabels.has(vendorKey)) {
      vendorLabels.set(vendorKey, vendorDisplay);
    }

    totalValue += Number(invoice.total_amount ?? 0);
    if (invoice.confidence_score != null) {
      confidenceSum += Number(invoice.confidence_score);
      confidenceCount += 1;
    }
    if (invoice.needs_attention) attention += 1;
    if (duplicate) duplicateUploads += 1;

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

    if (invoice.user_id) {
      addActivityRow(activityByUser, invoice.user_id, (stats) => {
        stats.invoice_count += 1;
        stats.total_value += Number(invoice.total_amount ?? 0);
        if (invoice.status === "review") stats.review_count += 1;
        if (invoice.needs_attention) stats.attention_count += 1;
        if (invoice.status === "failed") stats.failed_count += 1;
        if (duplicate) stats.duplicate_count += 1;
        if (reviewLoad) stats.review_load_count += 1;
        if (invoice.uploaded_at && (!stats.last_activity_at || invoice.uploaded_at > stats.last_activity_at)) {
          stats.last_activity_at = invoice.uploaded_at;
        }
      });
    }

    addActivityRow(activityByVendor, vendorKey, (stats) => {
      stats.invoice_count += 1;
      stats.total_value += Number(invoice.total_amount ?? 0);
      if (invoice.status === "review") stats.review_count += 1;
      if (invoice.needs_attention) stats.attention_count += 1;
      if (invoice.status === "failed") stats.failed_count += 1;
      if (duplicate) stats.duplicate_count += 1;
      if (reviewLoad) stats.review_load_count += 1;
      if (invoice.uploaded_at && (!stats.last_activity_at || invoice.uploaded_at > stats.last_activity_at)) {
        stats.last_activity_at = invoice.uploaded_at;
      }
    });

    if (row.status === "failed") failedInvoices.push(row);
    if ((row.needs_attention || row.status === "review") && row.status !== "failed") attentionInvoices.push(row);
  }

  const recentUsers = [...users].slice(0, 5);
  const recentInvoices = [...invoiceRows].sort((left, right) => {
    const leftStamp = left.uploaded_at ? new Date(left.uploaded_at).getTime() : 0;
    const rightStamp = right.uploaded_at ? new Date(right.uploaded_at).getTime() : 0;
    return rightStamp - leftStamp;
  }).slice(0, 5);

  const topUsers = [...activityByUser.entries()]
    .map(([id, stats]) => {
      const user = userMap.get(id);
      return toActivityRow(id, activityLabel(user) ?? id, stats);
    })
    .sort(sortByVolume)
    .slice(0, 5);

  const reviewLoadUsers = [...activityByUser.entries()]
    .map(([id, stats]) => {
      const user = userMap.get(id);
      return toActivityRow(id, activityLabel(user) ?? id, stats);
    })
    .sort(sortByReviewLoad)
    .slice(0, 5);

  const duplicateHeavyUsers = [...activityByUser.entries()]
    .map(([id, stats]) => {
      const user = userMap.get(id);
      return toActivityRow(id, activityLabel(user) ?? id, stats);
    })
    .filter((row) => row.duplicate_count > 0)
    .sort(sortByDuplicates)
    .slice(0, 5);

  const topVendors = [...activityByVendor.entries()]
    .map(([id, stats]) => toActivityRow(id, vendorLabels.get(id) ?? id, stats))
    .sort(sortByVolume)
    .slice(0, 5);

  const attentionRate = invoices.length > 0 ? (attention / invoices.length) * 100 : 0;
  const failedRate = invoices.length > 0 ? (failed / invoices.length) * 100 : 0;
  const duplicateRate = invoices.length > 0 ? (duplicateUploads / invoices.length) * 100 : 0;

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
    attention_rate: Math.round(attentionRate * 10) / 10,
    failed_extraction_rate: Math.round(failedRate * 10) / 10,
    duplicate_upload_rate: Math.round(duplicateRate * 10) / 10,
    total_value: Math.round(totalValue * 100) / 100,
    avg_confidence: confidenceCount > 0 ? Math.round((confidenceSum / confidenceCount) * 10) / 10 : 0,
    recent_users: recentUsers,
    recent_invoices: recentInvoices,
    top_users: topUsers,
    review_load_users: reviewLoadUsers,
    top_vendors: topVendors,
    duplicate_heavy_users: duplicateHeavyUsers,
    attention_invoices: attentionInvoices.sort(sortByUrgency).slice(0, 5),
    failed_invoices: failedInvoices.sort(sortByUrgency).slice(0, 5),
  };
}

export async function findUserByEmail(supabaseAdmin: SupabaseClient, email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const users = await fetchAllAuthUsers(supabaseAdmin);
  return users.find((user) => normalizeEmail(user.email) === normalized) ?? null;
}
