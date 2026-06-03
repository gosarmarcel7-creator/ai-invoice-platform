"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FileText, Clock, CheckCircle2, TrendingUp,
  DollarSign, ArrowRight, RefreshCw, Upload,
} from "lucide-react";
import { api, type Analytics, type Invoice } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import AgPageHeader from "@/components/ag/app/AgPageHeader";
import AgStatTile from "@/components/ag/app/AgStatTile";
import AgStatusBadge from "@/components/ag/app/AgStatusBadge";
import { AgDataTable, AgTableWrap } from "@/components/ag/app/AgDataTable";
import { AgChartGradients, AgChartTip, CHART_COLORS, CHART_AXIS, CHART_GRID, AgChartCard } from "@/components/ag/app/AgChart";
import AgGlassCard from "@/components/ag/cards/AgGlassCard";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BASE = [4, 7, 5, 9, 12, 3, 6];

function buildChart(approved: number, review: number) {
  const total = approved + review + 8;
  return WEEK.map((day, i) => ({
    day,
    processed: BASE[i] + Math.round((total * BASE[i]) / 46),
    approved: Math.round((approved * BASE[i]) / 46),
  }));
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [aRes, iRes] = await Promise.all([
        api.get<Analytics>("/api/analytics"),
        api.get("/api/invoices/?limit=6"),
      ]);
      setAnalytics(aRes.data);
      setInvoices(iRes.data.items ?? []);
    } catch { /* backend may be offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, [load]);

  const a = analytics ?? {
    total_documents: 0, processing: 0, awaiting_review: 0,
    approved: 0, rejected: 0, total_value: 0, avg_confidence: 0,
  };
  const chart = buildChart(a.approved, a.awaiting_review);

  return (
    <div className="w-full space-y-6">
      <AgPageHeader
        title="Dashboard"
        subtitle="Invoice pipeline overview"
        actions={
          <>
            <button type="button" onClick={() => load(true)} disabled={refreshing} className="ag-btn-secondary">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link href="/upload" className="ag-btn-primary">
              <Upload className="h-3.5 w-3.5" /> Upload
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Total", value: a.total_documents, accent: "from-[var(--ag-accent)] to-[var(--ag-primary)]", icon: <FileText className="h-4 w-4 text-[var(--ag-accent)]" /> },
          { label: "Processing", value: a.processing, accent: "from-[var(--ag-accent)] to-slate-400", icon: <Clock className="h-4 w-4 text-[var(--ag-accent)]" /> },
          { label: "For Review", value: a.awaiting_review, accent: "from-amber-500 to-amber-600", icon: <TrendingUp className="h-4 w-4 text-amber-600" /> },
          { label: "Approved", value: a.approved, accent: "from-emerald-500 to-emerald-600", icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" /> },
          { label: "Total Value", value: formatCurrency(a.total_value), accent: "from-[var(--ag-primary)] to-slate-600", icon: <DollarSign className="h-4 w-4 text-[var(--ag-on-surface)]" /> },
        ].map((stat, i) => (
          <AgStatTile key={stat.label} {...stat} delay={i * 0.04} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <AgChartCard title="Processing Activity" subtitle="7-day estimated trend" className="xl:col-span-2">
          {loading ? (
            <div className="ag-skeleton h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chart} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <AgChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="day" tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <Tooltip content={<AgChartTip />} cursor={{ stroke: "rgba(33,34,38,0.08)" }} />
                <Area type="monotone" dataKey="processed" stroke={CHART_COLORS.processed} strokeWidth={2} fill="url(#agProcessed)" dot={false} />
                <Area type="monotone" dataKey="approved" stroke={CHART_COLORS.approved} strokeWidth={2} fill="url(#agApproved)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AgChartCard>

        <AgGlassCard className="p-5">
          <h2 className="mb-4 text-sm font-bold text-[var(--ag-on-surface)]">Quick Actions</h2>
          <div className="space-y-1.5">
            {[
              { href: "/upload", label: "Upload Invoices", sub: "Add new documents", icon: <Upload className="h-4 w-4 text-[var(--ag-accent)]" /> },
              { href: "/review", label: "Review Queue", sub: `${a.awaiting_review} pending`, icon: <TrendingUp className="h-4 w-4 text-amber-600" /> },
              { href: "/analytics", label: "View Analytics", sub: "Pipeline metrics", icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" /> },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-[var(--ag-outline-strong)] hover:bg-[var(--ag-surface-glass)]"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--ag-border)] bg-[var(--ag-gradient-surface)]">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--ag-on-surface)]">{item.label}</p>
                  <p className="truncate text-xs text-[var(--ag-text-tertiary)]">{item.sub}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--ag-text-tertiary)] group-hover:text-[var(--ag-accent)]" />
              </Link>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-[var(--ag-border)] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--ag-text-tertiary)]">Total value</span>
              <span className="tabnum font-bold text-[var(--ag-on-surface)]">{formatCurrency(a.total_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ag-text-tertiary)]">Avg confidence</span>
              <span className="tabnum font-bold text-[var(--ag-on-surface)]">{a.avg_confidence}%</span>
            </div>
          </div>
        </AgGlassCard>
      </div>

      <AgTableWrap>
        <div className="flex items-center justify-between border-b border-[var(--ag-border)] px-5 py-4">
          <h2 className="text-sm font-bold text-[var(--ag-on-surface)]">Recent Invoices</h2>
          <Link href="/review" className="flex items-center gap-1 text-xs font-semibold text-[var(--ag-text-tertiary)] hover:text-[var(--ag-accent)]">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="ag-skeleton h-4 w-full" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-9 w-9 text-[var(--ag-text-disabled)]" />
            <p className="text-sm font-semibold text-[var(--ag-text-secondary)]">No invoices yet</p>
            <Link href="/upload" className="ag-btn-primary mt-5 inline-flex">
              <Upload className="h-3.5 w-3.5" /> Upload Now
            </Link>
          </div>
        ) : (
          <AgDataTable>
            <thead>
              <tr>
                <th>Document</th>
                <th className="hidden sm:table-cell">Vendor</th>
                <th className="hidden md:table-cell">Amount</th>
                <th className="hidden lg:table-cell">Uploaded</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-[var(--ag-text-tertiary)]" />
                      <span className="max-w-[150px] truncate text-sm font-medium text-[var(--ag-on-surface)]">{inv.filename}</span>
                    </div>
                  </td>
                  <td className="hidden text-sm text-[var(--ag-text-secondary)] sm:table-cell">{inv.vendor_name || "—"}</td>
                  <td className="tabnum hidden text-sm font-semibold text-[var(--ag-on-surface)] md:table-cell">{formatCurrency(inv.total_amount)}</td>
                  <td className="hidden text-sm text-[var(--ag-text-tertiary)] lg:table-cell">{timeAgo(inv.uploaded_at)}</td>
                  <td><AgStatusBadge status={inv.status} /></td>
                  <td className="text-right">
                    {inv.status === "review" && (
                      <Link href={`/review/${inv.id}`} className="text-xs font-semibold text-[var(--ag-accent)]">
                        Review →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </AgDataTable>
        )}
      </AgTableWrap>
    </div>
  );
}
