import Link from "next/link";
import AgLogo from "@/components/ag/brand/AgLogo";

const productLinks = [
  { label: "Extraction", href: "#product" },
  { label: "Review", href: "#product" },
  { label: "Analytics", href: "#product" },
  { label: "API", href: "#product" },
];

const companyLinks = [
  { label: "Privacy", href: "/login" },
  { label: "Terms", href: "/login" },
  { label: "Docs", href: "/dashboard" },
  { label: "Contact", href: "mailto:support@docuextract.ai" },
];

export default function AgFooter() {
  return (
    <footer className="border-t border-[var(--ag-outline)] bg-[var(--ag-surface)] px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="mb-4 flex items-center gap-2.5">
            <AgLogo size="sm" />
            <span className="font-semibold text-[var(--ag-on-surface)]">DocuExtract</span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ag-on-surface-variant)]">
            AI invoice extraction built for finance teams who need trust, speed, and audit-ready data.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">Product</p>
          <ul className="space-y-2 text-sm text-[var(--ag-on-surface-variant)]">
            {productLinks.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="hover:text-[var(--ag-on-surface)]">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">Company</p>
          <ul className="space-y-2 text-sm text-[var(--ag-on-surface-variant)]">
            {companyLinks.map((item) => (
              <li key={item.label}>
                {item.href.startsWith("mailto:") ? (
                  <a href={item.href} className="hover:text-[var(--ag-on-surface)]">
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} className="hover:text-[var(--ag-on-surface)]">
                    {item.label}
                  </Link>
                )}
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
