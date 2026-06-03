"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Clock4, DollarSign, FileText, Gauge, OctagonX } from "lucide-react";
import { Shell } from "@/components/dashboard/shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { VolumeChart, ValueChart } from "@/components/dashboard/charts";
import { StatusBreakdown } from "@/components/dashboard/status-breakdown";
import { UploadZone } from "@/components/dashboard/upload-zone";
import { InvoiceTable } from "@/components/dashboard/invoice-table";
import { InvoiceDrawer } from "@/components/dashboard/invoice-drawer";
import { Reveal } from "@/components/ui/reveal";
import { api } from "@/lib/api";
import { DEMO_ANALYTICS, DEMO_TIMESERIES, demoHistory, demoList, DEMO_INVOICES } from "@/lib/demo";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import type {
  Analytics,
  Invoice,
  InvoiceAuditEntry,
  InvoiceStatus,
  TimeSeries,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [demo, setDemo] = useState(false);
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
  const overviewRef = useRef<HTMLDivElement>(null);
  const invoicesRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const refreshAnalytics = useCallback(async () => {
    try {
      if (!isSupabaseConfigured) throw new Error("not-configured");
      const [a, s] = await Promise.all([api.analytics(), api.timeseries()]);
      setDemo(false);
      setAnalytics(a);
      setSeries(s);
    } catch {
      setDemo(true);
      setAnalytics(DEMO_ANALYTICS);
      setSeries(DEMO_TIMESERIES);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    setLoadingTable(true);
    try {
      if (!isSupabaseConfigured) throw new Error("not-configured");
      const res = await api.listInvoices({ status, search, limit: 50 });
      setInvoices(res.items);
      setDemo(false);
    } catch {
      setDemo(true);
      setInvoices(demoList(status, search).items);
    } finally {
      setLoadingTable(false);
    }
  }, [search, status]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseBrowser();
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (!cancelled) setEmail(data.user?.email ?? null);
      }
      if (!cancelled) await refreshAnalytics();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAnalytics]);

  useEffect(() => {
    const timeout = setTimeout(loadInvoices, search ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [loadInvoices, search]);

  useEffect(() => {
    if (!selected) return;

    let cancelled = false;
    (async () => {
      try {
        if (!isSupabaseConfigured) throw new Error("not-configured");
        const items = await api.invoiceHistory(selected.id);
        if (!cancelled) setHistory(items);
      } catch {
        if (!cancelled) setHistory(demoHistory(selected.id));
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!invoices.some((invoice) => invoice.status === "processing")) return;

    const interval = window.setInterval(() => {
      void loadInvoices();
      void refreshAnalytics();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [invoices, loadInvoices, refreshAnalytics]);

  const allVisibleIds = useMemo(() => invoices.map((invoice) => invoice.id), [invoices]);

  function navigate(id: string) {
    setActive(id);
    const target =
      id === "invoices" ? invoicesRef : id === "analytics" ? analyticsRef : overviewRef;
    target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleUpload(files: FileList) {
    setBusyUpload(true);
    const names = Array.from(files).map((file) => file.name);
    try {
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        const created: Invoice[] = Array.from(files).map((file, index) => ({
          id: Date.now() + index,
          filename: file.name,
          vendor_name: null,
          invoice_number: null,
          total_amount: null,
          date: null,
          due_date: null,
          confidence_score: null,
          status: "processing",
          uploaded_at: new Date().toISOString(),
          needs_attention: false,
          attention_reasons: [],
          line_items: [],
        }));
        setInvoices((prev) => [...created, ...prev]);
        toast.success(`${names.length} file${names.length > 1 ? "s" : ""} uploaded`, {
          description: "Extraction running (demo)...",
        });
        created.forEach((invoice, index) => {
          const seed = DEMO_INVOICES[index % DEMO_INVOICES.length];
          setTimeout(() => {
            setInvoices((prev) =>
              prev.map((current) =>
                current.id === invoice.id
                  ? {
                      ...current,
                      status: "review",
                      vendor_name: seed.vendor_name,
                      invoice_number:
                        seed.invoice_number ?? `INV-${Math.floor(Math.random() * 90000 + 10000)}`,
                      total_amount: seed.total_amount,
                      confidence_score: seed.confidence_score,
                      date: new Date().toISOString().slice(0, 10),
                      line_items: seed.line_items,
                      needs_attention: seed.needs_attention,
                      attention_reasons: seed.attention_reasons,
                    }
                  : current
              )
            );
          }, 2400 + index * 600);
        });
        return;
      }

      for (const file of Array.from(files)) {
        await api.uploadInvoice(file);
      }
      toast.success(`${names.length} file${names.length > 1 ? "s" : ""} uploaded`, {
        description: "AI extraction is running...",
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
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const updated = { ...selected, ...patch };
        setInvoices((prev) => prev.map((invoice) => (invoice.id === updated.id ? updated : invoice)));
        setSelected(updated);
        toast.success("Changes saved");
        return;
      }

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
      if (!isSupabaseConfigured) {
        const updated = {
          ...selected,
          status: next,
          reviewed_at:
            next === "approved" || next === "rejected" ? new Date().toISOString() : selected.reviewed_at,
        };
        setInvoices((prev) => prev.map((invoice) => (invoice.id === updated.id ? updated : invoice)));
        setSelected(updated);
        toast.success(next === "approved" ? "Invoice approved" : "Invoice rejected");
        return;
      }

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
      if (!isSupabaseConfigured) {
        const updated = {
          ...selected,
          status: "processing" as InvoiceStatus,
          last_error: null,
        };
        setInvoices((prev) => prev.map((invoice) => (invoice.id === updated.id ? updated : invoice)));
        setSelected(updated);
        toast.success("Retry started");
        return;
      }

      await api.retryInvoice(selected.id);
      const refreshed = await api.getInvoice(selected.id);
      setInvoices((prev) => prev.map((invoice) => (invoice.id === refreshed.id ? refreshed : invoice)));
      setSelected(refreshed);
      toast.success("Retry started");
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
      if (isSupabaseConfigured) {
        await api.deleteInvoice(currentId);
      }
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== currentId));
      setSelected(null);
      setHistory([]);
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
      if (!isSupabaseConfigured) {
        setInvoices((prev) =>
          prev.map((invoice) =>
            selectedIds.includes(invoice.id)
              ? {
                  ...invoice,
                  status: next,
                  reviewed_at:
                    next === "approved" || next === "rejected"
                      ? new Date().toISOString()
                      : invoice.reviewed_at,
                }
              : invoice
          )
        );
      } else {
        const result = await api.bulkUpdateInvoices(selectedIds, next);
        setInvoices((prev) =>
          prev.map((invoice) => result.updated.find((updated) => updated.id === invoice.id) ?? invoice)
        );
        await refreshAnalytics();
      }

      if (selected && selectedIds.includes(selected.id)) {
        setSelected((prev) => (prev ? { ...prev, status: next } : prev));
      }
      toast.success(`Updated ${selectedIds.length} invoice${selectedIds.length > 1 ? "s" : ""}`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk update failed");
    } finally {
      setBulkBusy(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const csv = isSupabaseConfigured
        ? await api.exportInvoices({ status, search })
        : buildDemoCsv(status, search);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "invoices-export.csv";
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
    const everyVisibleSelected = allVisibleIds.every((id) => selectedIds.includes(id));
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

  return (
    <>
      <Shell
        email={email}
        demo={demo}
        active={active}
        onNavigate={navigate}
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

        <div ref={overviewRef} className="scroll-mt-20">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              icon={FileText}
              label="Total documents"
              value={analytics?.total_documents ?? 0}
              trend={12}
              accent="var(--color-brand)"
            />
            <StatCard
              icon={DollarSign}
              label="Total value processed"
              value={analytics?.total_value ?? 0}
              format={(value) => formatCurrency(value)}
              trend={8}
              accent="var(--color-approved)"
            />
            <StatCard
              icon={Clock4}
              label="Awaiting review"
              value={analytics?.awaiting_review ?? 0}
              trend={-4}
              accent="var(--color-review)"
            />
            <StatCard
              icon={OctagonX}
              label="Failed extractions"
              value={analytics?.failed ?? 0}
              trend={1}
              accent="var(--color-rejected)"
            />
            <StatCard
              icon={AlertTriangle}
              label="Attention flagged"
              value={analytics?.attention ?? 0}
              trend={3}
              accent="var(--color-cyan)"
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <StatCard
                icon={Gauge}
                label="Avg. confidence"
                value={analytics?.avg_confidence ?? 0}
                format={(value) => value.toFixed(1)}
                suffix="%"
                trend={2}
                accent="var(--color-cyan)"
              />
            </div>
          </div>
        </div>

        <div ref={analyticsRef} className="mt-6 scroll-mt-20">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">{series && <VolumeChart data={series.weekly} />}</div>
            {analytics && <StatusBreakdown analytics={analytics} />}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">{series && <ValueChart data={series.monthly} />}</div>
            <Reveal>
              <UploadZone onUpload={handleUpload} busy={busyUpload} />
            </Reveal>
          </div>
        </div>

        <div ref={invoicesRef} className="mt-6 scroll-mt-20">
          <InvoiceTable
            invoices={invoices}
            loading={loadingTable}
            status={status}
            onStatusChange={setStatus}
            search={search}
            onSearchChange={setSearch}
            onSelect={(invoice) => {
              setLoadingHistory(true);
              setSelected(invoice);
            }}
            selectedId={selected?.id}
            selectedIds={selectedIds}
            onToggleChecked={toggleChecked}
            onToggleAll={toggleAllVisible}
            onBulkAction={handleBulkAction}
            busyBulk={bulkBusy}
            exporting={exporting}
            onExport={handleExport}
          />
        </div>
      </Shell>

      <InvoiceDrawer
        invoice={selected}
        history={history}
        loadingHistory={loadingHistory}
        onClose={() => {
          setSelected(null);
          setHistory([]);
          setLoadingHistory(false);
        }}
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

function buildDemoCsv(status: string, search: string) {
  const invoices = demoList(status, search).items;
  const headers = [
    "filename",
    "vendor_name",
    "invoice_number",
    "total_amount",
    "date",
    "due_date",
    "confidence_score",
    "status",
    "needs_attention",
  ];
  const lines = [
    headers.join(","),
    ...invoices.map((invoice) =>
      [
        invoice.filename,
        invoice.vendor_name ?? "",
        invoice.invoice_number ?? "",
        invoice.total_amount ?? "",
        invoice.date ?? "",
        invoice.due_date ?? "",
        invoice.confidence_score ?? "",
        invoice.status,
        invoice.needs_attention ? "yes" : "no",
      ].join(",")
    ),
  ];
  return lines.join("\n");
}
