"use client";

import { motion } from "framer-motion";
import { Download, FileText, Inbox, Search } from "lucide-react";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { StatusPill, ConfidenceMeter } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, relativeTime } from "@/lib/utils";

const filters: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "review", label: "Needs review" },
  { key: "approved", label: "Approved" },
  { key: "failed", label: "Failed" },
  { key: "rejected", label: "Rejected" },
];

export function InvoiceTable({
  invoices,
  loading,
  status,
  onStatusChange,
  search,
  onSearchChange,
  onSelect,
  selectedId,
  selectedIds,
  onToggleChecked,
  onToggleAll,
  onBulkAction,
  busyBulk,
  exporting,
  onExport,
}: {
  invoices: Invoice[];
  loading: boolean;
  status: string;
  onStatusChange: (s: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  onSelect: (inv: Invoice) => void;
  selectedId?: number | null;
  selectedIds: number[];
  onToggleChecked: (invoiceId: number) => void;
  onToggleAll: () => void;
  onBulkAction: (status: InvoiceStatus) => void;
  busyBulk: InvoiceStatus | null;
  exporting: boolean;
  onExport: () => void;
}) {
  const allVisibleSelected =
    invoices.length > 0 && invoices.every((invoice) => selectedIds.includes(invoice.id));

  return (
    <div className="glass grain overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-line p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-ink">Invoice queue</h3>
            <p className="mt-0.5 text-xs text-ink-mute">
              Review, retry, bulk-update, and export your documents.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search vendor, number, file..."
                className="focus-ring h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/40 sm:w-64"
              />
            </div>
            <Button variant="secondary" size="sm" loading={exporting} onClick={onExport}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2">
            <span className="text-xs font-medium text-ink-soft">
              {selectedIds.length} selected
            </span>
            <Button
              size="sm"
              variant="secondary"
              loading={busyBulk === "review"}
              onClick={() => onBulkAction("review")}
            >
              Mark review
            </Button>
            <Button
              size="sm"
              loading={busyBulk === "approved"}
              className="bg-approved text-white hover:bg-approved/85"
              onClick={() => onBulkAction("approved")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={busyBulk === "rejected"}
              onClick={() => onBulkAction("rejected")}
            >
              Reject
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2.5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onStatusChange(f.key)}
            className={cn(
              "focus-ring rounded-full px-3 py-1 text-[0.78rem] font-medium transition-colors",
              status === f.key
                ? "bg-brand/20 text-brand-bright"
                : "text-ink-mute hover:bg-black/[0.04] hover:text-ink"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[0.7rem] uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-2.5 font-medium">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleAll}
                  aria-label="Select all visible invoices"
                />
              </th>
              <th className="px-4 py-2.5 font-medium">Vendor</th>
              <th className="px-4 py-2.5 font-medium">Invoice #</th>
              <th className="px-4 py-2.5 font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium">Confidence</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Added</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-line">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-black/[0.06]" />
                      </td>
                    ))}
                  </tr>
                ))
              : invoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.4 }}
                    onClick={() => onSelect(inv)}
                    className={cn(
                      "group cursor-pointer border-t border-line transition-colors hover:bg-black/[0.025]",
                      selectedId === inv.id && "bg-brand/8"
                    )}
                  >
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => onToggleChecked(inv.id)}
                        aria-label={`Select invoice ${inv.filename}`}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-mute">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink">
                            {inv.vendor_name ?? "Unknown vendor"}
                          </div>
                          <div className="truncate font-mono text-[0.68rem] text-ink-faint">
                            {inv.filename}
                          </div>
                          {inv.needs_attention && (
                            <div className="mt-1 inline-flex rounded-full bg-review/12 px-2 py-0.5 text-[0.68rem] font-medium text-review">
                              Attention needed
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[0.8rem] text-ink-soft">
                      {inv.invoice_number ?? "-"}
                    </td>
                    <td className="tnum px-4 py-3.5 font-mono font-medium text-ink">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <ConfidenceMeter score={inv.confidence_score} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={inv.status as InvoiceStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-[0.8rem] text-ink-mute">
                      {relativeTime(inv.uploaded_at)}
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>

        {!loading && invoices.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-ink-mute">
              <Inbox className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-medium text-ink">No invoices found</p>
            <p className="mt-1 text-xs text-ink-mute">
              Try a different filter, or upload your first document.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
