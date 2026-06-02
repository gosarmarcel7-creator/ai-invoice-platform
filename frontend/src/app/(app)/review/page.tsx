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
import { formatCurrency, formatDate, statusConfig, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const TABS = [
  { key: "all",        label: "All" },
  { key: "processing", label: "Processing" },
  { key: "review",     label: "Needs Review" },
  { key: "approved",   label: "Approved" },
  { key: "rejected",   label: "Rejected" },
] as const;

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

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
    if (!silent) setLoading(true); else setRefreshing(true);
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
      setLoading(false); setRefreshing(false);
    }
  }, [page, tab, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, tab]);

  const del = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Delete this invoice?")) return;
    setDeleting(id);
    try {
      await api.delete(`/api/invoices/${id}`);
      toast.success("Deleted");
      load(true);
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(null); }
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
      n.has(id) ? n.delete(id) : n.add(id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">Review Queue</h1>
          <p className="mt-0.5 text-sm text-[var(--text-3)]">Validate AI-extracted data before approval</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(true)} disabled={refreshing} className="btn btn-secondary">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={() => exportCSV(invoices)} disabled={!invoices.length} className="btn btn-secondary disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <Link href="/upload" className="btn btn-primary">
            <Upload className="h-3.5 w-3.5" /> Upload
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-0 overflow-x-auto border-b border-[var(--border)] px-4 pt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`-mb-px whitespace-nowrap rounded-t-md border-b-2 px-4 py-2 text-sm font-semibold transition-all ${
                tab === t.key
                  ? "border-[var(--accent)] text-white"
                  : "border-transparent text-[var(--text-3)] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              type="text"
              placeholder="Search vendor, filename, invoice #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input pl-8 text-sm"
            />
          </div>
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete {selected.size}
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto mb-3 h-9 w-9 text-[var(--text-4)]" />
            <p className="text-sm font-semibold text-[var(--text-2)]">
              {search ? "No results found" : "Queue is empty"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-3)]">
              {search ? "Try a different search term." : "Upload invoices to begin processing."}
            </p>
            {!search && (
              <Link href="/upload" className="btn btn-primary mt-5 inline-flex">
                <Upload className="h-3.5 w-3.5" /> Upload Invoices
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="w-10">
                    <button onClick={toggleAll} className="text-[var(--text-3)] transition-colors hover:text-white">
                      {allSelected
                        ? <CheckSquare className="h-4 w-4 text-[var(--violet)]" />
                        : <Square className="h-4 w-4" />}
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
                  {invoices.map((inv, i) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={selected.has(inv.id) ? "bg-[var(--accent)]/10" : ""}
                    >
                      <td>
                        <button onClick={() => toggleSelect(inv.id)} className="text-[var(--text-4)] transition-colors hover:text-white">
                          {selected.has(inv.id)
                            ? <CheckSquare className="h-4 w-4 text-[var(--violet)]" />
                            : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-white/5">
                            <FileText className="h-3.5 w-3.5 text-[var(--text-2)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[160px] truncate text-sm font-medium text-white">{inv.filename}</p>
                            <p className="text-xs text-[var(--text-3)]">{timeAgo(inv.uploaded_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden text-sm text-[var(--text-2)] sm:table-cell">{inv.vendor_name || "—"}</td>
                      <td className="hidden font-mono text-xs text-[var(--text-3)] md:table-cell">{inv.invoice_number || "—"}</td>
                      <td className="tabnum hidden text-right text-sm font-semibold text-white lg:table-cell">{formatCurrency(inv.total_amount)}</td>
                      <td className="hidden text-sm text-[var(--text-3)] xl:table-cell">{formatDate(inv.date)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status === "review" && (
                            <Link
                              href={`/review/${inv.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20"
                            >
                              Review <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                          {(inv.status === "approved" || inv.status === "rejected") && (
                            <Link
                              href={`/review/${inv.id}`}
                              className="btn btn-secondary px-3 py-1.5 text-xs"
                            >
                              View
                            </Link>
                          )}
                          <button
                            onClick={(e) => del(inv.id, e)}
                            disabled={deleting === inv.id}
                            className="rounded-md p-1.5 text-[var(--text-4)] transition-all hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                          >
                            {deleting === inv.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3.5">
            <p className="text-xs text-[var(--text-3)]">
              {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 text-sm font-semibold text-[var(--text-2)]">{page} / {data.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="btn btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
