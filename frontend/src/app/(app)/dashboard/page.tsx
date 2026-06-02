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
import { formatCurrency, formatDate, statusConfig, timeAgo } from "@/lib/utils";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BASE = [4, 7, 5, 9, 12, 3, 6];

function buildChart(approved: number, review: number) {
  const total = approved + review + 8;
  return WEEK.map((day, i) => ({
    day,
    processed: BASE[i] + Math.round((total * BASE[i]) / 46),
    approved:  Math.round((approved  * BASE[i]) / 46),
  }));
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text} border ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 shadow-md text-xs">
      <p className="font-semibold text-stone-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="capitalize" style={{ color: p.color }}>
          {p.dataKey}: <span className="font-bold text-stone-800">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

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
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-900">Dashboard</h1>
          <p className="text-sm text-stone-400 mt-0.5">Invoice pipeline overview</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link href="/upload" className="btn btn-primary text-sm">
            <Upload className="w-3.5 h-3.5" /> Upload
          </Link>
        </div>
      </div>

      {/* Stats — horizontal accent-bar style, not cookie-cutter icon-box grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total", value: a.total_documents, color: "bg-stone-900" },
            { label: "Processing", value: a.processing, color: "bg-blue-500" },
            { label: "For Review", value: a.awaiting_review, color: "bg-amber-500" },
            { label: "Approved", value: a.approved, color: "bg-green-500" },
            { label: "Total Value", value: formatCurrency(a.total_value), color: "bg-stone-400" },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${stat.color}`} />
              <p className="text-xs font-semibold text-stone-400 mb-2 pl-3">{stat.label}</p>
              <p className="text-2xl font-black text-stone-900 tabnum pl-3">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart + actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Processing Activity</h2>
              <p className="text-xs text-stone-400 mt-0.5">7-day estimated trend</p>
            </div>
            <div className="flex gap-4">
              {[
                { label: "Processed", color: "#0c0a09" },
                { label: "Approved",  color: "#16a34a" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-stone-400">
                  <span className="w-2.5 h-1.5 rounded-sm" style={{ background: l.color }} />
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
                    <stop offset="5%"  stopColor="#0c0a09" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#0c0a09" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efed" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#a8a29e", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a8a29e", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="processed" stroke="#0c0a09" strokeWidth={1.5} fill="url(#gP)" dot={false} activeDot={{ r: 3, fill: "#0c0a09" }} />
                <Area type="monotone" dataKey="approved"  stroke="#16a34a" strokeWidth={1.5} fill="url(#gA)" dot={false} activeDot={{ r: 3, fill: "#16a34a" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick actions — cleaner, less widget-y */}
        <div className="card p-5">
          <h2 className="font-bold text-stone-900 text-sm mb-4">Quick Actions</h2>
          <div className="space-y-1.5">
            {[
              { href: "/upload",    label: "Upload Invoices",  sub: "Add new documents",            icon: Upload },
              { href: "/review",    label: "Review Queue",     sub: `${a.awaiting_review} pending`, icon: TrendingUp },
              { href: "/analytics", label: "View Analytics",   sub: "Pipeline metrics",             icon: CheckCircle2 },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-stone-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800">{item.label}</p>
                  <p className="text-xs text-stone-400 truncate">{item.sub}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
              </Link>
            ))}
          </div>

          {/* Secondary stats */}
          <div className="mt-5 pt-4 border-t border-stone-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Total value
              </span>
              <span className="font-bold text-stone-900 tabnum">{formatCurrency(a.total_value)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Avg confidence
              </span>
              <span className="font-bold text-stone-900 tabnum">{a.avg_confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-900 text-sm">Recent Invoices</h2>
          <Link href="/review" className="text-xs font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
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
            <FileText className="w-9 h-9 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-semibold text-sm">No invoices yet</p>
            <p className="text-stone-400 text-xs mt-1">Upload your first invoice to begin AI extraction.</p>
            <Link href="/upload" className="btn btn-primary text-sm mt-5 inline-flex">
              <Upload className="w-3.5 h-3.5" /> Upload Now
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
                      <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-stone-500" />
                      </div>
                      <span className="text-stone-800 font-medium truncate max-w-[150px] text-sm">{inv.filename}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell text-stone-600 text-sm">{inv.vendor_name || "—"}</td>
                  <td className="hidden md:table-cell font-semibold tabnum text-stone-800 text-sm">{formatCurrency(inv.total_amount)}</td>
                  <td className="hidden lg:table-cell text-stone-400 text-sm">{timeAgo(inv.uploaded_at)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className="text-right">
                    {inv.status === "review" && (
                      <Link href={`/review/${inv.id}`} className="text-xs font-semibold text-stone-500 hover:text-stone-900 flex items-center justify-end gap-1 transition-colors">
                        Review <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
