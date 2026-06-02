"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Layers, ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-white/95 backdrop-blur-sm border-b border-stone-200 shadow-sm"
          : "bg-white/80 backdrop-blur-sm"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-stone-900 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-stone-900 text-sm tracking-tight">DocuExtract</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {[
            { label: "Features", href: "#features" },
            { label: "How It Works", href: "#how" },
            { label: "Pricing", href: "#pricing" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors font-medium"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-sm text-stone-600 hover:text-stone-900 px-3 py-1.5 font-medium transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
          >
            Open App <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button className="md:hidden text-stone-500 p-1" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-stone-200 px-6 py-4 space-y-1">
          {[
            { label: "Features", href: "#features" },
            { label: "How It Works", href: "#how" },
            { label: "Pricing", href: "#pricing" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm text-stone-600 font-medium"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
            >
              Open App <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-stone-200 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-stone-900 flex items-center justify-center">
            <Layers className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-bold text-stone-700">DocuExtract</span>
        </div>
        <p className="text-sm text-stone-400">© 2026 DocuExtract. All rights reserved.</p>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Docs", "Contact"].map((item) => (
            <a key={item} href="#" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
              {item}
            </a>
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
