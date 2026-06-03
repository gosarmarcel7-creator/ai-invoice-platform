"use client";

export function AgChartGradients() {
  return (
    <defs>
      <linearGradient id="agProcessed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3279f9" stopOpacity={0.25} />
        <stop offset="95%" stopColor="#3279f9" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="agApproved" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#137333" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#137333" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="agBar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3279f9" />
        <stop offset="100%" stopColor="#121317" />
      </linearGradient>
      <linearGradient id="agV" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3279f9" stopOpacity={0.25} />
        <stop offset="95%" stopColor="#3279f9" stopOpacity={0} />
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
      <p className="mb-1 font-semibold text-[var(--ag-on-surface)]">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="capitalize" style={{ color: p.color }}>
          {p.name ?? p.dataKey}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export const CHART_COLORS = {
  processed: "#3279f9",
  approved: "#137333",
  processing: "#3279f9",
  review: "#b06000",
};

export const CHART_AXIS = { fill: "#6a6a71", fontSize: 11 };
export const CHART_GRID = "rgba(33, 34, 38, 0.08)";

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
    <div className={`ag-card p-5 ${className}`}>
      <div className="mb-5">
        <h2 className="text-sm font-bold text-[var(--ag-on-surface)]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-[var(--ag-text-tertiary)]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
