import Link from "next/link";

export default function AgFooter() {
  return (
    <footer className="border-t border-[var(--ag-outline)] bg-[var(--ag-surface)] px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="mb-4 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--ag-accent)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
              </svg>
            </span>
            <span className="font-semibold text-[var(--ag-on-surface)]">DocuExtract</span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ag-on-surface-variant)]">
            AI invoice extraction built for finance teams who need trust, speed, and audit-ready data.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">Product</p>
          <ul className="space-y-2 text-sm text-[var(--ag-on-surface-variant)]">
            {["Extraction", "Review", "Analytics", "API"].map((l) => (
              <li key={l}>
                <a href="#product" className="hover:text-[var(--ag-on-surface)]">{l}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">Company</p>
          <ul className="space-y-2 text-sm text-[var(--ag-on-surface-variant)]">
            {["Privacy", "Terms", "Docs", "Contact"].map((l) => (
              <li key={l}>
                <a href="#" className="hover:text-[var(--ag-on-surface)]">{l}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl border-t border-[var(--ag-outline)] pt-6 text-center text-xs text-[var(--ag-text-tertiary)]">
        © 2026 DocuExtract. All rights reserved.
      </p>
    </footer>
  );
}
