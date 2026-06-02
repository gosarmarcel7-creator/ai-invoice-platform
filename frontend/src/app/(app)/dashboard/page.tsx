"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FileText, Clock, CheckCircle2, TrendingUp,
  DollarSign, ArrowRight, RefreshCw, Upload,
} from "lucide-react";
import { api, type Analytics, type Invoice } from "@/lib/api";
import { formatCurrency, statusConfig, timeAgo } from "@/lib/utils";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BASE = [4, 7, 5, 9, 12, 3, 6];

function buildChart(approved: number, review: number) {
  const total = approved + review + 8;
  return WEEK.map((day, i) => ({
    day,
    processed: BASE[i] + Math.round((total * BASE[i]) / 46),
    approved:  Math.round((approved * BASE[i]) / 46),
  }));
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3.5 py-2.5 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-white">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="capitalize" style={{ color: p.color }}>
          {p.dataKey}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
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

  useEffect(() => { load(); }, [load]);

  const a = analytics ?? { total_documents: 0, processing: 0, awaiting_review: 0, approved: 0, rejected: 0, total_value: 0, avg_confidence: 0 };
  const chart = buildChart(a.approved, a.awaiting_review);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-0.5 text-sm text-[var(--text-3)]">Invoice pipeline overview</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => load(true)} disabled={refreshing} className="btn btn-secondary">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <Link href="/upload" className="btn btn-primary">
            <Upload className="h-3.5 w-3.5" /> Upload
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card space-y-2 p-4">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: "Total", value: a.total_documents, color: "from-indigo-400 to-violet-400" },
            { label: "Processing", value: a.processing, color: "from-sky-400 to-cyan-400" },
            { label: "For Review", value: a.awaiting_review, color: "from-amber-400 to-orange-400" },
            { label: "Approved", value: a.approved, color: "from-emerald-400 to-teal-400" },
            { label: "Total Value", value: formatCurrency(a.total_value), color: "from-fuchsia-400 to-pink-400" },
          ].map((stat, i) => (
            <motion.div key={stat.label} {...fade} transition={{ delay: i * 0.04 }} className="card card-hover relative overflow-hidden p-4">
              <div className={`absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b ${stat.color}`} />
              <p className="mb-2 pl-3 text-xs font-semibold text-[var(--text-3)]">{stat.label}</p>
              <p className="tabnum pl-3 font-[var(--font-display)] text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Chart + actions */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.1 }} className="card p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Processing Activity</h2>
              <p className="mt-0.5 text-xs text-[var(--text-3)]">7-day estimated trend</p>
            </div>
            <div className="flex gap-4">
              {[
                { label: "Processed", color: "#818cf8" },
                { label: "Approved", color: "#34d399" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-[var(--text-3)]">
                  <span className="h-1.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chart} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#6f76a3", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6f76a3", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                <Area type="monotone" dataKey="processed" stroke="#818cf8" strokeWidth={2} fill="url(#gP)" dot={false} activeDot={{ r: 4, fill: "#818cf8" }} />
                <Area type="monotone" dataKey="approved" stroke="#34d399" strokeWidth={2} fill="url(#gA)" dot={false} activeDot={{ r: 4, fill: "#34d399" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div {...fade} transition={{ delay: 0.15 }} className="card p-5">
          <h2 className="mb-4 text-sm font-bold text-white">Quick Actions</h2>
          <div className="space-y-1.5">
            {[
              { href: "/upload",    label: "Upload Invoices", sub: "Add new documents",            icon: Upload },
              { href: "/review",    label: "Review Queue",    sub: `${a.awaiting_review} pending`,  icon: TrendingUp },
              { href: "/analytics", label: "View Analytics",  sub: "Pipeline metrics",             icon: CheckCircle2 },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-[var(--border)] hover:bg-white/5"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--grad-soft)]">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="truncate text-xs text-[var(--text-3)]">{item.sub}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-4)] transition-colors group-hover:text-white" />
              </Link>
            ))}
          </div>

          <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-[var(--text-3)]">
                <DollarSign className="h-3.5 w-3.5" /> Total value
              </span>
              <span className="tabnum font-bold text-white">{formatCurrency(a.total_value)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-[var(--text-3)]">
                <Clock className="h-3.5 w-3.5" /> Avg confidence
              </span>
              <span className="tabnum font-bold text-white">{a.avg_confidence}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent invoices */}
      <motion.div {...fade} transition={{ delay: 0.2 }} className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-bold text-white">Recent Invoices</h2>
          <Link href="/review" className="flex items-center gap-1 text-xs font-semibold text-[var(--text-3)] transition-colors hover:text-white">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-9 w-9 text-[var(--text-4)]" />
            <p className="text-sm font-semibold text-[var(--text-2)]">No invoices yet</p>
            <p className="mt-1 text-xs text-[var(--text-3)]">Upload your first invoice to begin AI extraction.</p>
            <Link href="/upload" className="btn btn-primary mt-5 inline-flex">
              <Upload className="h-3.5 w-3.5" /> Upload Now
            </Link>
          </div>
        ) : (
          <table className="data-table w-full">
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
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-white/5">
                        <FileText className="h-3.5 w-3.5 text-[var(--text-2)]" />
                      </div>
                      <span className="max-w-[150px] truncate text-sm font-medium text-white">{inv.filename}</span>
                    </div>
                  </td>
                  <td className="hidden text-sm text-[var(--text-2)] sm:table-cell">{inv.vendor_name || "—"}</td>
                  <td className="tabnum hidden text-sm font-semibold text-white md:table-cell">{formatCurrency(inv.total_amount)}</td>
                  <td className="hidden text-sm text-[var(--text-3)] lg:table-cell">{timeAgo(inv.uploaded_at)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className="text-right">
                    {inv.status === "review" && (
                      <Link href={`/review/${inv.id}`} className="flex items-center justify-end gap-1 text-xs font-semibold text-[var(--text-3)] transition-colors hover:text-white">
                        Review <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
