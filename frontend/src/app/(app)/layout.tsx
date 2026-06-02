"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Upload, ClipboardList,
  BarChart3, Settings, Layers,
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

  return (
    <aside className="sidebar-bg w-52 shrink-0 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-stone-200/70">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-stone-900 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-stone-900 text-sm tracking-tight">DocuExtract</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-px overflow-y-auto">
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
              <link.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-stone-900" : "text-stone-400")} />
              <span className="flex-1 truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-stone-200/70">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center shrink-0">
            <span className="text-xs font-black text-white">A</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-stone-800 truncate leading-none">Admin</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Enterprise Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f5f4f2]">
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-7 w-full">{children}</div>
      </main>
    </div>
  );
}
