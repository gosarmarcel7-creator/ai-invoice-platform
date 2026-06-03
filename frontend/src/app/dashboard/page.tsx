"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clock4,
  DollarSign,
  FileText,
  Gauge,
  OctagonX,
  ChevronRight,
  Database,
  Mail,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Shell } from "@/components/dashboard/shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { VolumeChart, ValueChart } from "@/components/dashboard/charts";
import { StatusBreakdown } from "@/components/dashboard/status-breakdown";
import { UploadZone } from "@/components/dashboard/upload-zone";
import { InvoiceTable } from "@/components/dashboard/invoice-table";
import { InvoiceDrawer } from "@/components/dashboard/invoice-drawer";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { LogoMark } from "@/components/ui/logo";
import { api } from "@/lib/api";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import type {
  Analytics,
  Invoice,
  InvoiceAuditEntry,
  InvoiceStatus,
  TimeSeries,
} from "@/lib/types";
import { formatCurrency, relativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [active, setActive] = useState("overview");

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [series, setSeries] = useState<TimeSeries | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [history, setHistory] = useState<InvoiceAuditEntry[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [busyUpload, setBusyUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [bulkBusy, setBulkBusy] = useState<InvoiceStatus | null>(null);
  const [exporting, setExporting] = useState(false);

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshAnalytics = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([api.analytics(), api.timeseries()]);
      setAnalytics(a);
      setSeries(s);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load analytics");
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoadingTable(true);
    try {
      const res = await api.listInvoices({ status, search, limit: 50 });
      setInvoices(res.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load invoices");
      setInvoices([]);
    } finally {
      setLoadingTable(false);
    }
  }, [search, status]);

  // Auth gate + initial data load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        if (!cancelled) setAuthed(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        setAuthed(false);
        router.replace("/login");
        return;
      }
      setEmail(data.user.email ?? null);
      setAuthed(true);
      await refreshAnalytics();
    })();
    return () => {
      cancelled = true;
    };
  }, [router, refreshAnalytics]);

  useEffect(() => {
    if (!authed) return;
    const timeout = setTimeout(loadInvoices, search ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [authed, loadInvoices, search]);

  // Audit history when a drawer opens
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const invoiceId = selected.id;
    (async () => {
      setLoadingHistory(true);
      try {
        const items = await api.invoiceHistory(invoiceId);
        if (!cancelled) setHistory(items);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Poll while any invoice is still processing
  useEffect(() => {
    if (!authed) return;
    if (!invoices.some((invoice) => invoice.status === "processing")) return;
    const interval = window.setInterval(() => {
      void loadInvoices();
      void refreshAnalytics();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [authed, invoices, loadInvoices, refreshAnalytics]);

  const allVisibleIds = useMemo(() => invoices.map((invoice) => invoice.id), [invoices]);
  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);

  async function handleUpload(files: FileList) {
    setBusyUpload(true);
    const names = Array.from(files).map((file) => file.name);
    try {
      for (const file of Array.from(files)) {
        await api.uploadInvoice(file);
      }
      toast.success(`${names.length} file${names.length > 1 ? "s" : ""} uploaded`, {
        description: "AI extraction is running…",
      });
      await Promise.all([loadInvoices(), refreshAnalytics()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusyUpload(false);
    }
  }

  async function handleSave(patch: Partial<Invoice>) {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await api.updateInvoice(selected.id, patch);
      setInvoices((prev) => prev.map((invoice) => (invoice.id === updated.id ? updated : invoice)));
      setSelected(updated);
      toast.success("Changes saved");
      await refreshAnalytics();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(next: InvoiceStatus) {
    if (!selected) return;
    try {
      const updated = await api.updateInvoice(selected.id, { status: next });
      setInvoices((prev) => prev.map((invoice) => (invoice.id === updated.id ? updated : invoice)));
      setSelected(updated);
      toast.success(next === "approved" ? "Invoice approved" : "Invoice rejected");
      await refreshAnalytics();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed");
    }
  }

  async function handleRetry() {
    if (!selected) return;
    setRetrying(true);
    try {
      await api.retryInvoice(selected.id);
      const refreshed = await api.getInvoice(selected.id);
      setInvoices((prev) => prev.map((invoice) => (invoice.id === refreshed.id ? refreshed : invoice)));
      setSelected(refreshed);
      toast.success("Re-extraction queued");
      await refreshAnalytics();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    const currentId = selected.id;
    try {
      await api.deleteInvoice(currentId);
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== currentId));
      setSelected(null);
      setSelectedIds((prev) => prev.filter((id) => id !== currentId));
      toast.success("Invoice deleted");
      await refreshAnalytics();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  async function handleBulkAction(next: InvoiceStatus) {
    if (selectedIds.length === 0) return;
    setBulkBusy(next);
    try {
      const result = await api.bulkUpdateInvoices(selectedIds, next);
      setInvoices((prev) =>
        prev.map((invoice) => result.updated.find((updated) => updated.id === invoice.id) ?? invoice)
      );
      if (selected && selectedIds.includes(selected.id)) {
        setSelected((prev) => (prev ? { ...prev, status: next } : prev));
      }
      toast.success(`Updated ${result.count} invoice${result.count > 1 ? "s" : ""}`);
      setSelectedIds([]);
      await refreshAnalytics();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk update failed");
    } finally {
      setBulkBusy(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await api.exportInvoices({ status, search });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("CSV export ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function toggleChecked(invoiceId: number) {
    setSelectedIds((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]
    );
  }

  function toggleAllVisible() {
    const everyVisibleSelected =
      allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));
    if (everyVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
  }

  async function signOut() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (authed === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base">
        <div className="flex flex-col items-center gap-4">
          <LogoMark className="h-10 w-10 animate-pulse" />
          <p className="text-sm text-ink-mute">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (authed === false) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-6">
        <div className="glass max-w-md rounded-2xl p-8 text-center">
          <LogoMark className="mx-auto h-10 w-10" />
          <h1 className="font-display mt-5 text-xl font-semibold tracking-tight text-ink">
            Connect Supabase to continue
          </h1>
          <p className="mt-2 text-sm text-ink-mute">
            This workspace runs on live data only. Add your Supabase and Mistral keys to{" "}
            <code className="font-mono text-ink">.env.local</code>, then sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Shell
        email={email}
        active={active}
        onNavigate={setActive}
        onSignOut={signOut}
        onUploadClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleUpload(e.target.files);
            e.target.value = "";
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {active === "overview" && (
              <OverviewTab
                analytics={analytics}
                invoices={recentInvoices}
                loading={loadingTable}
                busyUpload={busyUpload}
                onUpload={handleUpload}
                onSelect={setSelected}
                onSeeAll={() => setActive("invoices")}
              />
            )}

            {active === "invoices" && (
              <InvoiceTable
                invoices={invoices}
                loading={loadingTable}
                status={status}
                onStatusChange={setStatus}
                search={search}
                onSearchChange={setSearch}
                onSelect={setSelected}
                selectedId={selected?.id}
                selectedIds={selectedIds}
                onToggleChecked={toggleChecked}
                onToggleAll={toggleAllVisible}
                onBulkAction={handleBulkAction}
                busyBulk={bulkBusy}
                exporting={exporting}
                onExport={handleExport}
              />
            )}

            {active === "analytics" && <AnalyticsTab analytics={analytics} series={series} />}

            {active === "settings" && (
              <SettingsTab email={email} onSignOut={signOut} />
            )}
          </motion.div>
        </AnimatePresence>
      </Shell>

      <InvoiceDrawer
        invoice={selected}
        history={history}
        loadingHistory={loadingHistory}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        onStatus={handleStatus}
        onDelete={handleDelete}
        onRetry={handleRetry}
        retrying={retrying}
        saving={saving}
      />
    </>
  );
}

function OverviewTab({
  analytics,
  invoices,
  loading,
  busyUpload,
  onUpload,
  onSelect,
  onSeeAll,
}: {
  analytics: Analytics | null;
  invoices: Invoice[];
  loading: boolean;
  busyUpload: boolean;
  onUpload: (files: FileList) => void;
  onSelect: (invoice: Invoice) => void;
  onSeeAll: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={FileText}
          label="Total documents"
          value={analytics?.total_documents ?? 0}
          accent="var(--color-brand)"
        />
        <StatCard
          icon={DollarSign}
          label="Total value processed"
          value={analytics?.total_value ?? 0}
          format={(value) => formatCurrency(value)}
          accent="var(--color-approved)"
        />
        <StatCard
          icon={Clock4}
          label="Awaiting review"
          value={analytics?.awaiting_review ?? 0}
          accent="var(--color-review)"
        />
        <StatCard
          icon={OctagonX}
          label="Failed extractions"
          value={analytics?.failed ?? 0}
          accent="var(--color-rejected)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Attention flagged"
          value={analytics?.attention ?? 0}
          accent="var(--color-cyan)"
        />
        <StatCard
          icon={Gauge}
          label="Avg. confidence"
          value={analytics?.avg_confidence ?? 0}
          format={(value) => value.toFixed(1)}
          suffix="%"
          accent="var(--color-cyan)"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity
            invoices={invoices}
            loading={loading}
            onSelect={onSelect}
            onSeeAll={onSeeAll}
          />
        </div>
        <Reveal>
          <UploadZone onUpload={onUpload} busy={busyUpload} />
        </Reveal>
      </div>
    </div>
  );
}

function RecentActivity({
  invoices,
  loading,
  onSelect,
  onSeeAll,
}: {
  invoices: Invoice[];
  loading: boolean;
  onSelect: (invoice: Invoice) => void;
  onSeeAll: () => void;
}) {
  return (
    <div className="glass grain overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-line p-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">Recent activity</h3>
          <p className="mt-0.5 text-xs text-ink-mute">Your most recently uploaded documents.</p>
        </div>
        <button
          onClick={onSeeAll}
          className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-mute transition-colors hover:text-ink"
        >
          See all <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="divide-y divide-line">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-black/[0.06]" />
              <div className="h-3.5 w-40 animate-pulse rounded bg-black/[0.06]" />
              <div className="ml-auto h-3.5 w-20 animate-pulse rounded bg-black/[0.06]" />
            </div>
          ))
        ) : invoices.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-ink-mute">
            No documents yet — upload your first invoice to get started.
          </div>
        ) : (
          invoices.map((invoice) => (
            <button
              key={invoice.id}
              onClick={() => onSelect(invoice)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.025]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-mute">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">
                  {invoice.vendor_name ?? "Unknown vendor"}
                </div>
                <div className="truncate font-mono text-[0.68rem] text-ink-faint">
                  {invoice.filename} · {relativeTime(invoice.uploaded_at)}
                </div>
              </div>
              <span className="tnum hidden font-mono text-sm font-medium text-ink sm:block">
                {formatCurrency(invoice.total_amount)}
              </span>
              <StatusPill status={invoice.status as InvoiceStatus} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function AnalyticsTab({
  analytics,
  series,
}: {
  analytics: Analytics | null;
  series: TimeSeries | null;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">{series && <VolumeChart data={series.weekly} />}</div>
        {analytics && <StatusBreakdown analytics={analytics} />}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-3">{series && <ValueChart data={series.monthly} />}</div>
      </div>
    </div>
  );
}

function SettingsTab({
  email,
  onSignOut,
}: {
  email: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
          <Mail className="h-4 w-4 text-ink-mute" /> Account
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
          <div>
            <div className="text-xs text-ink-mute">Signed in as</div>
            <div className="text-sm font-medium text-ink">{email ?? "—"}</div>
          </div>
          <Button variant="secondary" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
          <Database className="h-4 w-4 text-ink-mute" /> Connections
        </div>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-approved" />
              <span className="text-sm text-ink">Supabase database & auth</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-approved/12 px-2.5 py-1 text-[0.7rem] font-medium text-approved">
              <span className="h-1.5 w-1.5 rounded-full bg-approved" /> Connected
            </span>
          </li>
          <li className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Gauge className="h-4 w-4 text-ink-mute" />
              <span className="text-sm text-ink">Mistral AI extraction</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[0.7rem] font-medium text-ink-mute">
              Server-side
            </span>
          </li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-ink-mute">
          This workspace runs on live data only. Keys are configured server-side via{" "}
          <code className="font-mono text-ink-soft">.env.local</code>.
        </p>
      </div>
    </div>
  );
}
