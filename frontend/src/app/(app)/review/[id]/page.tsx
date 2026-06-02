"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Check, X, Plus, Trash2,
  FileText, Sparkles, Loader2, AlertTriangle,
} from "lucide-react";
import { api, type Invoice, type LineItem } from "@/lib/api";
import { formatCurrency, formatDate, statusConfig } from "@/lib/utils";
import { toast } from "sonner";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
      {children}
    </label>
  );
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color =
    pct >= 90 ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" :
    pct >= 70 ? "text-amber-300 bg-amber-500/10 border-amber-500/30" :
                "text-rose-300 bg-rose-500/10 border-rose-500/30";
  const icon = pct >= 70 ? <Sparkles className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
      {icon}
      {pct}% confidence
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function emptyLineItem(): LineItem {
  return { description: "", quantity: 1, unit_price: 0, total_price: 0 };
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    api
      .get<Invoice>(`/api/invoices/${id}`)
      .then((r) => {
        setInvoice(r.data);
        setForm(structuredClone(r.data));
      })
      .catch(() => toast.error("Invoice not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--violet)]" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="py-24 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--text-4)]" />
        <p className="font-semibold text-[var(--text-2)]">Invoice not found</p>
        <button onClick={() => router.push("/review")} className="btn btn-secondary mt-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to queue
        </button>
      </div>
    );
  }

  const setField = (key: keyof Invoice, value: unknown) =>
    setForm((f) => f ? { ...f, [key]: value } : f);

  const setLineItem = (i: number, key: keyof LineItem, value: string | number) => {
    const items = [...(form.line_items ?? [])];
    items[i] = { ...items[i], [key]: value };
    if (key === "quantity" || key === "unit_price") {
      const qty = key === "quantity" ? Number(value) : Number(items[i].quantity);
      const price = key === "unit_price" ? Number(value) : Number(items[i].unit_price);
      items[i].total_price = Math.round(qty * price * 100) / 100;
    }
    setField("line_items", items);
  };

  const addLineItem = () =>
    setField("line_items", [...(form.line_items ?? []), emptyLineItem()]);

  const removeLineItem = (i: number) =>
    setField("line_items", form.line_items.filter((_, idx) => idx !== i));

  const save = async (nextStatus?: string) => {
    const payload = { ...form, status: nextStatus ?? form.status };
    const res = await api.put<Invoice>(`/api/invoices/${id}`, payload);
    setInvoice(res.data);
    setForm(structuredClone(res.data));
    return res;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try { await save(); toast.success("Draft saved"); }
    catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleApprove = async () => {
    setApproving(true);
    try { await save("approved"); toast.success("Invoice approved!"); router.push("/review"); }
    catch { toast.error("Failed to approve"); setApproving(false); }
  };

  const handleReject = async () => {
    setRejecting(true);
    try { await save("rejected"); toast.success("Invoice rejected"); router.push("/review"); }
    catch { toast.error("Failed to reject"); setRejecting(false); }
  };

  const lineTotal = form.line_items?.reduce((s, i) => s + (i.total_price ?? 0), 0) ?? 0;
  const isReadOnly = form.status === "approved" || form.status === "rejected";

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/review")}
            className="rounded-xl border border-[var(--border)] bg-white/5 p-2 text-[var(--text-2)] transition-all hover:border-[var(--border-2)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="max-w-sm truncate font-[var(--font-display)] text-xl font-bold text-white">
                {invoice?.filename}
              </h1>
              <StatusBadge status={form.status} />
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">
              Uploaded {formatDate(invoice?.uploaded_at)} · Invoice #{form.invoice_number || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              <button onClick={handleSaveDraft} disabled={saving} className="btn btn-secondary disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Draft
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="btn rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
              >
                {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="btn rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 text-emerald-200 shadow-[0_0_20px_-6px_rgba(52,211,153,0.7)] transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve
              </button>
            </>
          )}
          {isReadOnly && (
            <button onClick={handleSaveDraft} disabled={saving} className="btn btn-secondary disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Left: raw document */}
        <div className="card flex flex-col overflow-hidden" style={{ minHeight: 600 }}>
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-white/[0.02] px-5 py-3.5">
            <FileText className="h-4 w-4 text-[var(--text-3)]" />
            <span className="text-sm font-semibold text-[var(--text-2)]">Original Document</span>
          </div>
          <div className="flex-1 overflow-auto p-5">
            {invoice?.raw_text ? (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text-2)]">
                {invoice.raw_text}
              </pre>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <FileText className="mb-3 h-8 w-8 text-[var(--text-4)]" />
                <p className="text-sm font-medium text-[var(--text-2)]">No text preview available</p>
                <p className="mt-1 text-xs text-[var(--text-3)]">Original document content not extracted</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI extracted data editor */}
        <div className="card flex flex-col overflow-hidden" style={{ minHeight: 600 }}>
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-white/[0.02] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--violet)]" />
              <span className="text-sm font-semibold text-white">AI Extracted Data</span>
            </div>
            <ConfidenceBadge score={invoice?.confidence_score ?? null} />
          </div>

          <div className="flex-1 space-y-5 overflow-auto p-5">
            {/* Core fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vendor Name</Label>
                <input className="field-input" value={form.vendor_name ?? ""} onChange={(e) => setField("vendor_name", e.target.value || null)} placeholder="Enter vendor name" disabled={isReadOnly} />
              </div>
              <div>
                <Label>Invoice Number</Label>
                <input className="field-input" value={form.invoice_number ?? ""} onChange={(e) => setField("invoice_number", e.target.value || null)} placeholder="INV-XXXX" disabled={isReadOnly} />
              </div>
              <div>
                <Label>Invoice Date</Label>
                <input className="field-input" type="date" value={form.date ?? ""} onChange={(e) => setField("date", e.target.value || null)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Due Date</Label>
                <input className="field-input" type="date" value={form.due_date ?? ""} onChange={(e) => setField("due_date", e.target.value || null)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Total Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--text-3)]">$</span>
                  <input className="field-input pl-6" type="number" step="0.01" value={form.total_amount ?? ""} onChange={(e) => setField("total_amount", e.target.value ? parseFloat(e.target.value) : null)} placeholder="0.00" disabled={isReadOnly} />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <select className="field-input" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                  <option value="processing">Processing</option>
                  <option value="review">Needs Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Internal Notes</Label>
              <textarea className="field-input resize-none" rows={2} value={form.notes ?? ""} onChange={(e) => setField("notes", e.target.value || null)} placeholder="Add notes for the finance team…" disabled={isReadOnly} />
            </div>

            {/* Line items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Line Items</Label>
                {!isReadOnly && (
                  <button onClick={addLineItem} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-2)] transition-colors hover:text-white">
                    <Plus className="h-3.5 w-3.5" /> Add row
                  </button>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-white/[0.02]">
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">Description</th>
                      <th className="w-16 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">Qty</th>
                      <th className="w-24 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">Unit ($)</th>
                      <th className="w-24 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">Total</th>
                      {!isReadOnly && <th className="w-8" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(!form.line_items || form.line_items.length === 0) ? (
                      <tr>
                        <td colSpan={isReadOnly ? 4 : 5} className="px-3 py-8 text-center text-xs text-[var(--text-3)]">
                          No line items — {isReadOnly ? "none were extracted." : 'click "Add row" to add one'}
                        </td>
                      </tr>
                    ) : (
                      form.line_items.map((item, i) => (
                        <tr key={i} className="group transition-colors hover:bg-white/[0.03]">
                          <td className="px-2 py-2">
                            <input
                              className="w-full border-b border-transparent bg-transparent py-0.5 text-sm text-white outline-none transition-colors placeholder:text-[var(--text-4)] focus:border-[var(--accent)]"
                              value={item.description ?? ""}
                              onChange={(e) => setLineItem(i, "description", e.target.value)}
                              placeholder="Description…"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input className="w-full border-b border-transparent bg-transparent py-0.5 text-sm text-white outline-none transition-colors focus:border-[var(--accent)]" type="number" value={item.quantity ?? ""} onChange={(e) => setLineItem(i, "quantity", parseFloat(e.target.value) || 0)} disabled={isReadOnly} />
                          </td>
                          <td className="px-2 py-2">
                            <input className="w-full border-b border-transparent bg-transparent py-0.5 text-sm text-white outline-none transition-colors focus:border-[var(--accent)]" type="number" step="0.01" value={item.unit_price ?? ""} onChange={(e) => setLineItem(i, "unit_price", parseFloat(e.target.value) || 0)} disabled={isReadOnly} />
                          </td>
                          <td className="px-2 py-2">
                            <span className="tabnum text-sm font-semibold text-[var(--text-2)]">{formatCurrency(item.total_price)}</span>
                          </td>
                          {!isReadOnly && (
                            <td className="px-2 py-2">
                              <button onClick={() => removeLineItem(i)} className="text-[var(--text-4)] opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {(form.line_items?.length ?? 0) > 0 && (
                    <tfoot>
                      <tr className="border-t border-[var(--border)] bg-white/[0.02]">
                        <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
                          Subtotal
                        </td>
                        <td className="tabnum px-2 py-2.5 text-sm font-black text-white">
                          {formatCurrency(lineTotal)}
                        </td>
                        {!isReadOnly && <td />}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
