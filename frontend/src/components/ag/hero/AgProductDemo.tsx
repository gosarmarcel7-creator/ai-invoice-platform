"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const rows = [
  { file: "Invoice_Q4_2026.pdf", vendor: "Acme Corp", amount: "$24,850.00", status: "review" as const },
  { file: "PO_November_2026.pdf", vendor: "TechSolutions Ltd", amount: "$8,500.00", status: "approved" as const },
  { file: "Invoice_2026_Nov.txt", vendor: "Global Supplies", amount: "$12,200.00", status: "processing" as const },
  { file: "INV-20264829.pdf", vendor: "Vertex Tech", amount: "$3,750.00", status: "approved" as const },
];

const badgeClass = {
  review: "ag-badge-review",
  approved: "ag-badge-approved",
  processing: "ag-badge-processing",
};

const dotClass = {
  review: "ag-dot-review",
  approved: "ag-dot-approved",
  processing: "ag-dot-processing",
};

const labels = { review: "Needs Review", approved: "Approved", processing: "Processing" };

export default function AgProductDemo() {
  return (
    <motion.div
      className="overflow-hidden rounded-2xl border border-[var(--ag-outline)] bg-[var(--ag-surface)] shadow-xl"
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-center gap-2 border-b border-[var(--ag-outline)] bg-[var(--ag-surface-container-high)] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="mx-auto flex h-5 max-w-[220px] flex-1 items-center rounded-md border border-[var(--ag-outline)] bg-[var(--ag-surface)] px-3">
          <span className="truncate text-[11px] text-[var(--ag-text-tertiary)]">app.docuextract.ai/review</span>
        </div>
      </div>

      <div className="flex" style={{ minHeight: 320 }}>
        <div className="flex w-36 shrink-0 flex-col border-r border-[var(--ag-outline)] bg-[var(--ag-surface-container)] p-3">
          <div className="mb-3 flex items-center gap-1.5 px-1.5 py-2">
            <div className="grid h-5 w-5 place-items-center rounded bg-[var(--ag-primary)]" aria-hidden>
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-bold text-[var(--ag-on-surface)]">DocuExtract</span>
          </div>
          {["Dashboard", "Upload", "Review Queue"].map((label, i) => (
            <div
              key={label}
              className={`mb-0.5 rounded-md px-2 py-1.5 text-[11px] font-medium ${
                i === 2
                  ? "bg-[var(--ag-surface-container-high)] font-semibold text-[var(--ag-on-surface)]"
                  : "text-[var(--ag-text-tertiary)]"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-hidden bg-[var(--ag-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--ag-on-surface)]">Review Queue</span>
            <span className="ag-badge-review rounded-full px-2 py-0.5 text-[11px] font-semibold">
              1 needs review
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--ag-outline)]">
            <div
              className="grid gap-2 border-b border-[var(--ag-outline)] bg-[var(--ag-surface-container)] px-3 py-2"
              style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}
            >
              {["Document", "Vendor", "Amount", "Status"].map((hd) => (
                <span key={hd} className="text-[10px] font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">
                  {hd}
                </span>
              ))}
            </div>
            {rows.map((row) => (
              <div
                key={row.file}
                className="grid gap-2 border-b border-[var(--ag-outline)] px-3 py-2.5 last:border-0"
                style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}
              >
                <span className="truncate text-[11px] font-medium text-[var(--ag-on-surface)]">{row.file}</span>
                <span className="truncate text-[11px] text-[var(--ag-on-surface-variant)]">{row.vendor}</span>
                <span className="font-mono text-[11px] font-semibold text-[var(--ag-on-surface)] tabnum">{row.amount}</span>
                <span className={`inline-flex items-center gap-1 self-start rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass[row.status]}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass[row.status]}`} />
                  {labels[row.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
