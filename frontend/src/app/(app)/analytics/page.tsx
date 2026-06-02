"use client";

import { useEffect, useState, useCallback } from "react";
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

function StatCard({ label, value, sub, icon: Icon, accent = "stone" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    stone: "bg-stone-100 text-stone-500",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red:   "bg-red-50 text-red-600",
    blue:  "bg-blue-50 text-blue-600",
  };
  const iconClass = accentMap[accent] ?? accentMap.stone;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{label}</p>
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${iconClass}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-2xl font-black text-stone-900 tabnum">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 shadow-md text-xs">
      <p className="font-semibold text-stone-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name ?? p.dataKey}: <span className="font-bold text-stone-800">{p.value}</span>
        </p>
      ))}
    </div>
  );
}


const STATUS_COLORS: Record<string, string> = {
  approved:   "#16a34a",
  review:     "#d97706",
  processing: "#3b82f6",
  rejected:   "#dc2626",
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

  const weeklyData  = (timeseries?.weekly ?? []).map((d) => ({
    day: d.day, processed: d.total, approved: d.approved, rejected: d.rejected,
  }));
  const monthlyData = (timeseries?.monthly ?? []).map((d) => ({
    month: d.month, volume: d.total, value: d.value,
  }));

  const statusBreakdown = [
    { name: "Approved",   value: a.approved,        color: STATUS_COLORS.approved },
    { name: "Review",     value: a.awaiting_review,  color: STATUS_COLORS.review },
    { name: "Processing", value: a.processing,        color: STATUS_COLORS.processing },
    { name: "Rejected",   value: a.rejected,          color: STATUS_COLORS.rejected },
  ].filter((d) => d.value > 0);

  const approvalRate = a.total_documents > 0
    ? Math.round((a.approved / a.total_documents) * 100)
    : 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-900">Analytics</h1>
          <p className="text-sm text-stone-400 mt-0.5">Pipeline performance and document metrics</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn btn-secondary text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Documents"  value={a.total_documents}          icon={FileText}     />
          <StatCard label="Total Value"      value={formatCurrency(a.total_value)} icon={DollarSign} accent="green" />
          <StatCard label="Approval Rate"    value={`${approvalRate}%`}          icon={Percent}      accent="amber"
            sub={`${a.approved} of ${a.total_documents} approved`} />
          <StatCard label="Avg Confidence"   value={`${a.avg_confidence}%`}      icon={TrendingUp}   accent="blue"
            sub="AI extraction accuracy" />
        </div>
      )}

      {/* Status breakdown row */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Approved"   value={a.approved}       icon={CheckCircle2} accent="green" sub="Ready to export" />
          <StatCard label="For Review" value={a.awaiting_review} icon={Clock}        accent="amber" sub="Awaiting human review" />
          <StatCard label="Processing" value={a.processing}      icon={RefreshCw}    accent="blue"  sub="AI extraction running" />
          <StatCard label="Rejected"   value={a.rejected}        icon={XCircle}      accent="red"   sub="Manual rejection" />
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Weekly activity */}
        <div className="xl:col-span-2 card p-5">
          <div className="mb-5">
            <h2 className="font-bold text-stone-900">Weekly Processing Activity</h2>
            <p className="text-xs text-stone-400 mt-0.5">7-day document volume trend</p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0c0a09" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0c0a09" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efed" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#a8a29e", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a8a29e", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="processed" name="Processed" stroke="#0c0a09" strokeWidth={1.5}
                  fill="url(#gP)" dot={false} activeDot={{ r: 3, fill: "#0c0a09" }} />
                <Area type="monotone" dataKey="approved"  name="Approved"  stroke="#16a34a" strokeWidth={1.5}
                  fill="url(#gA)" dot={false} activeDot={{ r: 3, fill: "#16a34a" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <div className="mb-5">
            <h2 className="font-bold text-stone-900">Status Breakdown</h2>
            <p className="text-xs text-stone-400 mt-0.5">Current document distribution</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
          ) : statusBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-stone-400 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-stone-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Monthly volume bar */}
        <div className="card p-5">
          <div className="mb-5">
            <h2 className="font-bold text-stone-900">Monthly Volume</h2>
            <p className="text-xs text-stone-400 mt-0.5">Documents processed per month (YTD)</p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efed" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#a8a29e", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a8a29e", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="volume" name="Documents" fill="#0c0a09" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly value */}
        <div className="card p-5">
          <div className="mb-5">
            <h2 className="font-bold text-stone-900">Monthly Invoice Value</h2>
            <p className="text-xs text-stone-400 mt-0.5">Total approved invoice value per month</p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efed" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#a8a29e", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a8a29e", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 shadow-md text-xs">
                        <p className="font-semibold text-stone-700 mb-1">{label}</p>
                        <p className="text-green-700 font-bold">{formatCurrency(payload[0].value)}</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="value" name="Value" stroke="#16a34a" strokeWidth={1.5}
                  fill="url(#gV)" dot={false} activeDot={{ r: 3, fill: "#16a34a" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-900">Pipeline Summary</h2>
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
              { label: "Total Documents",   value: a.total_documents,                  pct: 100 },
              { label: "Approved",          value: a.approved,                          pct: approvalRate },
              { label: "Awaiting Review",   value: a.awaiting_review,                   pct: a.total_documents > 0 ? Math.round((a.awaiting_review / a.total_documents) * 100) : 0 },
              { label: "Processing",        value: a.processing,                         pct: a.total_documents > 0 ? Math.round((a.processing / a.total_documents) * 100) : 0 },
              { label: "Rejected",          value: a.rejected,                           pct: a.total_documents > 0 ? Math.round((a.rejected / a.total_documents) * 100) : 0 },
              { label: "Total Value",       value: formatCurrency(a.total_value),        pct: null },
              { label: "Avg. Confidence",   value: `${a.avg_confidence}%`,              pct: null },
            ].map((row) => (
              <tr key={row.label}>
                <td className="font-medium text-stone-700">{row.label}</td>
                <td className="text-right font-semibold tabnum text-stone-800">{row.value}</td>
                <td className="text-right text-stone-400">
                  {row.pct !== null ? (
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-20 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-stone-900 rounded-full"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="text-xs w-8 text-right">{row.pct}%</span>
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
