"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Check, Cpu, Zap, Users,
  BarChart3, Search, Download, Sparkles,
} from "lucide-react";
import TiltCard, { FloatingCard } from "@/components/TiltCard";

// Google Antigravity color tokens for status
const badge = {
  review: "badge badge-warning",
  approved: "badge badge-success",
  processing: "badge badge-info badge-processing",
} as const;

const dot = {
  review: "bg-amber-400",
  approved: "bg-emerald-400",
  processing: "bg-sky-400 animate-pulse",
} as const;

const statusLabel = { review: "Needs Review", approved: "Approved", processing: "Processing" } as const;

/* -------------------------------------------------------------------------- */
/* Fade In Component with scroll-based animations
/* -------------------------------------------------------------------------- */
function FadeIn({ children, delay = 0, className = "", from = "bottom" }: {
  children: React.ReactNode; delay?: number; className?: string; from?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  
  const variants = {
    bottom: { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } },
    top: { initial: { opacity: 0, y: -18 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: -18 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 18 }, animate: { opacity: 1, x: 0 } },
  };
  
  const selected = variants[from as keyof typeof variants] || variants.bottom;

  return (
    <motion.div
      ref={ref}
      initial={selected.initial}
      animate={inView ? selected.animate : selected.initial}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Product Preview Component - Enhanced for Antigravity
/* -------------------------------------------------------------------------- */
function ProductPreview() {
  const rows = [
    { file: "Invoice_Q4_2026.pdf",  vendor: "Acme Corp",        amount: "$24,850.00", status: "review" },
    { file: "PO_November_2026.pdf", vendor: "TechSolutions Ltd", amount:  "$8,500.00", status: "approved" },
    { file: "Invoice_2026_Nov.txt", vendor: "Global Supplies",   amount: "$12,200.00", status: "processing" },
    { file: "INV-20264829.pdf",     vendor: "Vertex Tech",       amount:  "$3,750.00", status: "approved" },
  ] as const;

  return (
    <FloatingCard max={8} glare delay={200}>
      {/* Browser chrome - Antigravity style */}
      <div className="preview-chrome">
        <div className="flex shrink-0 gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-400/70" />
          <span className="h-3 w-3 rounded-full bg-amber-400/70" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
        </div>
        <div className="mx-auto flex h-5 max-w-[220px] flex-1 items-center rounded-md border border-[var(--ag-border)] bg-white/[0.03] px-3">
          <span className="truncate text-[11px] text-[var(--ag-text-tertiary)]">app.docuextract.ai/review</span>
        </div>
      </div>

      {/* App shell */}
      <div className="flex" style={{ height: 340 }}>
        {/* Sidebar */}
        <div className="flex w-36 shrink-0 flex-col border-r border-[var(--ag-border)] bg-[var(--ag-surface-1)] p-3">
          <div className="mb-3 flex items-center gap-1.5 px-1.5 py-2">
            <div className="grid h-5 w-5 place-items-center rounded bg-[var(--ag-gradient-primary)]">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-bold text-white">DocuExtract</span>
          </div>
          {[
            { label: "Dashboard", active: false },
            { label: "Upload", active: false },
            { label: "Review Queue", active: true },
          ].map((item) => (
            <div 
              key={item.label} 
              className={`mb-0.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                item.active 
                  ? "bg-[var(--ag-gradient-surface)] text-[var(--ag-text-primary)]" 
                  : "text-[var(--ag-text-tertiary)] hover:bg-[var(--ag-surface-glass)]"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-white">Review Queue</span>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                1 needs review
              </span>
              <span className="rounded-md bg-[var(--ag-gradient-primary)] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                + Upload
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-[var(--ag-border)] bg-[var(--ag-surface-glass)]">
            <div className="grid gap-2 border-b border-[var(--ag-border)] bg-white/[0.02] px-3 py-2" 
                 style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}>
              {["Document", "Vendor", "Amount", "Status"].map((hd) => (
                <span key={hd} className="text-[10px] font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">
                  {hd}
                </span>
              ))}
            </div>
            {rows.map((row, i) => (
              <div 
                key={i} 
                className="grid gap-2 border-b border-white/5 px-3 py-2.5 last:border-0"
                style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}
              >
                <span className="truncate text-[11px] font-medium text-[var(--ag-text-secondary)]">
                  {row.file}
                </span>
                <span className="truncate text-[11px] text-[var(--ag-text-tertiary)]">
                  {row.vendor}
                </span>
                <span className="font-mono text-[11px] font-semibold text-white">
                  {row.amount}
                </span>
                <span className={`inline-flex items-center gap-1 self-start rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${badge[row.status]}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[row.status]}`} />
                  {statusLabel[row.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FloatingCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Features Section
/* -------------------------------------------------------------------------- */
const features = [
  { 
    title: "AI-Powered Extraction", 
    desc: "Mistral AI extracts vendor, amounts, invoice numbers, dates, and line items — automatically from any document format.", 
    icon: Cpu 
  },
  { 
    title: "Bulk Upload", 
    desc: "Process hundreds of invoices simultaneously. Async pipeline handles any volume without blocking.", 
    icon: Zap 
  },
  { 
    title: "Human Review", 
    desc: "Side-by-side editor to validate and correct extracted data before approval.", 
    icon: Users 
  },
  { 
    title: "Pipeline Analytics", 
    desc: "Track processing volume, accuracy rates, and total invoice value in real time.", 
    icon: BarChart3 
  },
  { 
    title: "Smart Search", 
    desc: "Search across all invoices by vendor, amount, date, or invoice number instantly.", 
    icon: Search 
  },
  { 
    title: "Export & API", 
    desc: "Export approved invoices as CSV. RESTful API for ERP and accounting system integration.", 
    icon: Download 
  },
];

const pricing = [
  { 
    name: "Starter", 
    price: "Free", 
    desc: "Up to 50 invoices/month. 1 seat.", 
    features: ["AI extraction", "Review queue", "CSV export"], 
    cta: "Get started", 
    highlight: false 
  },
  { 
    name: "Pro", 
    price: "$49/mo", 
    desc: "Up to 1,000 invoices/month. 5 seats.", 
    features: ["Everything in Starter", "Bulk processing", "API access", "Analytics"], 
    cta: "Start free trial", 
    highlight: true 
  },
  { 
    name: "Enterprise", 
    price: "Custom", 
    desc: "Unlimited volume. Unlimited seats.", 
    features: ["Everything in Pro", "SSO / SAML", "Custom integrations", "Dedicated support"], 
    cta: "Contact sales", 
    highlight: false 
  },
];

/* -------------------------------------------------------------------------- */
/* Animated Stats Component
/* -------------------------------------------------------------------------- */
function AnimatedStat({ val, label, delay = 0 }: { val: string; label: string; delay?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.5, 1]);

  return (
    <motion.div 
      ref={ref}
      style={{ scale, opacity }}
      className="text-center"
    >
      <p className="gradient-text tabnum mb-1.5 font-[var(--font-display)] text-4xl font-bold">
        {val}
      </p>
      <p className="text-sm font-medium text-[var(--ag-text-tertiary)]">
        {label}
      </p>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Landing Page
/* -------------------------------------------------------------------------- */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="landing-bg overflow-hidden px-6 pb-24 pt-36">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 lg:grid-cols-2 xl:gap-20"
        >
          <div>
            {/* Powered by badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="chip mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--ag-violet-400)]" />
              Powered by Mistral AI
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="mb-5 font-[var(--font-display)] text-5xl font-bold leading-[1.04] tracking-tight text-white xl:text-[58px]"
            >
              Invoice data<br />extraction,\n              <br />
              <span className="gradient-text glow-text">at zero gravity.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mb-8 max-w-md text-lg leading-relaxed text-[var(--ag-text-secondary)]"
            >
              Upload any invoice. AI extracts structured data with 99%+ accuracy.
              Your team reviews, approves, and exports — in minutes, not hours.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mb-8 flex flex-wrap gap-3"
            >
              <Link href="/dashboard" className="btn btn-primary px-5 py-3 text-[15px]">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/upload" className="btn btn-secondary px-5 py-3 text-[15px]">
                Upload an Invoice
              </Link>
            </motion.div>

            {/* Features checklist */}
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

          {/* Product preview */}
          <motion.div
            className="float-y-slow lg:pl-4"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ProductPreview />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-y border-[var(--ag-border)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mb-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
              Features
            </p>
            <h2 className="max-w-xl font-[var(--font-display)] text-3xl font-bold tracking-tight text-white">
              Everything you need to automate invoice processing
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.05} from="bottom">
                <FloatingCard className="h-full p-6">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[var(--ag-border)] bg-[var(--ag-gradient-surface)]">
                    <f.icon className="h-5 w-5 text-[var(--ag-primary-400)]" />
                  </div>
                  <h3 className="mb-1.5 font-bold text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--ag-text-tertiary)]">
                    {f.desc}
                  </p>
                </FloatingCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="landing-section px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mb-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
              How it works
            </p>
            <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-white">
              From raw document to structured data in 3 steps
            </h2>
          </FadeIn>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="absolute left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] top-8 hidden h-px bg-gradient-to-r from-transparent via-[var(--ag-border-strong)] to-transparent md:block" />
            {[
              { n: "01", title: "Upload", body: "Drag and drop any PDF, text, or image invoice. Batch uploads supported for any volume." },
              { n: "02", title: "AI Extracts", body: "Mistral AI reads the document and extracts vendor, amounts, dates, invoice number, and every line item." },
              { n: "03", title: "Review & Approve", body: "Your team validates the extracted data in a side-by-side editor, then approves with one click." },
            ].map((step, i) => (
              <FadeIn key={step.n} delay={i * 0.1} from="bottom">
                <div className="relative z-10">
                  <div className="card relative z-10 mb-5 grid h-16 w-16 place-items-center">
                    <span className="gradient-text font-[var(--font-display)] text-2xl font-bold">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="mb-2 font-[var(--font-display)] text-xl font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--ag-text-tertiary)]">
                    {step.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="border-y border-[var(--ag-border)] px-6 py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-12 lg:grid-cols-4">
          {["50,000+", "99.2%", "10\u00D7", "$2M+"].map((m, i) => (
            <FadeIn key={m} delay={i * 0.07} from="bottom">
              <AnimatedStat
                val={m}
                label={["Invoices Processed", "Extraction Accuracy", "Faster Than Manual", "AP Value Managed"][i]}
                delay={i * 100}
              />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="landing-section px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="mb-14 text-center" from="bottom">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
              Pricing
            </p>
            <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-white">
              Simple, transparent pricing
            </h2>
          </FadeIn>
          
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {pricing.map((tier, i) => (
              <FadeIn key={tier.name} delay={i * 0.07} from="bottom">
                <FloatingCard 
                  className={`relative flex h-full flex-col p-6 ${tier.highlight ? "border-[var(--ag-primary-500)]" : ""}`}
                  delay={i * 100}
                >
                  {tier.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ag-gradient-primary)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_0_20px_-2px_rgba(139,92,246,0.8)]">
                      Most popular
                    </span>
                  )}
                  <div className="mb-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">
                      {tier.name}
                    </p>
                    <p className={`tabnum font-[var(--font-display)] text-3xl font-bold tracking-tight ${tier.highlight ? "gradient-text" : "text-white"}`}>
                      {tier.price}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ag-text-tertiary)]">
                      {tier.desc}
                    </p>
                  </div>
                  <ul className="mb-7 flex-1 space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="text-[var(--ag-text-secondary)]">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href="/dashboard" 
                    className={`w-full ${tier.highlight ? "btn btn-primary btn-primary-glow" : "btn btn-secondary"}`}
                  >
                    {tier.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </FloatingCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden px-6 py-28">
        <div className="absolute left-1/2 top-1/2 -z-[1] h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.25),transparent_60%)] blur-2xl" />
        <FadeIn className="mx-auto max-w-2xl text-center" from="bottom">
          <h2 className="mb-4 font-[var(--font-display)] text-4xl font-bold leading-tight tracking-tight text-white">
            Start processing invoices <span className="gradient-text">today.</span>
          </h2>
          <p className="mb-10 text-lg text-[var(--ag-text-secondary)]">
            Join finance teams saving 10+ hours per week with AI-powered extraction.
          </p>
          <Link href="/dashboard" className="btn btn-primary btn-primary-glow px-8 py-4 text-base">
            Open Dashboard <ArrowRight className="h-5 w-5" />
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
