"use client";

export function AgChartGradients() {
  return (
    <defs>
      <linearGradient id="agProcessed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#be93ff" stopOpacity={0.4} />
        <stop offset="95%" stopColor="#be93ff" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="agApproved" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="agBar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="agV" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

export function AgChartTip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ag-chart-tip">
      <p className="mb-1 font-semibold text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="capitalize" style={{ color: p.color }}>
          {p.name ?? p.dataKey}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export const CHART_COLORS = {
  processed: "#be93ff",
  approved: "#34d399",
  processing: "#38bdf8",
  review: "#fbbf24",
};

export const CHART_AXIS = { fill: "#8a8a9a", fontSize: 11 };
export const CHART_GRID = "rgba(255,255,255,0.06)";

export function AgChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`ag-card ag-card-glow p-5 ${className}`}>
      <div className="mb-5">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-[var(--ag-text-tertiary)]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
