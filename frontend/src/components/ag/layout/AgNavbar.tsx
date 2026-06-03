"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import AgLogo from "@/components/ag/brand/AgLogo";

const links = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Updates", href: "#updates" },
];

export default function AgNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--ag-outline)] bg-[var(--ag-surface)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <AgLogo />
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
          <Link href="/login" className="mt-2 block py-2 text-sm font-medium text-[var(--ag-on-surface-variant)]" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <Link href="/dashboard" className="ag-btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
            Open App <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </nav>
  );
}
