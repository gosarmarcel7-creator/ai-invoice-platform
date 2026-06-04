import type { Invoice } from "./types";

export interface AdminSummary {
  total_users: number;
  total_admins: number;
  total_invoices: number;
  processing: number;
  awaiting_review: number;
  approved: number;
  rejected: number;
  failed: number;
  attention: number;
  total_value: number;
  avg_confidence: number;
  recent_users: AdminUserRow[];
  recent_invoices: AdminInvoiceRow[];
}

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  is_admin: boolean;
  is_bootstrap_admin: boolean;
  invoice_count: number;
  total_value: number;
  approved_count: number;
  review_count: number;
  rejected_count: number;
  processing_count: number;
  failed_count: number;
  last_invoice_at: string | null;
}

export interface AdminUserListResponse {
  items: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminInvoiceRow extends Invoice {
  user_email: string | null;
  user_name: string | null;
}

export interface AdminInvoiceListResponse {
  items: AdminInvoiceRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminRoleResult {
  ok: true;
  is_admin: boolean;
}
