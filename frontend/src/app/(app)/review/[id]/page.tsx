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
    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color =
    pct >= 90 ? "text-green-700 bg-green-50 border-green-200" :
    pct >= 70 ? "text-amber-700 bg-amber-50 border-amber-200" :
                "text-red-700 bg-red-50 border-red-200";
  const icon =
    pct >= 90 ? <Sparkles className="w-3 h-3" /> :
    pct >= 70 ? <Sparkles className="w-3 h-3" /> :
                <AlertTriangle className="w-3 h-3" />;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {icon}
      {pct}% confidence
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text} border ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-24">
        <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="text-stone-600 font-semibold">Invoice not found</p>
        <button onClick={() => router.push("/review")} className="btn btn-secondary text-sm mt-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to queue
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
            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black text-stone-900 truncate max-w-sm">
                {invoice?.filename}
              </h1>
              <StatusBadge status={form.status} />
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Uploaded {formatDate(invoice?.uploaded_at)} · Invoice #{form.invoice_number || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Draft
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="btn text-sm px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg disabled:opacity-50"
              >
                {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="btn text-sm px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg disabled:opacity-50"
              >
                {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Approve
              </button>
            </>
          )}
          {isReadOnly && (
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="btn btn-secondary text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Left: raw document */}
        <div className="card flex flex-col overflow-hidden" style={{ minHeight: 600 }}>
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-stone-100 bg-stone-50">
            <FileText className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-semibold text-stone-600">Original Document</span>
          </div>
          <div className="flex-1 overflow-auto p-5 bg-stone-50">
            {invoice?.raw_text ? (
              <pre className="font-mono text-xs text-stone-600 whitespace-pre-wrap leading-relaxed">
                {invoice.raw_text}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <FileText className="w-8 h-8 text-stone-300 mb-3" />
                <p className="text-stone-500 text-sm font-medium">No text preview available</p>
                <p className="text-stone-400 text-xs mt-1">Original document content not extracted</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI extracted data editor */}
        <div className="card flex flex-col overflow-hidden" style={{ minHeight: 600 }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-stone-50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-stone-700">AI Extracted Data</span>
            </div>
            <ConfidenceBadge score={invoice?.confidence_score ?? null} />
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-5">
            {/* Core fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vendor Name</Label>
                <input
                  className="field-input"
                  value={form.vendor_name ?? ""}
                  onChange={(e) => setField("vendor_name", e.target.value || null)}
                  placeholder="Enter vendor name"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label>Invoice Number</Label>
                <input
                  className="field-input"
                  value={form.invoice_number ?? ""}
                  onChange={(e) => setField("invoice_number", e.target.value || null)}
                  placeholder="INV-XXXX"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label>Invoice Date</Label>
                <input
                  className="field-input"
                  type="date"
                  value={form.date ?? ""}
                  onChange={(e) => setField("date", e.target.value || null)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <input
                  className="field-input"
                  type="date"
                  value={form.due_date ?? ""}
                  onChange={(e) => setField("due_date", e.target.value || null)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label>Total Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">$</span>
                  <input
                    className="field-input pl-6"
                    type="number"
                    step="0.01"
                    value={form.total_amount ?? ""}
                    onChange={(e) => setField("total_amount", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="field-input"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
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
              <textarea
                className="field-input resize-none"
                rows={2}
                value={form.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value || null)}
                placeholder="Add notes for the finance team…"
                disabled={isReadOnly}
              />
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items</Label>
                {!isReadOnly && (
                  <button
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add row
                  </button>
                )}
              </div>

              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="text-left px-3 py-2.5 text-xs font-bold text-stone-500 uppercase tracking-wider">Description</th>
                      <th className="text-left px-3 py-2.5 text-xs font-bold text-stone-500 uppercase tracking-wider w-16">Qty</th>
                      <th className="text-left px-3 py-2.5 text-xs font-bold text-stone-500 uppercase tracking-wider w-24">Unit ($)</th>
                      <th className="text-left px-3 py-2.5 text-xs font-bold text-stone-500 uppercase tracking-wider w-24">Total</th>
                      {!isReadOnly && <th className="w-8" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(!form.line_items || form.line_items.length === 0) ? (
                      <tr>
                        <td colSpan={isReadOnly ? 4 : 5} className="px-3 py-8 text-center text-xs text-stone-400">
                          No line items — {isReadOnly ? "none were extracted." : 'click "Add row" to add one'}
                        </td>
                      </tr>
                    ) : (
                      form.line_items.map((item, i) => (
                        <tr key={i} className="group hover:bg-stone-50 transition-colors">
                          <td className="px-2 py-2">
                            <input
                              className="w-full bg-transparent text-sm text-stone-800 border-b border-transparent focus:border-stone-400 outline-none py-0.5 transition-colors placeholder:text-stone-300"
                              value={item.description ?? ""}
                              onChange={(e) => setLineItem(i, "description", e.target.value)}
                              placeholder="Description…"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              className="w-full bg-transparent text-sm text-stone-800 border-b border-transparent focus:border-stone-400 outline-none py-0.5 transition-colors"
                              type="number"
                              value={item.quantity ?? ""}
                              onChange={(e) => setLineItem(i, "quantity", parseFloat(e.target.value) || 0)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              className="w-full bg-transparent text-sm text-stone-800 border-b border-transparent focus:border-stone-400 outline-none py-0.5 transition-colors"
                              type="number"
                              step="0.01"
                              value={item.unit_price ?? ""}
                              onChange={(e) => setLineItem(i, "unit_price", parseFloat(e.target.value) || 0)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <span className="text-sm font-semibold text-stone-700 tabnum">
                              {formatCurrency(item.total_price)}
                            </span>
                          </td>
                          {!isReadOnly && (
                            <td className="px-2 py-2">
                              <button
                                onClick={() => removeLineItem(i)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {(form.line_items?.length ?? 0) > 0 && (
                    <tfoot>
                      <tr className="bg-stone-50 border-t border-stone-200">
                        <td colSpan={isReadOnly ? 3 : 3} className="px-3 py-2.5 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">
                          Subtotal
                        </td>
                        <td className="px-2 py-2.5 text-sm font-black text-stone-900 tabnum">
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
