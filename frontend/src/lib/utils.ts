import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function statusConfig(status: string) {
  switch (status) {
    case "approved":
      return { label: "Approved", dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]", text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    case "review":
      return { label: "Needs Review", dot: "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]", text: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    case "processing":
      return { label: "Processing", dot: "bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]", text: "text-sky-300", bg: "bg-sky-500/10", border: "border-sky-500/30" };
    case "rejected":
      return { label: "Rejected", dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]", text: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/30" };
    default:
      return { label: status, dot: "bg-slate-400", text: "text-slate-300", bg: "bg-white/5", border: "border-white/15" };
  }
}
