"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  RefreshCw, TrendingUp, CheckCircle2, XCircle,
  Clock, DollarSign, FileText, Percent,
} from "lucide-react";
import { api, type Analytics, type Timeseries } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

const ACCENT: Record<string, string> = {
  indigo: "from-indigo-400 to-violet-400",
  green:  "from-emerald-400 to-teal-400",
  amber:  "from-amber-400 to-orange-400",
  red:    "from-rose-400 to-pink-400",
  blue:   "from-sky-400 to-cyan-400",
};

function StatCard({ label, value, sub, icon: Icon, accent = "indigo", delay = 0 }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="card card-hover relative overflow-hidden p-5"
    >
      <div className="mb-3 flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">{label}</p>
        <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${ACCENT[accent] ?? ACCENT.indigo}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="tabnum font-[var(--font-display)] text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--text-3)]">{sub}</p>}
    </motion.div>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3.5 py-2.5 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-white">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name ?? p.dataKey}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  approved:   "#34d399",
  review:     "#fbbf24",
  processing: "#38bdf8",
  rejected:   "#fb7185",
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeseries, setTimeseries] = useState<Timeseries | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [aRes, tRes] = await Promise.all([
        api.get<Analytics>("/api/analytics"),
        api.get<Timeseries>("/api/analytics/timeseries"),
      ]);
      setAnalytics(aRes.data);
      setTimeseries(tRes.data);
    } catch { /* backend may be offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const a = analytics ?? {
    total_documents: 0, processing: 0, awaiting_review: 0,
    approved: 0, rejected: 0, total_value: 0, avg_confidence: 0,
  };

  const weeklyData = (timeseries?.weekly ?? []).map((d) => ({
    day: d.day, processed: d.total, approved: d.approved, rejected: d.rejected,
  }));
  const monthlyData = (timeseries?.monthly ?? []).map((d) => ({
    month: d.month, volume: d.total, value: d.value,
  }));

  const statusBreakdown = [
    { name: "Approved",   value: a.approved,       color: STATUS_COLORS.approved },
    { name: "Review",     value: a.awaiting_review, color: STATUS_COLORS.review },
    { name: "Processing", value: a.processing,      color: STATUS_COLORS.processing },
    { name: "Rejected",   value: a.rejected,        color: STATUS_COLORS.rejected },
  ].filter((d) => d.value > 0);

  const approvalRate = a.total_documents > 0
    ? Math.round((a.approved / a.total_documents) * 100)
    : 0;

  const axis = { fill: "#6f76a3", fontSize: 11 };
  const grid = "rgba(255,255,255,0.06)";

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="mt-0.5 text-sm text-[var(--text-3)]">Pipeline performance and document metrics</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn btn-secondary">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card space-y-3 p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Documents" value={a.total_documents} icon={FileText} accent="indigo" delay={0} />
          <StatCard label="Total Value" value={formatCurrency(a.total_value)} icon={DollarSign} accent="green" delay={0.05} />
          <StatCard label="Approval Rate" value={`${approvalRate}%`} icon={Percent} accent="amber" delay={0.1} sub={`${a.approved} of ${a.total_documents} approved`} />
          <StatCard label="Avg Confidence" value={`${a.avg_confidence}%`} icon={TrendingUp} accent="blue" delay={0.15} sub="AI extraction accuracy" />
        </div>
      )}

      {/* Status breakdown row */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Approved" value={a.approved} icon={CheckCircle2} accent="green" sub="Ready to export" />
          <StatCard label="For Review" value={a.awaiting_review} icon={Clock} accent="amber" sub="Awaiting human review" />
          <StatCard label="Processing" value={a.processing} icon={RefreshCw} accent="blue" sub="AI extraction running" />
          <StatCard label="Rejected" value={a.rejected} icon={XCircle} accent="red" sub="Manual rejection" />
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-5">
            <h2 className="font-bold text-white">Weekly Processing Activity</h2>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">7-day document volume trend</p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                <Area type="monotone" dataKey="processed" name="Processed" stroke="#818cf8" strokeWidth={2} fill="url(#gP)" dot={false} activeDot={{ r: 4, fill: "#818cf8" }} />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#34d399" strokeWidth={2} fill="url(#gA)" dot={false} activeDot={{ r: 4, fill: "#34d399" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <div className="mb-5">
            <h2 className="font-bold text-white">Status Breakdown</h2>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">Current document distribution</p>
          </div>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
          ) : statusBreakdown.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-[var(--text-3)]">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend formatter={(value) => <span className="text-xs text-[var(--text-2)]">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-5">
            <h2 className="font-bold text-white">Monthly Volume</h2>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">Documents processed per month (YTD)</p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="volume" name="Documents" fill="url(#gBar)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-5">
            <h2 className="font-bold text-white">Monthly Invoice Value</h2>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">Total approved invoice value per month</p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="glass rounded-xl px-3.5 py-2.5 text-xs shadow-xl">
                        <p className="mb-1 font-semibold text-white">{label}</p>
                        <p className="font-bold text-cyan-300">{formatCurrency(payload[0].value)}</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="value" name="Value" stroke="#22d3ee" strokeWidth={2} fill="url(#gV)" dot={false} activeDot={{ r: 4, fill: "#22d3ee" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary table */}
      <div className="card overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-bold text-white">Pipeline Summary</h2>
        </div>
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Metric</th>
              <th className="text-right">Value</th>
              <th className="text-right">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Total Documents", value: a.total_documents, pct: 100 },
              { label: "Approved", value: a.approved, pct: approvalRate },
              { label: "Awaiting Review", value: a.awaiting_review, pct: a.total_documents > 0 ? Math.round((a.awaiting_review / a.total_documents) * 100) : 0 },
              { label: "Processing", value: a.processing, pct: a.total_documents > 0 ? Math.round((a.processing / a.total_documents) * 100) : 0 },
              { label: "Rejected", value: a.rejected, pct: a.total_documents > 0 ? Math.round((a.rejected / a.total_documents) * 100) : 0 },
              { label: "Total Value", value: formatCurrency(a.total_value), pct: null },
              { label: "Avg. Confidence", value: `${a.avg_confidence}%`, pct: null },
            ].map((row) => (
              <tr key={row.label}>
                <td className="font-medium text-[var(--text-2)]">{row.label}</td>
                <td className="tabnum text-right font-semibold text-white">{row.value}</td>
                <td className="text-right text-[var(--text-3)]">
                  {row.pct !== null ? (
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[var(--grad)]" style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs">{row.pct}%</span>
                    </div>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
