"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Building2,
  Clock3,
  DollarSign,
  FileText,
  Filter,
  LogOut,
  Search,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { InvoiceDrawer } from "@/components/dashboard/invoice-drawer";
import { StatusPill, ConfidenceMeter } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { adminApi } from "@/lib/admin-api";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AdminInvoiceListResponse,
  AdminInvoiceRow,
  AdminSummary,
  AdminUserListResponse,
  AdminUserRow,
} from "@/lib/admin-types";
import type { InvoiceAuditEntry, InvoiceStatus } from "@/lib/types";
import { cn, formatCurrency, relativeTime } from "@/lib/utils";

const invoiceStatusOptions: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "review", label: "Needs review" },
  { key: "approved", label: "Approved" },
  { key: "failed", label: "Failed" },
  { key: "rejected", label: "Rejected" },
];

function formatPercent(value: number | null | undefined) {
  return `${(value ?? 0).toFixed(1)}%`;
}

type AdminTab = "overview" | "users" | "invoices" | "admins" | "settings";

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [active, setActive] = useState<AdminTab>("overview");

  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<AdminUserListResponse | null>(null);
  const [invoices, setInvoices] = useState<AdminInvoiceListResponse | null>(null);
  const [admins, setAdmins] = useState<AdminUserRow[]>([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("all");
  const [invoicePage, setInvoicePage] = useState(1);
  const [adminEmail, setAdminEmail] = useState("");
  const [grantingAdmin, setGrantingAdmin] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [retryingInvoice, setRetryingInvoice] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoiceRow | null>(null);
  const [history, setHistory] = useState<InvoiceAuditEntry[]>([]);

  const userSearchTimer = useRef<number | null>(null);
  const invoiceSearchTimer = useRef<number | null>(null);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await adminApi.summary();
      setSummary(data);
      setForbidden(false);
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") {
        setForbidden(true);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Failed to load admin summary");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (forbidden) return;
    setLoadingUsers(true);
    try {
      const data = await adminApi.users({
        page: userPage,
        limit: 20,
        search: userSearch,
      });
      setUsers(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [forbidden, userPage, userSearch]);

  const loadInvoices = useCallback(async () => {
    if (forbidden) return;
    setLoadingInvoices(true);
    try {
      const data = await adminApi.invoices({
        page: invoicePage,
        limit: 20,
        status: invoiceStatus,
        search: invoiceSearch,
      });
      setInvoices(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load invoices");
    } finally {
      setLoadingInvoices(false);
    }
  }, [forbidden, invoicePage, invoiceSearch, invoiceStatus]);

  const loadAdmins = useCallback(async () => {
    if (forbidden) return;
    setLoadingAdmins(true);
    try {
      const data = await adminApi.listAdmins();
      setAdmins(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load admins");
    } finally {
      setLoadingAdmins(false);
    }
  }, [forbidden]);

  const refreshAfterMutation = useCallback(async () => {
    await Promise.all([loadSummary(), loadUsers(), loadInvoices(), loadAdmins()]);
  }, [loadAdmins, loadInvoices, loadSummary, loadUsers]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        router.replace("/login?next=/admin");
        return;
      }
      setEmail(data.user.email ?? null);
      setAuthed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (authed !== true || forbidden) return;
    const timer = window.setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authed, forbidden, loadSummary]);

  useEffect(() => {
    if (authed !== true || forbidden || loadingSummary) return;
    if (userSearchTimer.current) window.clearTimeout(userSearchTimer.current);
    userSearchTimer.current = window.setTimeout(() => {
      void loadUsers();
    }, userSearch ? 220 : 0);
    return () => {
      if (userSearchTimer.current) window.clearTimeout(userSearchTimer.current);
    };
  }, [authed, forbidden, loadingSummary, loadUsers, userPage, userSearch]);

  useEffect(() => {
    if (authed !== true || forbidden || loadingSummary) return;
    if (invoiceSearchTimer.current) window.clearTimeout(invoiceSearchTimer.current);
    invoiceSearchTimer.current = window.setTimeout(() => {
      void loadInvoices();
    }, invoiceSearch ? 220 : 0);
    return () => {
      if (invoiceSearchTimer.current) window.clearTimeout(invoiceSearchTimer.current);
    };
  }, [authed, forbidden, loadingSummary, invoicePage, invoiceSearch, invoiceStatus, loadInvoices]);

  useEffect(() => {
    if (authed !== true || forbidden || loadingSummary) return;
    const timer = window.setTimeout(() => {
      void loadAdmins();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authed, forbidden, loadingSummary, loadAdmins]);

  useEffect(() => {
    if (!selectedInvoice) return;
    let cancelled = false;

    (async () => {
      setLoadingHistory(true);
      try {
        const items = await adminApi.invoiceHistory(selectedInvoice.id);
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
  }, [selectedInvoice]);

  const adminRows = admins;
  const adminCount = summary?.total_admins ?? adminRows.length;

  const currentAdmins = useMemo(
    () => adminRows.filter((user) => user.is_admin),
    [adminRows]
  );

  async function signOut() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleGrantAdmin(payload: { user_id?: string; email?: string }) {
    setGrantingAdmin(true);
    try {
      await adminApi.grantAdmin(payload);
      toast.success("Admin access granted");
      setAdminEmail("");
      await refreshAfterMutation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to grant admin access");
    } finally {
      setGrantingAdmin(false);
    }
  }

  async function handleRevokeAdmin(user: AdminUserRow) {
    if (user.is_bootstrap_admin) {
      toast.error("Bootstrap admins are managed through ADMIN_BOOTSTRAP_EMAILS.");
      return;
    }
    if (!window.confirm(`Remove admin access from ${user.email ?? user.id}?`)) return;

    setUpdatingUserId(user.id);
    try {
      await adminApi.revokeAdmin({ user_id: user.id });
      toast.success("Admin access removed");
      await refreshAfterMutation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke admin access");
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function openInvoice(id: number) {
    try {
      const invoice = await adminApi.getInvoice(id);
      setSelectedInvoice(invoice);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load invoice details");
    }
  }

  async function handleSaveInvoice(patch: Partial<AdminInvoiceRow>) {
    if (!selectedInvoice) return;
    setSavingInvoice(true);
    try {
      const updated = await adminApi.updateInvoice(selectedInvoice.id, patch);
      setSelectedInvoice(updated);
      setInvoices((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((invoice) =>
                invoice.id === updated.id ? { ...invoice, ...updated } : invoice
              ),
            }
          : prev
      );
      toast.success("Changes saved");
      await loadSummary();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save invoice");
    } finally {
      setSavingInvoice(false);
    }
  }

  async function handleStatus(next: InvoiceStatus) {
    if (!selectedInvoice) return;
    setSavingInvoice(true);
    try {
      const updated = await adminApi.updateInvoice(selectedInvoice.id, { status: next });
      setSelectedInvoice(updated);
      setInvoices((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((invoice) =>
                invoice.id === updated.id ? { ...invoice, ...updated } : invoice
              ),
            }
          : prev
      );
      toast.success(next === "approved" ? "Invoice approved" : "Invoice rejected");
      await loadSummary();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setSavingInvoice(false);
    }
  }

  async function handleDeleteInvoice() {
    if (!selectedInvoice) return;
    const currentId = selectedInvoice.id;
    if (!window.confirm("Delete this invoice permanently?")) return;

    try {
      await adminApi.deleteInvoice(currentId);
      setInvoices((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((invoice) => invoice.id !== currentId) }
          : prev
      );
      setSelectedInvoice(null);
      toast.success("Invoice deleted");
      await loadSummary();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete invoice");
    }
  }

  async function handleRetryInvoice() {
    if (!selectedInvoice) return;
    setRetryingInvoice(true);
    try {
      await adminApi.retryInvoice(selectedInvoice.id);
      const refreshed = await adminApi.getInvoice(selectedInvoice.id);
      setSelectedInvoice(refreshed);
      setInvoices((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((invoice) =>
                invoice.id === refreshed.id ? { ...invoice, ...refreshed } : invoice
              ),
            }
          : prev
      );
      toast.success("Re-extraction queued");
      await loadSummary();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to retry invoice");
    } finally {
      setRetryingInvoice(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-6">
        <div className="glass max-w-md rounded-2xl p-8 text-center">
          <LogoMark className="mx-auto h-10 w-10" />
          <h1 className="font-display mt-5 text-xl font-semibold tracking-tight text-ink">
            Configure access to continue
          </h1>
          <p className="mt-2 text-sm text-ink-mute">
            Add your Supabase keys and a bootstrap admin email in{" "}
            <code className="font-mono text-ink">.env.local</code>.
          </p>
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
            Sign in required
          </h1>
          <p className="mt-2 text-sm text-ink-mute">
            Use a workspace account with admin access to open the control center.
          </p>
          <Button variant="secondary" className="mt-6" onClick={() => router.push("/login?next=/admin")}>
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  if (authed === null || loadingSummary) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base">
        <div className="flex flex-col items-center gap-4">
          <LogoMark className="h-10 w-10 animate-pulse" />
          <p className="text-sm text-ink-mute">Loading admin console...</p>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-6">
        <div className="glass max-w-lg rounded-2xl p-8 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-ink">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="font-display mt-5 text-2xl font-semibold tracking-tight text-ink">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-mute">
            This console is limited to approved administrators. Use the bootstrap admin email
            setting or add your account to the admin list.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setForbidden(false);
                void loadSummary();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminShell
        email={email}
        active={active}
        onNavigate={(id) => setActive(id as AdminTab)}
        onSignOut={signOut}
      >
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
                summary={summary}
                adminCount={adminCount}
                recentInvoices={summary?.recent_invoices ?? []}
                onOpenInvoice={openInvoice}
                onOpenUsers={() => setActive("users")}
              />
            )}

            {active === "users" && (
              <UsersTab
                search={userSearch}
                onSearchChange={(value) => {
                  setUserSearch(value);
                  setUserPage(1);
                }}
                data={users}
                loading={loadingUsers}
                onNextPage={() => setUserPage((page) => Math.min(page + 1, users?.pages ?? 1))}
                onPrevPage={() => setUserPage((page) => Math.max(page - 1, 1))}
                onToggleAdmin={(user) => {
                  if (user.is_admin) {
                    void handleRevokeAdmin(user);
                  } else {
                    void handleGrantAdmin({ user_id: user.id });
                  }
                }}
                updatingUserId={updatingUserId}
                currentAdmins={currentAdmins}
              />
            )}

            {active === "invoices" && (
              <InvoicesTab
                summary={summary}
                search={invoiceSearch}
                onSearchChange={(value) => {
                  setInvoiceSearch(value);
                  setInvoicePage(1);
                }}
                status={invoiceStatus}
                onStatusChange={(value) => {
                  setInvoiceStatus(value);
                  setInvoicePage(1);
                }}
                data={invoices}
                loading={loadingInvoices}
                onNextPage={() => setInvoicePage((page) => Math.min(page + 1, invoices?.pages ?? 1))}
                onPrevPage={() => setInvoicePage((page) => Math.max(page - 1, 1))}
                onOpenInvoice={openInvoice}
              />
            )}

            {active === "admins" && (
              <AdminsTab
                email={adminEmail}
                onEmailChange={setAdminEmail}
                onSubmit={() => void handleGrantAdmin({ email: adminEmail })}
                loading={loadingAdmins}
                grantLoading={grantingAdmin}
                admins={admins}
                onRevoke={(user) => void handleRevokeAdmin(user)}
                updatingUserId={updatingUserId}
              />
            )}

            {active === "settings" && (
              <SettingsTab
                email={email}
                adminCount={adminCount}
                onSignOut={signOut}
                onRefresh={() => void refreshAfterMutation()}
                loading={loadingSummary || loadingUsers || loadingInvoices || loadingAdmins}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </AdminShell>

      <InvoiceDrawer
        invoice={selectedInvoice}
        history={history}
        loadingHistory={loadingHistory}
        onClose={() => setSelectedInvoice(null)}
        onSave={handleSaveInvoice}
        onStatus={handleStatus}
        onDelete={handleDeleteInvoice}
        onRetry={handleRetryInvoice}
        retrying={retryingInvoice}
        saving={savingInvoice}
      />
    </>
  );
}

function OverviewTab({
  summary,
  adminCount,
  recentInvoices,
  onOpenInvoice,
  onOpenUsers,
}: {
  summary: AdminSummary | null;
  adminCount: number;
  recentInvoices: AdminInvoiceRow[];
  onOpenInvoice: (id: number) => void;
  onOpenUsers: () => void;
}) {
  const topUsers = summary?.top_users ?? [];
  const topVendors = summary?.top_vendors ?? [];
  const attentionInvoices = summary?.attention_invoices ?? [];
  const failedInvoices = summary?.failed_invoices ?? [];
  const duplicateHeavyUsers = summary?.duplicate_heavy_users ?? [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total users"
          value={summary?.total_users ?? 0}
          accent="var(--color-brand)"
        />
        <StatCard
          icon={ShieldCheck}
          label="Admin accounts"
          value={adminCount}
          accent="var(--color-approved)"
        />
        <StatCard
          icon={FileText}
          label="Invoices visible"
          value={summary?.total_invoices ?? 0}
          accent="var(--color-cyan)"
        />
        <StatCard
          icon={DollarSign}
          label="Processed value"
          value={summary?.total_value ?? 0}
          format={(value) => formatCurrency(value)}
          accent="var(--color-approved)"
        />
        <StatCard
          icon={Clock3}
          label="Awaiting review"
          value={summary?.awaiting_review ?? 0}
          accent="var(--color-review)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Attention flags"
          value={summary?.attention ?? 0}
          accent="var(--color-rejected)"
        />
        <StatCard
          icon={Clock3}
          label="Attention rate"
          value={summary?.attention_rate ?? 0}
          format={(value) => value.toFixed(1)}
          suffix="%"
          accent="var(--color-review)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Failed extraction rate"
          value={summary?.failed_extraction_rate ?? 0}
          format={(value) => value.toFixed(1)}
          suffix="%"
          accent="var(--color-rejected)"
        />
        <StatCard
          icon={FileText}
          label="Duplicate upload rate"
          value={summary?.duplicate_upload_rate ?? 0}
          format={(value) => value.toFixed(1)}
          suffix="%"
          accent="var(--color-cyan)"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="glass grain overflow-hidden rounded-2xl xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line p-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-ink">Top users by volume</h3>
              <p className="mt-0.5 text-xs text-ink-mute">
                The accounts generating the most invoices and review load.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={onOpenUsers}>
              View users <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="divide-y divide-line">
            {topUsers.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-mute">No invoice activity yet.</div>
            ) : (
              topUsers.map((user) => (
                <div key={user.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-medium text-ink">{user.label}</div>
                      {user.review_load_count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-review/12 px-2 py-0.5 text-[0.68rem] font-medium text-review">
                          <AlertTriangle className="h-3 w-3" /> {user.review_load_count} review-load
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-mute">
                      <span>{user.invoice_count} invoices</span>
                      <span>{user.attention_count} attention</span>
                      <span>{user.duplicate_count} duplicates</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-mute">
                    <span className="tnum font-mono text-ink">{formatCurrency(user.total_value)}</span>
                    <span>{relativeTime(user.last_activity_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass grain overflow-hidden rounded-2xl">
          <div className="border-b border-line p-4">
            <h3 className="text-sm font-semibold tracking-tight text-ink">Recent invoices</h3>
            <p className="mt-0.5 text-xs text-ink-mute">Latest documents across the workspace.</p>
          </div>
          <div className="divide-y divide-line">
            {recentInvoices.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-mute">
                No invoice activity yet.
              </div>
            ) : (
              recentInvoices.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => onOpenInvoice(invoice.id)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.025]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-mute">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {invoice.vendor_name ?? invoice.filename}
                    </div>
                    <div className="truncate text-xs text-ink-mute">
                      {invoice.user_email ?? "Unknown user"} · {relativeTime(invoice.uploaded_at)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="tnum font-mono text-sm text-ink">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                    <StatusPill status={invoice.status as InvoiceStatus} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="glass grain overflow-hidden rounded-2xl">
            <div className="border-b border-line p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-bright" />
                <h3 className="text-sm font-semibold tracking-tight text-ink">Operational signals</h3>
              </div>
              <p className="mt-0.5 text-xs text-ink-mute">
                Current concentration, review load, and duplicate pressure.
              </p>
            </div>
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-line bg-surface px-2 py-3">
                  <div className="text-[0.65rem] uppercase tracking-wider text-ink-faint">Attention</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{formatPercent(summary?.attention_rate)}</div>
                </div>
                <div className="rounded-xl border border-line bg-surface px-2 py-3">
                  <div className="text-[0.65rem] uppercase tracking-wider text-ink-faint">Failed</div>
                  <div className="mt-1 text-sm font-semibold text-ink">
                    {formatPercent(summary?.failed_extraction_rate)}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface px-2 py-3">
                  <div className="text-[0.65rem] uppercase tracking-wider text-ink-faint">Duplicates</div>
                  <div className="mt-1 text-sm font-semibold text-ink">
                    {formatPercent(summary?.duplicate_upload_rate)}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-[0.68rem] font-medium uppercase tracking-wider text-ink-faint">
                  Top vendors
                </div>
                <div className="space-y-2">
                  {topVendors.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-line px-3 py-5 text-center text-xs text-ink-mute">
                      Top vendors will appear once invoices are loaded.
                    </div>
                  ) : (
                    topVendors.slice(0, 4).map((vendor, index) => (
                      <div key={vendor.id} className="rounded-xl border border-line bg-surface px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-ink">{vendor.label}</div>
                            <div className="mt-0.5 text-xs text-ink-mute">
                              {vendor.invoice_count} invoice{vendor.invoice_count === 1 ? "" : "s"} ·{" "}
                              {vendor.review_load_count} review load
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="tnum font-mono text-sm font-semibold text-ink">
                              {formatCurrency(vendor.total_value)}
                            </div>
                            <div className="text-[0.68rem] text-ink-faint">#{index + 1}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
                  <div className="text-[0.68rem] font-medium uppercase tracking-wider text-ink-faint">
                    Review load users
                  </div>
                  <div className="mt-2 space-y-2">
                    {topUsers.length === 0 ? (
                      <p className="text-xs text-ink-mute">No review load signal yet.</p>
                    ) : (
                      topUsers.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-ink">{item.label}</span>
                          <span className="tnum font-mono text-ink">{item.review_load_count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
                  <div className="text-[0.68rem] font-medium uppercase tracking-wider text-ink-faint">
                    Duplicate-heavy users
                  </div>
                  <div className="mt-2 space-y-2">
                    {duplicateHeavyUsers.length === 0 ? (
                      <p className="text-xs text-ink-mute">No duplicate-heavy users yet.</p>
                    ) : (
                      duplicateHeavyUsers.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-ink">{item.label}</span>
                          <span className="tnum font-mono text-ink">{item.duplicate_count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass grain overflow-hidden rounded-2xl">
            <div className="border-b border-line p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-review" />
                <h3 className="text-sm font-semibold tracking-tight text-ink">Triage queue</h3>
              </div>
              <p className="mt-0.5 text-xs text-ink-mute">
                Invoices that need the most attention right now.
              </p>
            </div>
            <div className="divide-y divide-line">
              {[...attentionInvoices.slice(0, 3), ...failedInvoices.slice(0, 3)].length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-ink-mute">
                  No urgent invoices in the queue.
                </div>
              ) : (
                [...attentionInvoices.slice(0, 3), ...failedInvoices.slice(0, 3)].map((invoice) => (
                  <button
                    key={invoice.id}
                    onClick={() => onOpenInvoice(invoice.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.025]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-mute">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {invoice.vendor_name ?? invoice.filename}
                      </div>
                      <div className="truncate text-xs text-ink-mute">
                        {invoice.user_email ?? "Unknown user"} · {relativeTime(invoice.uploaded_at)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill status={invoice.status as InvoiceStatus} />
                      <span className="tnum font-mono text-sm text-ink">
                        {formatCurrency(invoice.total_amount)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab({
  search,
  onSearchChange,
  data,
  loading,
  onNextPage,
  onPrevPage,
  onToggleAdmin,
  updatingUserId,
  currentAdmins,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  data: AdminUserListResponse | null;
  loading: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onToggleAdmin: (user: AdminUserRow) => void;
  updatingUserId: string | null;
  currentAdmins: AdminUserRow[];
}) {
  return (
    <div className="glass grain overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-line p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-ink">Users</h3>
            <p className="mt-0.5 text-xs text-ink-mute">
              Workspace-wide directory with email, sign-in, and admin access state.
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search email, name, or id"
              className="focus-ring h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/40 sm:w-80"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-mute">
          <span>{data?.total ?? 0} visible users</span>
          <span>
            {currentAdmins.length} admin{currentAdmins.length === 1 ? "" : "s"} currently loaded
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[0.7rem] uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-2.5 font-medium">User</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Invoices</th>
              <th className="px-4 py-2.5 font-medium">Spend</th>
              <th className="px-4 py-2.5 font-medium">Last sign-in</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-t border-line">
                    {Array.from({ length: 7 }).map((__, col) => (
                      <td key={col} className="px-4 py-3.5">
                        <div className="h-3.5 w-full max-w-[140px] animate-pulse rounded bg-black/[0.06]" />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.items.map((user) => (
                  <tr key={user.id} className="border-t border-line">
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">{user.name ?? "No profile name"}</div>
                        <div className="truncate font-mono text-[0.68rem] text-ink-faint">{user.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">{user.email ?? "Unknown"}</div>
                        <div className="truncate text-[0.72rem] text-ink-mute">
                          Signed up {relativeTime(user.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {user.is_admin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-approved/12 px-2.5 py-1 text-[0.72rem] font-medium text-approved">
                          <BadgeCheck className="h-3.5 w-3.5" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[0.72rem] font-medium text-ink-mute">
                          <Users className="h-3.5 w-3.5" /> Member
                        </span>
                      )}
                      {user.is_bootstrap_admin && (
                        <div className="mt-1 text-[0.68rem] font-medium text-brand">Bootstrap admin</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 tnum font-mono text-ink">{user.invoice_count}</td>
                    <td className="px-4 py-3.5 tnum font-mono text-ink">{formatCurrency(user.total_value)}</td>
                    <td className="px-4 py-3.5 text-[0.8rem] text-ink-mute">
                      {relativeTime(user.last_sign_in_at ?? user.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Button
                        variant={user.is_admin ? "secondary" : "primary"}
                        size="sm"
                        loading={updatingUserId === user.id}
                        disabled={user.is_bootstrap_admin}
                        onClick={() => onToggleAdmin(user)}
                      >
                        {user.is_admin ? "Remove admin" : "Make admin"}
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && (data?.items.length ?? 0) === 0 && (
          <div className="px-6 py-16 text-center text-sm text-ink-mute">No users match your search.</div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <p className="text-xs text-ink-mute">
          Page {data?.page ?? 1} of {data?.pages ?? 1}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onPrevPage} disabled={(data?.page ?? 1) <= 1}>
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onNextPage}
            disabled={(data?.page ?? 1) >= (data?.pages ?? 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function InvoicesTab({
  summary,
  search,
  onSearchChange,
  status,
  onStatusChange,
  data,
  loading,
  onNextPage,
  onPrevPage,
  onOpenInvoice,
}: {
  summary: AdminSummary | null;
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  data: AdminInvoiceListResponse | null;
  loading: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onOpenInvoice: (id: number) => void;
}) {
  return (
    <div className="glass grain overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-line p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-ink">Invoices</h3>
            <p className="mt-0.5 text-xs text-ink-mute">
              All extracted documents with owner email, status, and review controls.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search invoice, vendor, or email"
                className="focus-ring h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/40 sm:w-80"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
            <div className="text-[0.68rem] font-medium uppercase tracking-wider text-ink-faint">
              Attention queue
            </div>
            <div className="mt-1 text-sm font-semibold text-ink">{summary?.attention ?? 0}</div>
          </div>
          <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
            <div className="text-[0.68rem] font-medium uppercase tracking-wider text-ink-faint">
              Failed extractions
            </div>
            <div className="mt-1 text-sm font-semibold text-ink">{summary?.failed ?? 0}</div>
          </div>
          <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
            <div className="text-[0.68rem] font-medium uppercase tracking-wider text-ink-faint">
              Duplicate uploads
            </div>
            <div className="mt-1 text-sm font-semibold text-ink">
              {summary?.duplicate_upload_rate ?? 0}%
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {invoiceStatusOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onStatusChange(option.key)}
              className={cn(
                "focus-ring rounded-full px-3 py-1 text-[0.78rem] font-medium transition-colors",
                status === option.key
                  ? "bg-brand/20 text-brand-bright"
                  : "text-ink-mute hover:bg-black/[0.04] hover:text-ink"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[0.7rem] uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 font-medium">Vendor</th>
              <th className="px-4 py-2.5 font-medium">Invoice #</th>
              <th className="px-4 py-2.5 font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium">Confidence</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Added</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-t border-line">
                    {Array.from({ length: 8 }).map((__, col) => (
                      <td key={col} className="px-4 py-3.5">
                        <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-black/[0.06]" />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.items.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => onOpenInvoice(invoice.id)}
                    className="group cursor-pointer border-t border-line transition-colors hover:bg-black/[0.025]"
                  >
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          {invoice.user_email ?? invoice.user_name ?? "Unknown user"}
                        </div>
                        <div className="truncate font-mono text-[0.68rem] text-ink-faint">
                          {invoice.user_id ?? "—"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          {invoice.vendor_name ?? "Unknown vendor"}
                        </div>
                        {invoice.needs_attention && (
                          <div className="mt-1 inline-flex rounded-full bg-review/12 px-2 py-0.5 text-[0.68rem] font-medium text-review">
                            Attention needed
                          </div>
                        )}
                        <div className="truncate font-mono text-[0.68rem] text-ink-faint">
                          {invoice.filename}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[0.8rem] text-ink-soft">
                      {invoice.invoice_number ?? "-"}
                    </td>
                    <td className="px-4 py-3.5 tnum font-mono font-medium text-ink">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <ConfidenceMeter score={invoice.confidence_score} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={invoice.status as InvoiceStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-[0.8rem] text-ink-mute">
                      {relativeTime(invoice.uploaded_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenInvoice(invoice.id);
                          }}
                        >
                          Open
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && (data?.items.length ?? 0) === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-ink-mute">
              <Filter className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-medium text-ink">No invoices match your filters</p>
            <p className="mt-1 text-xs text-ink-mute">
              Try another status or search term, or clear the filters.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <p className="text-xs text-ink-mute">
          Page {data?.page ?? 1} of {data?.pages ?? 1}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onPrevPage} disabled={(data?.page ?? 1) <= 1}>
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onNextPage}
            disabled={(data?.page ?? 1) >= (data?.pages ?? 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminsTab({
  email,
  onEmailChange,
  onSubmit,
  loading,
  grantLoading,
  admins,
  onRevoke,
  updatingUserId,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  grantLoading: boolean;
  admins: AdminUserRow[];
  onRevoke: (user: AdminUserRow) => void;
  updatingUserId: string | null;
}) {
  const lockedCount = admins.filter((admin) => admin.is_bootstrap_admin).length;

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="glass grain overflow-hidden rounded-2xl">
        <div className="border-b border-line p-4">
          <h3 className="text-sm font-semibold tracking-tight text-ink">Current admins</h3>
          <p className="mt-0.5 text-xs text-ink-mute">
            Bootstrap admins are locked to the `ADMIN_BOOTSTRAP_EMAILS` env variable.
          </p>
        </div>

        <div className="divide-y divide-line">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="px-4 py-4">
                <div className="h-4 w-48 animate-pulse rounded bg-black/[0.06]" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-black/[0.06]" />
              </div>
            ))
          ) : admins.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-mute">
              No admins currently assigned.
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between gap-3 px-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium text-ink">{admin.email ?? "Unknown"}</div>
                    {admin.is_bootstrap_admin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[0.68rem] font-medium text-brand">
                        Locked
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-mute">
                    {admin.name ?? "No profile name"} · {admin.invoice_count} invoices ·{" "}
                    {formatCurrency(admin.total_value)}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={updatingUserId === admin.id}
                  disabled={admin.is_bootstrap_admin}
                  onClick={() => onRevoke(admin)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="glass grain rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
            <UserCog className="h-4 w-4 text-ink-mute" /> Grant admin access
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-mute">
            Add a workspace user by email. The account must already exist in Supabase Auth.
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="admin@company.com"
              className="focus-ring h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-faint focus:border-brand/40"
            />
            <Button
              className="w-full"
              onClick={onSubmit}
              loading={grantLoading}
              disabled={!email.trim()}
            >
              Grant access
            </Button>
          </div>
        </div>

        <div className="glass grain rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
            <ShieldCheck className="h-4 w-4 text-ink-mute" /> Access policy
          </div>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-approved" />
              Admin routes are backed by a service-role Supabase client.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-approved" />
              Every invoice edit, retry, and deletion is audited.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-approved" />
              Bootstrap admins stay active even if the admin table is empty.
            </li>
          </ul>
          <div className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-mute">
            {lockedCount} locked bootstrap admin{lockedCount === 1 ? "" : "s"} configured.
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({
  email,
  adminCount,
  onSignOut,
  onRefresh,
  loading,
}: {
  email: string | null;
  adminCount: number;
  onSignOut: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
          <CalendarDays className="h-4 w-4 text-ink-mute" /> Session
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
          <ShieldCheck className="h-4 w-4 text-ink-mute" /> Platform
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="text-xs text-ink-mute">Admin accounts</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-ink">{adminCount}</div>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="text-xs text-ink-mute">Refresh state</div>
            <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={onRefresh} loading={loading}>
              Refresh data
            </Button>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-mute">
          The admin console uses the `a-app.docuextract.xyz` host and is intentionally not indexed.
        </p>
      </div>
    </div>
  );
}
