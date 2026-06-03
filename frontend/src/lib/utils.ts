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
      return { label: "Approved", dot: "ag-dot-approved", text: "text-emerald-800", bg: "ag-badge-approved", border: "border-emerald-200" };
    case "review":
      return { label: "Needs Review", dot: "ag-dot-review", text: "text-amber-900", bg: "ag-badge-review", border: "border-amber-200" };
    case "processing":
      return { label: "Processing", dot: "ag-dot-processing", text: "text-sky-800", bg: "ag-badge-processing", border: "border-sky-200" };
    case "rejected":
      return { label: "Rejected", dot: "ag-dot-rejected", text: "text-rose-800", bg: "ag-badge-rejected", border: "border-rose-200" };
    default:
      return { label: status, dot: "ag-dot-default", text: "text-slate-700", bg: "ag-badge-default", border: "border-slate-200" };
  }
}
