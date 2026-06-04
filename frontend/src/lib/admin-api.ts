"use client";

import { getAccessToken } from "./supabase";
import type {
  AdminInvoiceListResponse,
  AdminInvoiceRow,
  AdminRoleResult,
  AdminSummary,
  AdminUserListResponse,
  AdminUserRow,
} from "./admin-types";
import type { Invoice, InvoiceAuditEntry } from "./types";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* noop */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function buildParams(params: Record<string, string | number | boolean | undefined | null>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    searchParams.set(key, String(value));
  }
  return searchParams.toString();
}

export const adminApi = {
  async summary(): Promise<AdminSummary> {
    const res = await fetch("/api/admin/summary", { headers: await authHeaders(), cache: "no-store" });
    return handle<AdminSummary>(res);
  },

  async users(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<AdminUserListResponse> {
    const qs = buildParams(params);
    const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ""}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    return handle<AdminUserListResponse>(res);
  },

  async invoices(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<AdminInvoiceListResponse> {
    const qs = buildParams(params);
    const res = await fetch(`/api/admin/invoices${qs ? `?${qs}` : ""}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    return handle<AdminInvoiceListResponse>(res);
  },

  async getInvoice(id: number): Promise<AdminInvoiceRow> {
    const res = await fetch(`/api/admin/invoices/${id}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    return handle<AdminInvoiceRow>(res);
  },

  async updateInvoice(id: number, patch: Partial<Invoice>): Promise<AdminInvoiceRow> {
    const res = await fetch(`/api/admin/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(patch),
    });
    return handle<AdminInvoiceRow>(res);
  },

  async deleteInvoice(id: number): Promise<void> {
    const res = await fetch(`/api/admin/invoices/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    return handle<void>(res);
  },

  async retryInvoice(id: number): Promise<{ ok: true; retry_count: number }> {
    const res = await fetch(`/api/admin/invoices/${id}/retry`, {
      method: "POST",
      headers: await authHeaders(),
    });
    return handle<{ ok: true; retry_count: number }>(res);
  },

  async invoiceHistory(id: number) {
    const res = await fetch(`/api/admin/invoices/${id}/history`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    return handle<InvoiceAuditEntry[]>(res);
  },

  async grantAdmin(payload: { user_id?: string; email?: string }): Promise<AdminRoleResult> {
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(payload),
    });
    return handle<AdminRoleResult>(res);
  },

  async revokeAdmin(payload: { user_id?: string; email?: string }): Promise<AdminRoleResult> {
    const res = await fetch("/api/admin/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(payload),
    });
    return handle<AdminRoleResult>(res);
  },

  async listAdmins(params: { search?: string } = {}): Promise<AdminUserRow[]> {
    const admins: AdminUserRow[] = [];
    let page = 1;

    while (page < 100) {
      const data = await this.users({ ...params, page, limit: 100 });
      admins.push(...data.items.filter((user) => user.is_admin));
      if (page >= data.pages) break;
      page += 1;
    }

    return admins;
  },
};
