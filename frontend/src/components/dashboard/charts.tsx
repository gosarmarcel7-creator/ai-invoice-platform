"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeSeries } from "@/lib/types";
import { formatCompact, formatCurrency } from "@/lib/utils";

const axisStyle = { fill: "#687185", fontSize: 11, fontFamily: "var(--font-mono)" };

function ChartCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass grain rounded-2xl p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-mute">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function TooltipBox({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-medium text-ink">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-ink-soft">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="tnum ml-auto font-mono text-ink">
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function VolumeChart({ data }: { data: TimeSeries["weekly"] }) {
  return (
    <ChartCard
      title="Processing volume"
      subtitle="Documents over the last 7 days"
      right={
        <div className="flex items-center gap-3 text-[0.7rem] text-ink-mute">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-iris" /> Total
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-approved" /> Approved
          </span>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={232}>
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.07)" vertical={false} />
          <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
          <Tooltip cursor={{ stroke: "rgba(15,23,42,0.18)" }} content={<TooltipBox />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#0d9488"
            strokeWidth={2}
            fill="url(#gTotal)"
            animationDuration={900}
          />
          <Area
            type="monotone"
            dataKey="approved"
            stroke="#059669"
            strokeWidth={2}
            fill="url(#gApproved)"
            animationDuration={1100}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ValueChart({ data }: { data: TimeSeries["monthly"] }) {
  const peak = Math.max(...data.map((d) => d.value), 0);
  return (
    <ChartCard title="Approved value" subtitle="Total approved spend by month">
      <ResponsiveContainer width="100%" height={232}>
        <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.07)" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => formatCompact(v)}
          />
          <Tooltip
            cursor={{ fill: "rgba(15,23,42,0.05)" }}
            content={<TooltipBox formatter={(v) => formatCurrency(v)} />}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={900}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.value === peak ? "#059669" : "rgba(5,150,105,0.32)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
