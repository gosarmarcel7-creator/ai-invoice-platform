"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  FileText, Search, RefreshCw, ArrowRight,
  Upload, ChevronLeft, ChevronRight, Trash2, Loader2,
  Download, CheckSquare, Square,
} from "lucide-react";
import { api, type PaginatedInvoices, type Invoice } from "@/lib/api";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import AgPageHeader from "@/components/ag/app/AgPageHeader";
import AgStatusBadge from "@/components/ag/app/AgStatusBadge";
import { AgDataTable } from "@/components/ag/app/AgDataTable";
import AgGlassCard from "@/components/ag/cards/AgGlassCard";

const TABS = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "review", label: "Needs Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

function exportCSV(invoices: Invoice[]) {
  const header = "ID,Filename,Vendor,Invoice #,Amount,Date,Due Date,Status\n";
  const rows = invoices.map((i) =>
    [i.id, i.filename, i.vendor_name ?? "", i.invoice_number ?? "",
     i.total_amount ?? "", i.date ?? "", i.due_date ?? "", i.status].join(",")
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "invoices.csv"; a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported to invoices.csv");
}

export default function ReviewQueuePage() {
  const [data, setData] = useState<PaginatedInvoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: "15" });
      if (tab !== "all") p.set("status", tab);
      if (search.trim()) p.set("search", search.trim());
      const res = await api.get<PaginatedInvoices>(`/api/invoices/?${p}`);
      setData(res.data);
      setSelected(new Set());
    } catch {
      toast.error("Could not load invoices. Is the backend running?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, tab, search]);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, [load]);

  const del = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this invoice?")) return;
    setDeleting(id);
    try {
      await api.delete(`/api/invoices/${id}`);
      toast.success("Deleted");
      load(true);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} invoices?`)) return;
    let failed = 0;
    for (const id of selected) {
      try { await api.delete(`/api/invoices/${id}`); }
      catch { failed++; }
    }
    if (failed) toast.error(`${failed} deletions failed`);
    else toast.success(`${selected.size} invoices deleted`);
    load(true);
  };

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const invoices: Invoice[] = data?.items ?? [];
  const allSelected = invoices.length > 0 && invoices.every((i) => selected.has(i.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(invoices.map((i) => i.id)));
  };

  return (
    <div className="w-full space-y-5">
      <AgPageHeader
        title="Review Queue"
        subtitle="Validate AI-extracted data before approval"
        actions={
          <>
            <button type="button" onClick={() => load(true)} disabled={refreshing} className="ag-btn-secondary">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button type="button" onClick={() => exportCSV(invoices)} disabled={!invoices.length} className="ag-btn-secondary disabled:opacity-40">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <Link href="/upload" className="ag-btn-primary">
              <Upload className="h-3.5 w-3.5" /> Upload
            </Link>
          </>
        }
      />

      <AgGlassCard className="overflow-hidden">
        <div className="flex overflow-x-auto border-b border-[var(--ag-border)] px-4 pt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${
                tab === t.key ? "border-[var(--ag-primary)] text-[var(--ag-on-surface)]" : "border-transparent text-[var(--ag-text-tertiary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-[var(--ag-border)] px-4 py-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ag-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search vendor, filename…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="ag-field-input pl-8 text-sm"
            />
          </div>
          {selected.size > 0 && (
            <button type="button" onClick={bulkDelete} className="ag-btn-secondary border-rose-500/30 text-rose-300">
              <Trash2 className="h-3.5 w-3.5" /> Delete {selected.size}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="ag-skeleton h-4 w-full" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto mb-3 h-9 w-9 text-[var(--ag-text-disabled)]" />
            <p className="text-sm font-semibold text-[var(--ag-text-secondary)]">
              {search ? "No results found" : "Queue is empty"}
            </p>
            {!search && (
              <Link href="/upload" className="ag-btn-primary mt-5 inline-flex">
                <Upload className="h-3.5 w-3.5" /> Upload Invoices
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <AgDataTable>
              <thead>
                <tr>
                  <th className="w-10">
                    <button type="button" onClick={toggleAll}>
                      {allSelected ? <CheckSquare className="h-4 w-4 text-[var(--ag-accent)]" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th>Document</th>
                  <th className="hidden sm:table-cell">Vendor</th>
                  <th className="hidden md:table-cell">Invoice #</th>
                  <th className="hidden text-right lg:table-cell">Amount</th>
                  <th className="hidden xl:table-cell">Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {invoices.map((inv) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={selected.has(inv.id) ? "bg-[var(--ag-primary)]/10" : ""}
                    >
                      <td>
                        <button type="button" onClick={() => toggleSelect(inv.id)}>
                          {selected.has(inv.id) ? <CheckSquare className="h-4 w-4 text-[var(--ag-accent)]" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td>
                        <p className="max-w-[160px] truncate text-sm font-medium text-[var(--ag-on-surface)]">{inv.filename}</p>
                        <p className="text-xs text-[var(--ag-text-tertiary)]">{timeAgo(inv.uploaded_at)}</p>
                      </td>
                      <td className="hidden text-sm sm:table-cell">{inv.vendor_name || "—"}</td>
                      <td className="hidden font-mono text-xs md:table-cell">{inv.invoice_number || "—"}</td>
                      <td className="tabnum hidden text-right text-sm font-semibold lg:table-cell">{formatCurrency(inv.total_amount)}</td>
                      <td className="hidden text-sm text-[var(--ag-text-tertiary)] xl:table-cell">{formatDate(inv.date)}</td>
                      <td><AgStatusBadge status={inv.status} /></td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status === "review" && (
                            <Link href={`/review/${inv.id}`} className="ag-btn-secondary px-3 py-1.5 text-xs text-amber-300 border-amber-500/30">
                              Review <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                          {(inv.status === "approved" || inv.status === "rejected") && (
                            <Link href={`/review/${inv.id}`} className="ag-btn-secondary px-3 py-1.5 text-xs">View</Link>
                          )}
                          <button type="button" onClick={(e) => del(inv.id, e)} disabled={deleting === inv.id} className="p-1.5 text-[var(--ag-text-tertiary)] hover:text-rose-400">
                            {deleting === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </AgDataTable>
          </div>
        )}

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--ag-border)] px-5 py-3.5">
            <p className="text-xs text-[var(--ag-text-tertiary)]">
              {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} of {data.total}
            </p>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="ag-btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 text-sm font-semibold">{page} / {data.pages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="ag-btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </AgGlassCard>
    </div>
  );
}
