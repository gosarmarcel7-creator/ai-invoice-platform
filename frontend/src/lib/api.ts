"use client";

import { getAccessToken } from "./supabase";
import type {
  Analytics,
  Invoice,
  InvoiceAuditEntry,
  InvoiceListResponse,
  InvoiceStatus,
  TimeSeries,
} from "./types";

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

export const api = {
  async analytics(): Promise<Analytics> {
    const res = await fetch("/api/analytics", { headers: await authHeaders(), cache: "no-store" });
    return handle<Analytics>(res);
  },

  async timeseries(): Promise<TimeSeries> {
    const res = await fetch("/api/analytics/timeseries", {
      headers: await authHeaders(),
      cache: "no-store",
    });
    return handle<TimeSeries>(res);
  },

  async listInvoices(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<InvoiceListResponse> {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);
    const res = await fetch(`/api/invoices?${qs.toString()}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    return handle<InvoiceListResponse>(res);
  },

  async getInvoice(id: number): Promise<Invoice> {
    const res = await fetch(`/api/invoices/${id}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    return handle<Invoice>(res);
  },

  async uploadInvoice(file: File): Promise<Invoice> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: await authHeaders(),
      body: form,
    });
    return handle<Invoice>(res);
  },

  async updateInvoice(id: number, patch: Partial<Invoice>): Promise<Invoice> {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(patch),
    });
    return handle<Invoice>(res);
  },

  async deleteInvoice(id: number): Promise<void> {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    return handle<void>(res);
  },

  async retryInvoice(id: number): Promise<{ ok: true; retry_count: number }> {
    const res = await fetch(`/api/invoices/${id}/retry`, {
      method: "POST",
      headers: await authHeaders(),
    });
    return handle<{ ok: true; retry_count: number }>(res);
  },

  async invoiceHistory(id: number): Promise<InvoiceAuditEntry[]> {
    const res = await fetch(`/api/invoices/${id}/history`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    return handle<InvoiceAuditEntry[]>(res);
  },

  async bulkUpdateInvoices(ids: number[], action: InvoiceStatus): Promise<{
    ok: true;
    updated: Invoice[];
    count: number;
  }> {
    const res = await fetch("/api/invoices/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ ids, action }),
    });
    return handle<{ ok: true; updated: Invoice[]; count: number }>(res);
  },

  async exportInvoices(params: { status?: string; search?: string } = {}): Promise<string> {
    const qs = new URLSearchParams();
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);
    const res = await fetch(`/api/invoices/export?${qs.toString()}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) {
      return handle<string>(res);
    }
    return res.text();
  },
};
