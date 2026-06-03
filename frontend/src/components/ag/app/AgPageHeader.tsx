"use client";

import { motion } from "framer-motion";

export default function AgPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-4"
    >
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--ag-text-tertiary)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2.5">{actions}</div>}
    </motion.div>
  );
}
