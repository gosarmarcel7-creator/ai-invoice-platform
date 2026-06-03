"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Upload, ClipboardList,
  BarChart3, Settings, Sparkles, LogOut,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/upload",    icon: Upload,          label: "Upload" },
  { href: "/review",    icon: ClipboardList,   label: "Review Queue" },
  { href: "/analytics", icon: BarChart3,       label: "Analytics" },
  { href: "/settings",  icon: Settings,        label: "Settings" },
];

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    const loadUser = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
          setUserInitial(user.email[0].toUpperCase());
        }
      } catch {}
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="sidebar-bg sticky top-0 flex h-screen w-60 shrink-0 flex-col">
      {/* Logo - Antigravity style */}
      <div className="flex h-18 items-center border-b border-[var(--ag-border)] px-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-[var(--ag-gradient-primary)] shadow-[0_0_24px_-4px_rgba(139,92,246,0.9)]">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-[var(--ag-gradient-primary)] opacity-60 blur-xl" />
            <Sparkles className="relative h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-[var(--font-display)] text-[16px] font-bold tracking-tight text-white">
              DocuExtract
            </span>
            <span className="text-[10px] text-[var(--ag-text-tertiary)] -mt-0.5 hidden md:block">
              AI Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Nav - Antigravity style */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ag-text-tertiary)]">
          Navigation
        </p>
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn("nav-link group", isActive && "nav-link-active")}
            >
              <div className="relative">
                <link.icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-[var(--ag-primary-400)]" : "text-[var(--ag-text-tertiary)]"
                )} />
                {isActive && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[var(--ag-gradient-primary)] blur-lg opacity-60" />
                )}
              </div>
              <span className="flex-1 truncate">{link.label}</span>
              {/* Hover indicator */}
              <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[var(--ag-primary-500)] opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          );
        })}
      </nav>

      {/* User Card - Antigravity style */}
      <div className="border-t border-[var(--ag-border)] p-4">
        <div className="group flex items-center gap-3 rounded-2xl bg-[var(--ag-surface-glass)] p-3 border border-[var(--ag-border)] transition-all hover:border-[var(--ag-border-glow)]">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ag-gradient-primary)] overflow-hidden">
            <span className="text-sm font-black text-white">{userInitial}</span>
            <div className="absolute inset-0 bg-[var(--ag-gradient-secondary)] opacity-40 blur-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-none text-white">
              {userEmail ? userEmail.split("@")[0] : "Admin"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[var(--ag-text-tertiary)]">
              {userEmail ?? "Enterprise Plan"}
            </p>
          </div>
          {userEmail && (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="shrink-0 rounded-lg p-1.5 text-[var(--ag-text-tertiary)] transition-all hover:bg-[var(--ag-surface-glass-strong)] hover:text-[var(--ag-primary-400)]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="w-full p-8">{children}</div>
      </main>
    </div>
  );
}
