"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Save, Check, X, Plus, Trash2,
  FileText, Sparkles, Loader2, AlertTriangle,
} from "lucide-react";
import { api, type Invoice, type LineItem } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import AgStatusBadge from "@/components/ag/app/AgStatusBadge";
import AgGlassCard from "@/components/ag/cards/AgGlassCard";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">
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
        <Loader2 className="h-6 w-6 animate-spin text-[var(--ag-primary-400)]" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="py-24 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--ag-text-disabled)]" />
        <p className="font-semibold text-[var(--ag-text-secondary)]">Invoice not found</p>
        <button type="button" onClick={() => router.push("/review")} className="ag-btn-secondary mt-4">
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

  const addLineItem = () => setField("line_items", [...(form.line_items ?? []), emptyLineItem()]);
  const removeLineItem = (i: number) => setField("line_items", form.line_items.filter((_, idx) => idx !== i));

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
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push("/review")} className="ag-btn-secondary p-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="max-w-sm truncate font-[family-name:var(--font-display)] text-xl font-bold text-white">
                {invoice?.filename}
              </h1>
              <AgStatusBadge status={form.status} />
            </div>
            <p className="mt-0.5 text-xs text-[var(--ag-text-tertiary)]">
              Uploaded {formatDate(invoice?.uploaded_at)} · #{form.invoice_number || "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isReadOnly ? (
            <>
              <button type="button" onClick={handleSaveDraft} disabled={saving} className="ag-btn-secondary">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Draft
              </button>
              <button type="button" onClick={handleReject} disabled={rejecting} className="ag-btn-secondary border-rose-500/30 text-rose-300">
                {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Reject
              </button>
              <button type="button" onClick={handleApprove} disabled={approving} className="ag-btn-primary border-emerald-400/40 bg-emerald-500/20 text-emerald-200">
                {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
              </button>
            </>
          ) : (
            <button type="button" onClick={handleSaveDraft} disabled={saving} className="ag-btn-secondary">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Changes
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AgGlassCard className="flex min-h-[560px] flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--ag-border)] px-5 py-3.5">
            <FileText className="h-4 w-4 text-[var(--ag-text-tertiary)]" />
            <span className="text-sm font-semibold text-[var(--ag-text-secondary)]">Original Document</span>
          </div>
          <div className="flex-1 overflow-auto p-5">
            {invoice?.raw_text ? (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--ag-text-secondary)]">
                {invoice.raw_text}
              </pre>
            ) : (
              <p className="py-16 text-center text-sm text-[var(--ag-text-tertiary)]">No text preview available</p>
            )}
          </div>
        </AgGlassCard>

        <AgGlassCard className="flex min-h-[560px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--ag-border)] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--ag-primary-400)]" />
              <span className="text-sm font-semibold text-white">AI Extracted Data</span>
            </div>
            <ConfidenceBadge score={invoice?.confidence_score ?? null} />
          </div>
          <div className="flex-1 space-y-5 overflow-auto p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vendor Name</Label>
                <input className="ag-field-input" value={form.vendor_name ?? ""} onChange={(e) => setField("vendor_name", e.target.value || null)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Invoice Number</Label>
                <input className="ag-field-input" value={form.invoice_number ?? ""} onChange={(e) => setField("invoice_number", e.target.value || null)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Invoice Date</Label>
                <input className="ag-field-input" type="date" value={form.date ?? ""} onChange={(e) => setField("date", e.target.value || null)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Due Date</Label>
                <input className="ag-field-input" type="date" value={form.due_date ?? ""} onChange={(e) => setField("due_date", e.target.value || null)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Total Amount</Label>
                <input className="ag-field-input" type="number" step="0.01" value={form.total_amount ?? ""} onChange={(e) => setField("total_amount", e.target.value ? parseFloat(e.target.value) : null)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Status</Label>
                <select className="ag-field-input" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                  <option value="processing">Processing</option>
                  <option value="review">Needs Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Internal Notes</Label>
              <textarea className="ag-field-input resize-none" rows={2} value={form.notes ?? ""} onChange={(e) => setField("notes", e.target.value || null)} disabled={isReadOnly} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Line Items</Label>
                {!isReadOnly && (
                  <button type="button" onClick={addLineItem} className="text-xs font-semibold text-[var(--ag-primary-400)]">
                    <Plus className="inline h-3.5 w-3.5" /> Add row
                  </button>
                )}
              </div>
              <div className="overflow-hidden rounded-xl border border-[var(--ag-border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--ag-border)] bg-[var(--ag-surface-glass)]">
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[var(--ag-text-tertiary)]">Description</th>
                      <th className="w-16 px-3 py-2 text-left text-xs font-bold uppercase text-[var(--ag-text-tertiary)]">Qty</th>
                      <th className="w-24 px-3 py-2 text-left text-xs font-bold uppercase text-[var(--ag-text-tertiary)]">Unit</th>
                      <th className="w-24 px-3 py-2 text-left text-xs font-bold uppercase text-[var(--ag-text-tertiary)]">Total</th>
                      {!isReadOnly && <th className="w-8" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ag-border)]">
                    {(form.line_items ?? []).map((item, i) => (
                      <tr key={i}>
                        <td className="px-2 py-2">
                          <input className="w-full bg-transparent text-white outline-none" value={item.description ?? ""} onChange={(e) => setLineItem(i, "description", e.target.value)} disabled={isReadOnly} />
                        </td>
                        <td className="px-2 py-2">
                          <input className="w-full bg-transparent text-white outline-none" type="number" value={item.quantity ?? ""} onChange={(e) => setLineItem(i, "quantity", parseFloat(e.target.value) || 0)} disabled={isReadOnly} />
                        </td>
                        <td className="px-2 py-2">
                          <input className="w-full bg-transparent text-white outline-none" type="number" step="0.01" value={item.unit_price ?? ""} onChange={(e) => setLineItem(i, "unit_price", parseFloat(e.target.value) || 0)} disabled={isReadOnly} />
                        </td>
                        <td className="tabnum px-2 py-2 font-semibold">{formatCurrency(item.total_price)}</td>
                        {!isReadOnly && (
                          <td className="px-2 py-2">
                            <button type="button" onClick={() => removeLineItem(i)} className="text-[var(--ag-text-tertiary)] hover:text-rose-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {(form.line_items?.length ?? 0) > 0 && (
                    <tfoot>
                      <tr className="border-t border-[var(--ag-border)] bg-[var(--ag-surface-glass)]">
                        <td colSpan={3} className="px-3 py-2 text-right text-xs font-bold uppercase text-[var(--ag-text-tertiary)]">Subtotal</td>
                        <td className="tabnum px-2 py-2 font-black text-white">{formatCurrency(lineTotal)}</td>
                        {!isReadOnly && <td />}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </AgGlassCard>
      </div>
    </div>
  );
}
