"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import AgProductDemo from "./AgProductDemo";

export default function AgHero() {
  return (
    <section className="overflow-hidden px-6 pb-24 pt-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 lg:grid-cols-2 xl:gap-20">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="ag-chip mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Mistral AI
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="mb-5 font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.05] tracking-tight text-white xl:text-[56px]"
          >
            AI invoice extraction,
            <br />
            <span className="ag-gradient-text">built for trust.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mb-8 max-w-md text-lg leading-relaxed text-[var(--ag-text-secondary)]"
          >
            Upload any invoice. AI extracts structured data with 99%+ accuracy.
            Your team reviews, approves, and exports — in minutes, not hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mb-8 flex flex-wrap gap-3"
          >
            <Link href="/dashboard" className="ag-btn-primary px-5 py-3 text-[15px]">
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/upload" className="ag-btn-secondary px-5 py-3 text-[15px]">
              Upload an Invoice
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-5"
          >
            {["No credit card required", "Free to start", "5-min setup"].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-sm text-[var(--ag-text-tertiary)]">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {t}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="lg:pl-4">
          <AgProductDemo />
        </div>
      </div>
    </section>
  );
}
