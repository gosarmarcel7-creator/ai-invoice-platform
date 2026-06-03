"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Updates", href: "#updates" },
];

export default function AgNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    fn();
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-[var(--ag-border)] bg-[#07080f]/80 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-[var(--ag-gradient-primary)] shadow-[var(--ag-shadow-glow)]">
            <Sparkles className="relative h-4 w-4 text-white" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[15px] font-bold tracking-tight text-white">
            DocuExtract
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-[var(--ag-text-tertiary)] transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-[var(--ag-text-secondary)] hover:text-white">
            Sign in
          </Link>
          <Link href="/dashboard" className="ag-btn-primary text-sm">
            Open App <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button type="button" className="p-1 text-[var(--ag-text-secondary)] md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-[var(--ag-border)] bg-[#07080f]/95 px-6 py-4 backdrop-blur-xl md:hidden">
          {links.map((item) => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[var(--ag-text-secondary)]">
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
