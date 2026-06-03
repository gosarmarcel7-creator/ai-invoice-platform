import { cn } from "@/lib/utils";

export default function AgSection({
  id,
  children,
  className = "",
  bordered = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "px-6 py-24",
        bordered && "border-y border-[var(--ag-border)]",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
