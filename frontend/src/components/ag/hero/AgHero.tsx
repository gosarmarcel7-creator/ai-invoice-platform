"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import AgBackground from "@/components/ag/background/AgBackground";
import AgProductDemo from "./AgProductDemo";

const HEADLINE = "built for trust.";

export default function AgHero() {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(HEADLINE.slice(0, i));
      if (i >= HEADLINE.length) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative -mt-16 overflow-hidden bg-black pt-16 text-white">
      <AgBackground variant="hero" />
      <div className="relative px-6 pb-24 pt-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 lg:grid-cols-2 xl:gap-20">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="ag-chip ag-chip-hero mb-6"
            >
              Powered by Mistral AI
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="mb-5 text-5xl font-bold leading-[1.05] tracking-tight xl:text-[56px]"
            >
              <span className="text-white">AI invoice extraction,</span>
              <br />
              <span className="inline-flex items-baseline gap-0">
                <span className="text-[var(--ag-on-hero)]">{typed}</span>
                <span
                  className="ml-0.5 inline-block h-[0.9em] w-[3px] shrink-0 rounded-sm"
                  style={{ background: "var(--ag-rainbow-cursor)" }}
                  aria-hidden
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mb-8 max-w-md text-lg leading-relaxed text-[var(--ag-on-hero-muted)]"
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
              <Link href="/dashboard" className="ag-btn-hero-primary px-5 py-3 text-[15px]">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/upload" className="ag-btn-hero-secondary px-5 py-3 text-[15px]">
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
                <div key={t} className="flex items-center gap-1.5 text-sm text-[var(--ag-on-hero-muted)]">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#34a853]" />
                  {t}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="lg:pl-4">
            <AgProductDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
