"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  Check,
  FileText,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { Invoice, InvoiceAuditEntry, InvoiceStatus, LineItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatusPill, ConfidenceMeter } from "@/components/ui/status-pill";
import { cn, formatCurrency, relativeTime } from "@/lib/utils";

function EditField({
  label,
  value,
  onChange,
  type = "text",
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.7rem] font-medium uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "focus-ring h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors focus:border-brand/40 focus:bg-surface",
          mono && "font-mono tnum"
        )}
      />
    </label>
  );
}

function DrawerBody({
  invoice,
  history,
  loadingHistory,
  onSave,
  onStatus,
  onDelete,
  onRetry,
  retrying,
  saving,
}: {
  invoice: Invoice;
  history: InvoiceAuditEntry[];
  loadingHistory: boolean;
  onSave: (patch: Partial<Invoice>) => void;
  onStatus: (status: InvoiceStatus) => void;
  onDelete: () => void;
  onRetry: () => void;
  retrying?: boolean;
  saving?: boolean;
}) {
  const [form, setForm] = useState<Partial<Invoice>>({
    vendor_name: invoice.vendor_name,
    invoice_number: invoice.invoice_number,
    total_amount: invoice.total_amount,
    date: invoice.date,
    due_date: invoice.due_date,
  });
  const [items, setItems] = useState<LineItem[]>(invoice.line_items ?? []);

  const set = (k: keyof Invoice, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const itemsTotal = items.reduce((s, it) => s + (Number(it.total_price) || 0), 0);

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((arr) =>
      arr.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, ...patch };
        if (patch.quantity != null || patch.unit_price != null) {
          const q = Number(next.quantity) || 0;
          const u = Number(next.unit_price) || 0;
          next.total_price = Math.round(q * u * 100) / 100;
        }
        return next;
      })
    );
  }

  return (
    <>
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {invoice.status === "failed" && (
          <div className="rounded-2xl border border-rejected/25 bg-rejected/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-rejected" />
              <div>
                <div className="text-sm font-semibold text-ink">Extraction failed</div>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {invoice.last_error ?? "The last extraction attempt did not complete."}
                </p>
                <div className="mt-3">
                  <Button size="sm" variant="danger" loading={retrying} onClick={onRetry}>
                    <RotateCcw className="h-4 w-4" />
                    Retry extraction
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {invoice.needs_attention && (
          <div className="rounded-2xl border border-review/25 bg-review/10 p-4">
            <div className="text-sm font-semibold text-ink">Attention flags</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(invoice.attention_reasons ?? []).map((reason) => (
                <span
                  key={reason}
                  className="rounded-full border border-review/30 bg-white/70 px-2.5 py-1 text-[0.68rem] font-medium text-review"
                >
                  {reason.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <EditField
              label="Vendor"
              value={form.vendor_name ?? ""}
              onChange={(v) => set("vendor_name", v)}
            />
          </div>
          <EditField
            label="Invoice number"
            value={form.invoice_number ?? ""}
            onChange={(v) => set("invoice_number", v)}
            mono
          />
          <EditField
            label="Total amount"
            value={form.total_amount?.toString() ?? ""}
            onChange={(v) => set("total_amount", v === "" ? null : Number(v))}
            type="number"
            mono
          />
          <EditField
            label="Invoice date"
            value={form.date ?? ""}
            onChange={(v) => set("date", v)}
            type="date"
            mono
          />
          <EditField
            label="Due date"
            value={form.due_date ?? ""}
            onChange={(v) => set("due_date", v)}
            type="date"
            mono
          />
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Line items</h3>
            <button
              onClick={() =>
                setItems((a) => [
                  ...a,
                  { description: "", quantity: 1, unit_price: 0, total_price: 0 },
                ])
              }
              className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-bright hover:bg-brand/10"
            >
              <Plus className="h-3.5 w-3.5" /> Add row
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-line">
            <div className="grid grid-cols-[1fr_3rem_4.5rem_5rem_1.6rem] gap-2 border-b border-line bg-surface-2 px-3 py-2 text-[0.64rem] uppercase tracking-wider text-ink-faint">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit</span>
              <span className="text-right">Total</span>
              <span />
            </div>
            {items.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-ink-mute">
                No line items extracted.
              </div>
            )}
            {items.map((it, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_3rem_4.5rem_5rem_1.6rem] items-center gap-2 border-b border-line px-3 py-2 last:border-0"
              >
                <input
                  value={it.description ?? ""}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                  placeholder="Item description"
                  className="focus-ring h-8 rounded-md border border-transparent bg-transparent px-1.5 text-[0.8rem] text-ink placeholder:text-ink-faint hover:border-line focus:border-brand/40 focus:bg-surface-2"
                />
                <input
                  type="number"
                  value={it.quantity ?? ""}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  className="focus-ring tnum h-8 rounded-md border border-transparent bg-transparent px-1 text-right font-mono text-[0.8rem] text-ink-soft hover:border-line focus:border-brand/40 focus:bg-surface-2"
                />
                <input
                  type="number"
                  value={it.unit_price ?? ""}
                  onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
                  className="focus-ring tnum h-8 rounded-md border border-transparent bg-transparent px-1 text-right font-mono text-[0.8rem] text-ink-soft hover:border-line focus:border-brand/40 focus:bg-surface-2"
                />
                <span className="tnum text-right font-mono text-[0.8rem] font-medium text-ink">
                  {formatCurrency(Number(it.total_price) || 0)}
                </span>
                <button
                  onClick={() => setItems((a) => a.filter((_, idx) => idx !== i))}
                  className="focus-ring rounded-md p-1 text-ink-faint hover:bg-rejected/15 hover:text-rejected"
                  aria-label="Remove line item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {items.length > 0 && (
              <div className="flex items-center justify-between bg-surface-2 px-3 py-2 text-sm">
                <span className="text-ink-mute">Line items total</span>
                <span className="tnum font-mono font-semibold text-ink">
                  {formatCurrency(itemsTotal)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface/40 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Activity</h3>
            {invoice.reviewed_at && (
              <span className="text-[0.72rem] text-ink-mute">
                Reviewed {relativeTime(invoice.reviewed_at)}
              </span>
            )}
          </div>
          {loadingHistory ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-xl bg-black/[0.05]" />
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="mt-3 space-y-2">
              {history.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-line bg-base/70 px-3 py-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium capitalize text-ink">
                      {entry.action.replaceAll("_", " ")}
                    </span>
                    <span className="text-[0.72rem] text-ink-mute">
                      {relativeTime(entry.created_at)}
                    </span>
                  </div>
                  {(entry.from_status || entry.to_status) && (
                    <p className="mt-1 text-[0.72rem] text-ink-soft">
                      {entry.from_status ?? "none"} to {entry.to_status ?? "none"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-ink-mute">No audit events yet.</p>
          )}
        </div>
      </div>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            loading={saving}
            onClick={() => onSave({ ...form, line_items: items })}
          >
            <Save className="h-4 w-4" /> Save changes
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete} aria-label="Delete invoice">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="bg-approved text-white shadow-[0_10px_30px_-12px_rgba(16,185,129,0.8)] hover:bg-approved/85"
            onClick={() => onStatus("approved")}
          >
            <Check className="h-4 w-4" /> Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-rejected/40 text-rejected hover:bg-rejected/10"
            onClick={() => onStatus("rejected")}
          >
            <Ban className="h-4 w-4" /> Reject
          </Button>
        </div>
      </div>
    </>
  );
}

export function InvoiceDrawer({
  invoice,
  history,
  loadingHistory,
  onClose,
  onSave,
  onStatus,
  onDelete,
  onRetry,
  retrying,
  saving,
}: {
  invoice: Invoice | null;
  history: InvoiceAuditEntry[];
  loadingHistory: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Invoice>) => void;
  onStatus: (status: InvoiceStatus) => void;
  onDelete: () => void;
  onRetry: () => void;
  retrying?: boolean;
  saving?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (invoice) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [invoice, onClose]);

  return (
    <AnimatePresence>
      {invoice && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line bg-base-2 shadow-2xl"
            role="dialog"
            aria-label="Invoice review"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-brand-bright">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-ink">
                    {invoice.vendor_name ?? "Unknown vendor"}
                  </h2>
                  <p className="truncate font-mono text-xs text-ink-faint">{invoice.filename}</p>
                  {invoice.user_email && (
                    <p className="mt-1 truncate text-xs text-ink-soft">
                      Owner: {invoice.user_email}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <StatusPill status={invoice.status as InvoiceStatus} />
                    <ConfidenceMeter score={invoice.confidence_score} />
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="focus-ring rounded-lg p-2 text-ink-mute hover:bg-black/[0.04] hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <DrawerBody
              key={invoice.id}
              invoice={invoice}
              history={history}
              loadingHistory={loadingHistory}
              onSave={onSave}
              onStatus={onStatus}
              onDelete={onDelete}
              onRetry={onRetry}
              retrying={retrying}
              saving={saving}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
