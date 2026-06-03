"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  UploadCloud,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";

const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const headings: Record<string, { title: string; sub: string }> = {
  overview: { title: "Overview", sub: "Welcome back — here’s your pipeline." },
  invoices: { title: "Invoices", sub: "Review, edit, and approve extracted documents." },
  analytics: { title: "Analytics", sub: "Volume, value, and status trends." },
  settings: { title: "Settings", sub: "Manage your workspace and connections." },
};

function NavItems({
  active,
  onNavigate,
  scope = "desktop",
}: {
  active: string;
  onNavigate: (id: string) => void;
  scope?: string;
}) {
  return (
    <nav className="space-y-1">
      {nav.map((n) => (
        <button
          key={n.id}
          onClick={() => onNavigate(n.id)}
          className={cn(
            "focus-ring group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            active === n.id ? "text-ink" : "text-ink-mute hover:text-ink"
          )}
        >
          {active === n.id && (
            <motion.span
              layoutId={`nav-active-${scope}`}
              className="absolute inset-0 rounded-xl border border-line bg-black/[0.045]"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <n.icon className="relative h-[1.05rem] w-[1.05rem]" />
          <span className="relative">{n.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Shell({
  email,
  onUploadClick,
  onSignOut,
  active,
  onNavigate,
  children,
}: {
  email: string | null;
  onUploadClick: () => void;
  onSignOut: () => void;
  active: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const heading = headings[active] ?? headings.overview;

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-dvh bg-base">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-base-2/70 px-4 py-5 backdrop-blur lg:flex">
        <Link href="/" className="focus-ring mb-7 rounded-lg px-1">
          <Logo />
        </Link>
        <NavItems active={active} onNavigate={handleNavigate} />

        <div className="mt-auto space-y-3">
          <div className="glass rounded-2xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-ink">
              <Sparkles className="h-4 w-4 text-brand-bright" /> AI extraction
            </div>
            <p className="mt-1.5 text-[0.7rem] leading-relaxed text-ink-mute">
              Drop a PDF or image and DocuExtract extracts the vendor, totals, and line items automatically.
            </p>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-[0.7rem] font-semibold text-white">
              {initials(email ?? "Guest User")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-ink">{email ?? "Guest"}</div>
              <div className="text-[0.66rem] text-ink-faint">Member</div>
            </div>
            <button
              onClick={onSignOut}
              className="focus-ring rounded-md p-1.5 text-ink-mute hover:bg-black/[0.04] hover:text-ink"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-base-2 px-4 py-5 lg:hidden"
            >
              <div className="mb-7 flex items-center justify-between px-1">
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="focus-ring rounded-lg p-2 text-ink-mute"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavItems active={active} onNavigate={handleNavigate} scope="mobile" />
              <button
                onClick={onSignOut}
                className="focus-ring mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-mute hover:text-ink"
              >
                <LogOut className="h-[1.05rem] w-[1.05rem]" /> Sign out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-base/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="focus-ring rounded-lg p-2 text-ink-mute lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="lg:hidden">
              <LogoMark />
            </span>
            <div className="hidden sm:block">
              <h1 className="text-[0.95rem] font-semibold tracking-tight text-ink">
                {heading.title}
              </h1>
              <p className="text-[0.7rem] text-ink-mute">{heading.sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button size="sm" onClick={onUploadClick} className="group">
              <UploadCloud className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
