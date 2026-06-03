import { cn } from "@/lib/utils";

export default function AgLogo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = size === "sm" ? "h-8 w-8 rounded-lg" : size === "lg" ? "h-10 w-10 rounded-2xl" : "h-9 w-9 rounded-lg";
  const icon = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span
      className={cn("grid shrink-0 place-items-center bg-[var(--ag-primary)]", box, className)}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className={cn(icon, "text-white")} fill="currentColor">
        <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2l5.5 3.4v6.8L12 18.8 6.5 15.4V7.6L12 4.2z" />
      </svg>
    </span>
  );
}
