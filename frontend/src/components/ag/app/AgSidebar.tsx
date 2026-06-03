"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Upload, ClipboardList,
  BarChart3, Settings, LogOut,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/upload", icon: Upload, label: "Upload" },
  { href: "/review", icon: ClipboardList, label: "Review Queue" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function AgSidebar() {
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
      } catch { /* noop */ }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* noop */ }
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="ag-sidebar sticky top-0 z-10 flex h-screen w-60 shrink-0 flex-col">
      <div className="flex h-[72px] items-center border-b border-[var(--ag-outline)] px-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--ag-accent)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden>
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
            </svg>
          </div>
          <div>
            <span className="text-base font-bold text-[var(--ag-on-surface)]">DocuExtract</span>
            <span className="block text-[10px] text-[var(--ag-text-tertiary)]">AI Platform</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
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
              className={cn("ag-nav-link", isActive && "ag-nav-link-active")}
            >
              <link.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-[var(--ag-accent)]" : "")} />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--ag-outline)] p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--ag-outline)] bg-[var(--ag-surface-container)] p-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ag-primary)]">
            <span className="text-sm font-black text-white">{userInitial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--ag-on-surface)]">
              {userEmail ? userEmail.split("@")[0] : "Admin"}
            </p>
            <p className="truncate text-[11px] text-[var(--ag-text-tertiary)]">
              {userEmail ?? "Workspace"}
            </p>
          </div>
          {userEmail && (
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="shrink-0 rounded-lg p-1.5 text-[var(--ag-text-tertiary)] hover:bg-[var(--ag-surface-container-high)] hover:text-[var(--ag-accent)]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
