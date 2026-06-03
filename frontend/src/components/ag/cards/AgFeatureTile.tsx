import type { LucideIcon } from "lucide-react";
import AgGlassCard from "./AgGlassCard";

export default function AgFeatureTile({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <AgGlassCard className="h-full p-6 transition-transform duration-300 hover:-translate-y-1">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[var(--ag-border)] bg-[var(--ag-gradient-surface)]">
        <Icon className="h-5 w-5 text-[var(--ag-accent)]" />
      </div>
      <h3 className="mb-2 font-bold text-[var(--ag-on-surface)]">{title}</h3>
      <p className="text-sm leading-relaxed text-[var(--ag-text-tertiary)]">{description}</p>
    </AgGlassCard>
  );
}
