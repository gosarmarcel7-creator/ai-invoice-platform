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
import AgPageHeader from "@/components/ag/app/AgPageHeader";
import AgStatTile from "@/components/ag/app/AgStatTile";
import { AgDataTable, AgTableWrap } from "@/components/ag/app/AgDataTable";
import { AgChartGradients, AgChartTip, CHART_AXIS, CHART_GRID, CHART_COLORS, AgChartCard } from "@/components/ag/app/AgChart";
import AgGlassCard from "@/components/ag/cards/AgGlassCard";

const STATUS_COLORS: Record<string, string> = {
  approved: CHART_COLORS.approved,
  review: CHART_COLORS.review,
  processing: CHART_COLORS.processing,
  rejected: "#c5221f",
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeseries, setTimeseries] = useState<Timeseries | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
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

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, [load]);

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
    { name: "Approved", value: a.approved, color: STATUS_COLORS.approved },
    { name: "Review", value: a.awaiting_review, color: STATUS_COLORS.review },
    { name: "Processing", value: a.processing, color: STATUS_COLORS.processing },
    { name: "Rejected", value: a.rejected, color: STATUS_COLORS.rejected },
  ].filter((d) => d.value > 0);

  const approvalRate = a.total_documents > 0 ? Math.round((a.approved / a.total_documents) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      <AgPageHeader
        title="Analytics"
        subtitle="Pipeline performance and document metrics"
        actions={
          <button type="button" onClick={() => load(true)} disabled={refreshing} className="ag-btn-secondary">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AgStatTile label="Total Documents" value={a.total_documents} icon={<FileText className="h-4 w-4 text-[var(--ag-accent)]" />} loading={loading} />
        <AgStatTile label="Total Value" value={formatCurrency(a.total_value)} icon={<DollarSign className="h-4 w-4 text-[var(--ag-emerald-400)]" />} loading={loading} delay={0.05} />
        <AgStatTile label="Approval Rate" value={`${approvalRate}%`} icon={<Percent className="h-4 w-4 text-[var(--ag-amber-400)]" />} loading={loading} delay={0.1} />
        <AgStatTile label="Avg Confidence" value={`${a.avg_confidence}%`} icon={<TrendingUp className="h-4 w-4 text-[var(--ag-cyan-400)]" />} loading={loading} delay={0.15} />
      </div>

      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <AgStatTile label="Approved" value={a.approved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} />
          <AgStatTile label="For Review" value={a.awaiting_review} icon={<Clock className="h-4 w-4 text-amber-400" />} />
          <AgStatTile label="Processing" value={a.processing} icon={<RefreshCw className="h-4 w-4 text-sky-400" />} />
          <AgStatTile label="Rejected" value={a.rejected} icon={<XCircle className="h-4 w-4 text-rose-400" />} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <AgChartCard title="Weekly Processing Activity" subtitle="7-day volume trend" className="xl:col-span-2">
          {loading ? <div className="ag-skeleton h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <AgChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="day" tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <Tooltip content={<AgChartTip />} />
                <Area type="monotone" dataKey="processed" name="Processed" stroke={CHART_COLORS.processed} strokeWidth={2} fill="url(#agProcessed)" dot={false} />
                <Area type="monotone" dataKey="approved" name="Approved" stroke={CHART_COLORS.approved} strokeWidth={2} fill="url(#agApproved)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AgChartCard>

        <AgGlassCard className="p-5">
          <h2 className="mb-5 font-bold text-[var(--ag-on-surface)]">Status Breakdown</h2>
          {loading ? <div className="ag-skeleton mx-auto h-40 w-40 rounded-full" /> : statusBreakdown.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--ag-text-tertiary)]">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<AgChartTip />} />
                <Legend formatter={(v) => <span className="text-xs text-[var(--ag-text-secondary)]">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </AgGlassCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AgChartCard title="Monthly Volume" subtitle="Documents per month (YTD)">
          {loading ? <div className="ag-skeleton h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <AgChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="month" tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <Tooltip content={<AgChartTip />} />
                <Bar dataKey="volume" name="Documents" fill="url(#agBar)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AgChartCard>

        <AgChartCard title="Monthly Invoice Value" subtitle="Approved value per month">
          {loading ? <div className="ag-skeleton h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <AgChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="month" tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="ag-chart-tip">
                        <p className="mb-1 font-semibold text-[var(--ag-on-surface)]">{label}</p>
                        <p className="font-bold text-[var(--ag-accent)]">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="value" name="Value" stroke={CHART_COLORS.processed} strokeWidth={2} fill="url(#agV)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AgChartCard>
      </div>

      <AgTableWrap>
        <div className="border-b border-[var(--ag-border)] px-5 py-4">
          <h2 className="font-bold text-[var(--ag-on-surface)]">Pipeline Summary</h2>
        </div>
        <AgDataTable>
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
                <td className="text-[var(--ag-text-secondary)]">{row.label}</td>
                <td className="tabnum text-right font-semibold text-[var(--ag-on-surface)]">{row.value}</td>
                <td className="text-right text-[var(--ag-text-tertiary)]">
                  {row.pct !== null ? `${row.pct}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </AgDataTable>
      </AgTableWrap>
    </div>
  );
}
