"use client";

import { motion } from "framer-motion";
import {
  ScanLine,
  ShieldCheck,
  Workflow,
  LineChart,
  ListChecks,
  Lock,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

function Card({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={cn("h-full", className)}>
      <div className="glass grain group relative h-full overflow-hidden rounded-[1.4rem] p-6 transition-all duration-300 hover:border-line-strong">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.32), transparent 70%)" }}
          aria-hidden
        />
        {children}
      </div>
    </Reveal>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-gradient-to-b from-brand/10 to-transparent text-brand">
      {children}
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-5 py-10 sm:py-16">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-brand-bright">
          The platform
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-[2.6rem]">
          Everything between{" "}
          <span className="text-accent">a PDF</span> and your ledger
        </h2>
        <p className="mt-4 text-pretty text-ink-soft">
          Sift handles capture, extraction, validation, and analytics — so your team
          reviews exceptions instead of typing rows.
        </p>
      </Reveal>

      <div className="mt-14 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        {/* Big feature */}
        <Card className="md:col-span-2 md:row-span-2">
          <Icon>
            <ScanLine className="h-5 w-5" />
          </Icon>
          <h3 className="text-xl font-semibold tracking-tight">Vision-grade extraction</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            Vendors, totals, dates, tax, and every line item — pulled accurately from
            messy PDFs, photos, and scans. Each field ships with a confidence score so
            you know exactly what to trust.
          </p>

          {/* mini field viz */}
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {[
              ["Vendor", "Atlas Freight", 99],
              ["Subtotal", "$8,210.00", 98],
              ["Tax (8.25%)", "$677.33", 95],
              ["Total due", "$8,887.33", 99],
            ].map(([label, value, conf], i) => (
              <motion.div
                key={label as string}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-xl border border-line bg-base-2/70 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.7rem] text-ink-mute">{label}</span>
                  <span className="tnum text-[0.62rem] text-approved">{conf}%</span>
                </div>
                <div className="tnum mt-1 font-mono text-sm font-medium text-ink">{value}</div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card delay={0.05}>
          <Icon>
            <Workflow className="h-5 w-5" />
          </Icon>
          <h3 className="text-lg font-semibold tracking-tight">Review workflow</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Route low-confidence docs to a human. Approve, edit, or reject in a keyboard-
            driven queue.
          </p>
        </Card>

        <Card delay={0.1}>
          <Icon>
            <LineChart className="h-5 w-5" />
          </Icon>
          <h3 className="text-lg font-semibold tracking-tight">Live analytics</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Volume, spend, and throughput trends update in real time across your whole
            pipeline.
          </p>
        </Card>

        <Card delay={0.05}>
          <Icon>
            <ListChecks className="h-5 w-5" />
          </Icon>
          <h3 className="text-lg font-semibold tracking-tight">Line-item detail</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Full breakdowns with quantities and unit prices, ready to export or sync.
          </p>
        </Card>

        <Card delay={0.1}>
          <Icon>
            <ShieldCheck className="h-5 w-5" />
          </Icon>
          <h3 className="text-lg font-semibold tracking-tight">Confidence scoring</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Every extraction is graded, so you only spend attention where it matters.
          </p>
        </Card>

        <Card delay={0.15}>
          <Icon>
            <Lock className="h-5 w-5" />
          </Icon>
          <h3 className="text-lg font-semibold tracking-tight">Private by default</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Row-level security and per-user isolation. Your documents stay yours.
          </p>
        </Card>
      </div>
    </section>
  );
}
