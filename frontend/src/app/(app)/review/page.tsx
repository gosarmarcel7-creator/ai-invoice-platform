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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text} border ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
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
          <h1 className="text-xl font-black text-stone-900">Review Queue</h1>
          <p className="text-sm text-stone-400 mt-0.5">Validate AI-extracted data before approval</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => exportCSV(invoices)}
            disabled={!invoices.length}
            className="btn btn-secondary text-sm disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <Link href="/upload" className="btn btn-primary text-sm">
            <Upload className="w-3.5 h-3.5" /> Upload
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-0 px-4 pt-3 border-b border-stone-100 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`px-4 py-2 text-sm font-semibold rounded-t-md whitespace-nowrap border-b-2 -mb-px transition-all ${
                tab === t.key
                  ? "text-stone-900 border-stone-900"
                  : "text-stone-400 border-transparent hover:text-stone-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-100">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete {selected.size}
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-9 h-9 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-semibold text-sm">
              {search ? "No results found" : "Queue is empty"}
            </p>
            <p className="text-stone-400 text-xs mt-1">
              {search ? "Try a different search term." : "Upload invoices to begin processing."}
            </p>
            {!search && (
              <Link href="/upload" className="btn btn-primary text-sm mt-5 inline-flex">
                <Upload className="w-3.5 h-3.5" /> Upload Invoices
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="w-10">
                    <button onClick={toggleAll} className="text-stone-400 hover:text-stone-700">
                      {allSelected
                        ? <CheckSquare className="w-4 h-4 text-stone-900" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th>Document</th>
                  <th className="hidden sm:table-cell">Vendor</th>
                  <th className="hidden md:table-cell">Invoice #</th>
                  <th className="hidden lg:table-cell text-right">Amount</th>
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
                      className={selected.has(inv.id) ? "bg-stone-50" : ""}
                    >
                      <td>
                        <button onClick={() => toggleSelect(inv.id)} className="text-stone-300 hover:text-stone-700">
                          {selected.has(inv.id)
                            ? <CheckSquare className="w-4 h-4 text-stone-900" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-stone-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-stone-800 font-medium truncate max-w-[160px] text-sm">{inv.filename}</p>
                            <p className="text-xs text-stone-400">{timeAgo(inv.uploaded_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell text-stone-600 text-sm">{inv.vendor_name || "—"}</td>
                      <td className="hidden md:table-cell font-mono text-xs text-stone-500">{inv.invoice_number || "—"}</td>
                      <td className="hidden lg:table-cell text-right font-semibold tabnum text-stone-800 text-sm">{formatCurrency(inv.total_amount)}</td>
                      <td className="hidden xl:table-cell text-stone-500 text-sm">{formatDate(inv.date)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status === "review" && (
                            <Link
                              href={`/review/${inv.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                            >
                              Review <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                          {(inv.status === "approved" || inv.status === "rejected") && (
                            <Link
                              href={`/review/${inv.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold btn-secondary border transition-colors"
                            >
                              View
                            </Link>
                          )}
                          <button
                            onClick={(e) => del(inv.id, e)}
                            disabled={deleting === inv.id}
                            className="p-1.5 rounded-md text-stone-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            {deleting === inv.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
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
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-stone-100">
            <p className="text-xs text-stone-400">
              {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm text-stone-600 font-semibold px-2">{page} / {data.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="btn btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
