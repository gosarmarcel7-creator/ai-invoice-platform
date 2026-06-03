"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
const links = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Updates", href: "#updates" },
];

function LogoMark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--ag-accent)]">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
        <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2l5.5 3.4v6.8L12 18.8 6.5 15.4V7.6L12 4.2z" />
      </svg>
    </span>
  );
}

export default function AgNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--ag-outline)] bg-[var(--ag-surface)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--ag-on-surface)]">
            DocuExtract
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-[var(--ag-on-surface-variant)] transition-colors hover:text-[var(--ag-on-surface)]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm font-medium text-[var(--ag-on-surface-variant)] hover:text-[var(--ag-on-surface)]"
          >
            Sign in
          </Link>
          <Link href="/dashboard" className="ag-btn-primary text-sm">
            Open App <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          className="p-1 text-[var(--ag-on-surface-variant)] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-[var(--ag-outline)] bg-[var(--ag-surface)] px-6 py-4 md:hidden">
          {links.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-[var(--ag-on-surface-variant)]"
            >
              {item.label}
            </a>
          ))}
          <Link href="/dashboard" className="ag-btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
            Open App <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </nav>
  );
}
