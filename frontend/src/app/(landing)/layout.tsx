"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-[var(--grad)] shadow-[0_0_20px_-2px_rgba(124,108,255,0.8)]">
        <span className="absolute inset-0 rounded-xl bg-[var(--grad)] blur-md opacity-50" />
        <svg viewBox="0 0 24 24" className="relative h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" />
        </svg>
      </span>
      <span className="font-[var(--font-display)] text-[15px] font-bold tracking-tight text-white">DocuExtract</span>
    </span>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-[var(--border)] bg-[#05060f]/70 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/"><Logo /></Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-[var(--text-3)] transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-[var(--text-2)] transition-colors hover:text-white">
            Sign in
          </Link>
          <Link href="/dashboard" className="btn btn-primary">
            Open App <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button className="p-1 text-[var(--text-2)] md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-[var(--border)] bg-[#05060f]/95 px-6 py-4 backdrop-blur-xl md:hidden">
          {links.map((item) => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[var(--text-2)]">
              {item.label}
            </a>
          ))}
          <Link href="/dashboard" className="btn btn-primary mt-2 w-full">
            Open App <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-[var(--border)] px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 md:flex-row">
        <Logo />
        <p className="text-sm text-[var(--text-3)]">© 2026 DocuExtract. Defying gravity, one invoice at a time.</p>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Docs", "Contact"].map((item) => (
            <a key={item} href="#" className="text-sm text-[var(--text-3)] transition-colors hover:text-white">{item}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
