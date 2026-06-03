"use client";

import { Upload, Cpu, CheckCircle2 } from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/reveal";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Drop the document",
    body: "Upload a PDF, scan, or photo — single file or in bulk. DocuExtract queues it instantly and starts work.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI extracts & scores",
    body: "Our model reads the layout, pulls every field and line item, and attaches a confidence score to each value.",
  },
  {
    icon: CheckCircle2,
    step: "03",
    title: "Review & approve",
    body: "High-confidence invoices auto-clear. Anything uncertain lands in a review queue for a quick human check.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-brand-bright">
          How it works
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-[2.6rem]">
          From upload to ledger in three steps
        </h2>
      </Reveal>

      <StaggerGroup className="relative mt-16 grid gap-5 md:grid-cols-3">
        {/* connecting line */}
        <div
          className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-line-strong to-transparent md:block"
          aria-hidden
        />
        {steps.map((s) => (
          <StaggerItem key={s.step}>
            <div className="relative">
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <span className="absolute inset-0 rounded-full border border-line bg-surface/60" />
                <span className="absolute inset-0 animate-pulse-ring rounded-full border border-brand/40" />
                <s.icon className="relative h-8 w-8 text-brand-bright" />
                <span className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand font-mono text-[0.7rem] font-semibold text-white">
                  {s.step}
                </span>
              </div>
              <h3 className="text-center text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-ink-soft">
                {s.body}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
