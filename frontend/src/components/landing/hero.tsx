"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Aurora } from "./aurora";
import { HeroPreview } from "./hero-preview";
import { ButtonLink } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="grain relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <Aurora />
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.a
            href="#features"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="focus-ring group inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1.5 pl-2 pr-3.5 text-[0.8rem] text-ink-soft shadow-sm backdrop-blur"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2 py-0.5 text-[0.7rem] font-medium text-brand-bright">
              <Sparkles className="h-3 w-3" /> New
            </span>
            Mistral-powered extraction, now live
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.a>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease, delay: 0.05 }}
            className="font-display mt-6 text-balance text-[2.9rem] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[4.5rem]"
          >
            Invoices,{" "}
            <span className="text-accent">understood</span>{" "}
            by AI.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease, delay: 0.12 }}
            className="mt-5 max-w-xl text-pretty text-[1.05rem] leading-relaxed text-ink-soft"
          >
            Drop in a PDF or scan and DocuExtract returns clean, structured, line-item-level
            data in seconds — with confidence scores, human-in-the-loop review, and
            analytics your finance team will actually trust.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease, delay: 0.2 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <ButtonLink href="/login?mode=signup" size="lg" className="group">
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </ButtonLink>
            <ButtonLink href="#how" size="lg" variant="secondary">
              See how it works
            </ButtonLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.8rem] text-ink-mute"
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-approved" /> No credit card
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-approved" /> SOC 2 aligned
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-approved" /> 14-day trial
            </span>
          </motion.div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}
