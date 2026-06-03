import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AgFooter() {
  return (
    <footer className="relative border-t border-[var(--ag-border)] px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="mb-4 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--ag-gradient-primary)]">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="font-[family-name:var(--font-display)] font-bold text-white">DocuExtract</span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ag-text-tertiary)]">
            AI invoice extraction built for finance teams who need trust, speed, and audit-ready data.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">Product</p>
          <ul className="space-y-2 text-sm text-[var(--ag-text-secondary)]">
            {["Extraction", "Review", "Analytics", "API"].map((l) => (
              <li key={l}><a href="#product" className="hover:text-white">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">Company</p>
          <ul className="space-y-2 text-sm text-[var(--ag-text-secondary)]">
            {["Privacy", "Terms", "Docs", "Contact"].map((l) => (
              <li key={l}><a href="#" className="hover:text-white">{l}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl border-t border-[var(--ag-border)] pt-6 text-center text-xs text-[var(--ag-text-tertiary)]">
        © 2026 DocuExtract. All rights reserved.
      </p>
    </footer>
  );
}
