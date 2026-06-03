import { Loader2 } from "lucide-react";
import { STATUS_META, type InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusPill({
  status,
  className,
}: {
  status: InvoiceStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.72rem] font-medium",
        className
      )}
      style={{
        color: meta.color,
        borderColor: `color-mix(in oklab, ${meta.color} 35%, transparent)`,
        background: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
      }}
    >
      {status === "processing" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      )}
      {meta.label}
    </span>
  );
}

export function ConfidenceMeter({
  score,
  className,
}: {
  score: number | null | undefined;
  className?: string;
}) {
  const pct = score == null ? 0 : Math.round(score <= 1 ? score * 100 : score);
  const color =
    pct >= 90 ? "var(--color-approved)" : pct >= 75 ? "var(--color-review)" : "var(--color-rejected)";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/[0.08]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="tnum text-xs font-medium text-ink-soft">{score == null ? "—" : `${pct}%`}</span>
    </div>
  );
}
