"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Database,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Settings,
  UserCog,
  Users,
  X,
  LogOut,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";

const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "invoices", label: "Invoices", icon: BarChart3 },
  { id: "admins", label: "Admins", icon: UserCog },
  { id: "settings", label: "Settings", icon: Settings },
];

const headings: Record<string, { title: string; sub: string }> = {
  overview: { title: "Overview", sub: "Workspace-wide visibility and controls." },
  users: { title: "Users", sub: "Emails, activity, and access in one place." },
  invoices: { title: "Invoices", sub: "Review every document across every account." },
  admins: { title: "Admins", sub: "Grant and revoke administrative access." },
  settings: { title: "Settings", sub: "Session details and platform configuration." },
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
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "focus-ring group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active === item.id ? "text-ink" : "text-ink-mute hover:text-ink"
            )}
          >
            {active === item.id && (
              <motion.span
                layoutId={`admin-nav-active-${scope}`}
                className="absolute inset-0 rounded-xl border border-line bg-black/[0.04]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <Icon className="relative h-[1.05rem] w-[1.05rem]" />
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  email,
  active,
  onNavigate,
  onSignOut,
  children,
}: {
  email: string | null;
  active: string;
  onNavigate: (id: string) => void;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const heading = headings[active] ?? headings.overview;
  const host = process.env.NEXT_PUBLIC_ADMIN_HOST ?? "a-app.docuextract.xyz";

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-dvh bg-base">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-base-2/80 px-4 py-5 backdrop-blur lg:flex">
        <Link href="/admin" className="focus-ring mb-7 rounded-lg px-1">
          <Logo />
        </Link>

        <div className="mb-5 rounded-2xl border border-line bg-surface px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            <ShieldCheck className="h-3.5 w-3.5 text-approved" />
            Admin console
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Full tenant visibility, including users, invoices, and access control.
          </p>
        </div>

        <NavItems active={active} onNavigate={handleNavigate} />

        <div className="mt-auto space-y-3">
          <div className="glass rounded-2xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-ink">
              <Database className="h-4 w-4 text-brand-bright" /> Workspace
            </div>
            <p className="mt-1.5 text-[0.7rem] leading-relaxed text-ink-mute">
              Host: <span className="font-mono text-ink">{host}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-[0.7rem] font-semibold text-white">
              {initials(email ?? "Admin")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-ink">{email ?? "Admin"}</div>
              <div className="text-[0.66rem] text-ink-faint">Administrator</div>
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
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-base-2 px-4 py-5 lg:hidden"
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

      <div className="lg:pl-64">
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
            <span className="hidden rounded-full border border-line bg-surface px-3 py-1 text-[0.7rem] font-medium text-ink-soft sm:inline-flex">
              {host}
            </span>
            <Button variant="secondary" size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
