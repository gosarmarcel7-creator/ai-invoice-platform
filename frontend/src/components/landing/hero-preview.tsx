"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles, Check } from "lucide-react";

const fields = [
  { label: "Vendor", value: "Northwind Cloud Inc.", conf: 99 },
  { label: "Invoice #", value: "NW-2026-0481", conf: 98 },
  { label: "Date", value: "Jun 1, 2026", conf: 96 },
  { label: "Due date", value: "Jul 1, 2026", conf: 94 },
  { label: "Total", value: "$12,480.00", conf: 99, big: true },
];

export function HeroPreview() {
  return (
    <div className="relative">
      {/* glow under card */}
      <div
        className="absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-3xl"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, rgba(34,197,94,0.16), transparent 70%)" }}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="glass grain relative overflow-hidden rounded-[1.6rem] p-2.5 shadow-[0_30px_80px_-32px_rgba(10,10,10,0.22)]"
      >
        {/* window chrome */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-black/[0.09]" />
            <span className="h-2.5 w-2.5 rounded-full bg-black/[0.09]" />
            <span className="h-2.5 w-2.5 rounded-full bg-black/[0.09]" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-[0.68rem] text-ink-mute">
            <Sparkles className="h-3 w-3 text-brand-bright" />
            Live extraction
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* Document */}
          <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-4">
            <div className="mb-3 flex items-center gap-2 text-ink-mute">
              <FileText className="h-4 w-4" />
              <span className="font-mono text-[0.66rem] tracking-wide">invoice_northwind.pdf</span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-2/5 rounded bg-black/[0.1]" />
              <div className="h-2 w-1/3 rounded bg-black/[0.07]" />
              <div className="mt-4 h-2 w-full rounded bg-black/[0.05]" />
              <div className="h-2 w-5/6 rounded bg-black/[0.05]" />
              <div className="h-2 w-4/6 rounded bg-black/[0.05]" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-2 rounded bg-black/[0.05]" />
                ))}
              </div>
              <div className="mt-4 ml-auto h-3 w-1/3 rounded bg-accent/50" />
            </div>
            {/* scan line */}
            <motion.div
              className="pointer-events-none absolute inset-x-3 top-12 h-12 rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(34,197,94,0.28), transparent)",
              }}
              animate={{ y: [0, 150, 0] }}
              transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
            />
          </div>

          {/* Extracted fields */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-mute">
                Structured output
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-approved/15 px-2 py-0.5 text-[0.64rem] font-medium text-approved">
                <Check className="h-3 w-3" /> Verified
              </span>
            </div>

            <div className="space-y-2.5">
              {fields.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-[0.72rem] text-ink-mute">{f.label}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`tnum truncate text-right text-[0.82rem] ${
                        f.big ? "font-mono font-semibold text-approved" : "font-medium text-ink"
                      }`}
                    >
                      {f.value}
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 border-t border-line pt-3">
              <div className="mb-1.5 flex items-center justify-between text-[0.68rem] text-ink-mute">
                <span>Avg. confidence</span>
                <span className="tnum text-approved">97.2%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07]">
                <motion.div
                  className="h-full rounded-full bg-approved"
                  initial={{ width: 0 }}
                  animate={{ width: "97%" }}
                  transition={{ delay: 1.4, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* floating chips */}
      <motion.div
        className="glass absolute -left-4 top-1/3 hidden items-center gap-2 rounded-xl px-3 py-2 text-xs shadow-xl sm:flex"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-approved" />
        Posted to ledger
      </motion.div>
      <motion.div
        className="glass absolute -right-3 bottom-10 hidden items-center gap-2 rounded-xl px-3 py-2 text-xs shadow-xl sm:flex"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: -2 }}
      >
        <Sparkles className="h-3.5 w-3.5 text-brand-bright" />
        1.8s to parse
      </motion.div>
    </div>
  );
}
