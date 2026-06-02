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
      return { label: "Approved", dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-200" };
    case "review":
      return { label: "Needs Review", dot: "bg-amber-500 animate-pulse", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
    case "processing":
      return { label: "Processing", dot: "bg-blue-400 animate-pulse", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
    case "rejected":
      return { label: "Rejected", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
    default:
      return { label: status, dot: "bg-stone-400", text: "text-stone-600", bg: "bg-stone-100", border: "border-stone-200" };
  }
}
