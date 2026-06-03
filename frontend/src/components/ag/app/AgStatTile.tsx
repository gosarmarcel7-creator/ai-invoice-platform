"use client";

import { motion } from "framer-motion";
import AgGlassCard from "../cards/AgGlassCard";

export default function AgStatTile({
  label,
  value,
  icon,
  accent = "from-[var(--ag-primary-400)] to-[var(--ag-violet-400)]",
  delay = 0,
  loading = false,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: string;
  delay?: number;
  loading?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <AgGlassCard className="relative overflow-hidden p-5">
        <div className={`absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b ${accent}`} />
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--ag-text-tertiary)]">{label}</p>
            {loading ? (
              <div className="ag-skeleton h-7 w-20" />
            ) : (
              <p className="tabnum font-[family-name:var(--font-display)] text-2xl font-bold text-white">{value}</p>
            )}
          </div>
          {icon && (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--ag-border)] bg-[var(--ag-gradient-surface)]">
              {icon}
            </div>
          )}
        </div>
      </AgGlassCard>
    </motion.div>
  );
}
