"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  format,
  prefix,
  suffix,
  trend,
  accent = "var(--color-brand)",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  trend?: number;
  accent?: string;
  delay?: number;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <div
      className="glass grain group relative overflow-hidden rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${accent}55, transparent 70%)` }}
        aria-hidden
      />
      <div className="flex items-center justify-between">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line"
          style={{ background: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
        {trend != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.68rem] font-medium",
              up ? "bg-approved/15 text-approved" : "bg-rejected/15 text-rejected"
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4 tnum font-mono text-3xl font-semibold tracking-tight text-ink">
        {prefix}
        <AnimatedNumber value={value} format={format} />
        {suffix}
      </div>
      <p className="mt-1 text-sm text-ink-mute">{label}</p>
    </div>
  );
}
