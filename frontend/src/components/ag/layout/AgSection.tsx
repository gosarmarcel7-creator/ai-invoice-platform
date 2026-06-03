import { cn } from "@/lib/utils";

export default function AgSection({
  id,
  children,
  className = "",
  bordered = false,
  tone = "surface",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
  tone?: "surface" | "muted";
}) {
  return (
    <section
      id={id}
      className={cn(
        "px-6 py-24",
        tone === "muted" ? "ag-section-muted" : "ag-section-surface",
        bordered && "border-y border-[var(--ag-outline)]",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
