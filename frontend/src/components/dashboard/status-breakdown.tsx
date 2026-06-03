"use client";

import { motion } from "framer-motion";
import type { Analytics, InvoiceStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/types";

const order: InvoiceStatus[] = ["approved", "review", "processing", "failed", "rejected"];

export function StatusBreakdown({ analytics }: { analytics: Analytics }) {
  const counts: Record<InvoiceStatus, number> = {
    approved: analytics.approved,
    review: analytics.awaiting_review,
    processing: analytics.processing,
    failed: analytics.failed ?? 0,
    rejected: analytics.rejected,
  };
  const total = order.reduce((s, k) => s + counts[k], 0) || 1;

  const R = 52;
  const C = 2 * Math.PI * R;
  const segments = order.map((k, i) => {
    const frac = counts[k] / total;
    const offsetFrac = order
      .slice(0, i)
      .reduce((sum, prev) => sum + counts[prev] / total, 0);
    return { key: k, frac, dash: frac * C, offset: offsetFrac * C };
  });

  return (
    <div className="glass grain flex flex-col rounded-2xl p-5">
      <h3 className="text-sm font-semibold tracking-tight text-ink">Pipeline status</h3>
      <p className="mt-0.5 text-xs text-ink-mute">Distribution across the queue</p>

      <div className="mt-2 flex items-center gap-6">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(15,23,42,0.07)" strokeWidth="14" />
            {segments.map((s, i) => (
              <motion.circle
                key={s.key}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={STATUS_META[s.key].color}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-s.offset}
                initial={{ opacity: 0 }}
                animate={{ opacity: s.frac > 0 ? 1 : 0 }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.6 }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tnum font-mono text-2xl font-semibold text-ink">
              {analytics.total_documents.toLocaleString()}
            </span>
            <span className="text-[0.66rem] uppercase tracking-wider text-ink-mute">Total</span>
          </div>
        </div>

        <ul className="flex-1 space-y-2.5">
          {order.map((k) => (
            <li key={k} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-soft">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_META[k].color }} />
                {STATUS_META[k].label}
              </span>
              <span className="tnum font-mono text-ink">{counts[k]}</span>
            </li>
          ))}
          <li className="flex items-center justify-between border-t border-line pt-2 text-sm">
            <span className="text-ink-soft">Attention flagged</span>
            <span className="tnum font-mono text-ink">{analytics.attention ?? 0}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
