"use client";

import { useState } from "react";
import { Cpu, ClipboardList, BarChart3, Plug } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AgFadeIn from "../motion/AgFadeIn";
import AgGlassCard from "../cards/AgGlassCard";

const tabs: { key: string; label: string; icon: LucideIcon; title: string; body: string }[] = [
  {
    key: "extract",
    label: "Extraction",
    icon: Cpu,
    title: "Mistral-powered extraction engine",
    body: "Upload PDFs, images, or text. Our pipeline extracts vendor, amounts, dates, invoice numbers, and line items with confidence scores.",
  },
  {
    key: "review",
    label: "Review",
    icon: ClipboardList,
    title: "Human-in-the-loop review workspace",
    body: "Side-by-side document and data editor. Approve, reject, or save drafts — every change is audit-ready.",
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    title: "Pipeline analytics & reporting",
    body: "Track volume, approval rates, total AP value, and weekly trends. Export insights for finance leadership.",
  },
  {
    key: "api",
    label: "Integrations",
    icon: Plug,
    title: "REST API & ERP connectors",
    body: "Push approved invoices to your ERP or accounting stack. Webhooks and CSV export for any workflow.",
  },
];

export default function AgProductTabs() {
  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  const Icon = current.icon;

  return (
    <AgFadeIn>
      <div className="mb-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
          Product
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-white">
          Built for finance ops, for the agent-first era
        </h2>
        <p className="mt-4 max-w-2xl text-[var(--ag-text-secondary)]">
          DocuExtract is built for teams who need trust — whether you process hundreds of invoices
          or thousands across global entities.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--ag-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active === tab.key
                ? "border-[var(--ag-primary-500)] text-white"
                : "border-transparent text-[var(--ag-text-tertiary)] hover:text-white"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AgGlassCard glow className="grid gap-8 p-8 md:grid-cols-2 md:items-center">
        <div>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[var(--ag-gradient-surface)] border border-[var(--ag-border)]">
            <Icon className="h-6 w-6 text-[var(--ag-primary-400)]" />
          </div>
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-xl font-bold text-white">
            {current.title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--ag-text-secondary)]">{current.body}</p>
        </div>
        <div className="ag-card flex aspect-video items-center justify-center rounded-xl bg-[var(--ag-gradient-surface)]">
          <Icon className="h-16 w-16 text-[var(--ag-primary-400)] opacity-40" />
        </div>
      </AgGlassCard>
    </AgFadeIn>
  );
}
