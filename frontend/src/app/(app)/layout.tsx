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
    <aside className="sidebar-bg sticky top-0 flex h-screen w-56 shrink-0 flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[var(--border)] px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-[var(--grad)] shadow-[0_0_18px_-2px_rgba(124,108,255,0.8)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-[var(--font-display)] text-[15px] font-bold tracking-tight text-white">DocuExtract</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn("nav-link", isActive && "nav-link-active")}
            >
              <link.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-[var(--text-3)]")} />
              <span className="flex-1 truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--grad)]">
            <span className="text-xs font-black text-white">{userInitial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-none text-white">
              {userEmail ? userEmail.split("@")[0] : "Admin"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[var(--text-3)]">
              {userEmail ?? "Enterprise Plan"}
            </p>
          </div>
          {userEmail && (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="shrink-0 rounded-lg p-1 text-[var(--text-3)] transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
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
        <div className="w-full p-7">{children}</div>
      </main>
    </div>
  );
}
