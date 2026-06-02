"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Check, Layers, Cpu, Zap, Users,
  BarChart3, Search, Download,
} from "lucide-react";

function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ProductPreview() {
  const rows = [
    { file: "Invoice_Q4_2026.pdf",  vendor: "Acme Corp",        amount: "$24,850.00", status: "review" },
    { file: "PO_November_2026.pdf", vendor: "TechSolutions Ltd", amount:  "$8,500.00", status: "approved" },
    { file: "Invoice_2026_Nov.txt", vendor: "Global Supplies",   amount: "$12,200.00", status: "processing" },
    { file: "INV-20264829.pdf",     vendor: "Vertex Tech",       amount:  "$3,750.00", status: "approved" },
  ] as const;

  const badge = {
    review:     "bg-amber-50 text-amber-700 border-amber-200",
    approved:   "bg-green-50  text-green-700  border-green-200",
    processing: "bg-blue-50   text-blue-700   border-blue-200",
  } as const;

  const dot = {
    review:     "bg-amber-500",
    approved:   "bg-green-500",
    processing: "bg-blue-400 animate-pulse",
  } as const;

  const statusLabel = {
    review: "Needs Review", approved: "Approved", processing: "Processing",
  } as const;

  return (
    <motion.div
      className="preview-shell select-none"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Browser chrome */}
      <div className="preview-chrome">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-stone-300" />
          <span className="w-3 h-3 rounded-full bg-stone-300" />
          <span className="w-3 h-3 rounded-full bg-stone-300" />
        </div>
        <div className="flex-1 bg-white border border-stone-200 rounded-md h-5 flex items-center px-3 max-w-[220px] mx-auto">
          <span className="text-[11px] text-stone-400 truncate">app.docuextract.ai/review</span>
        </div>
      </div>

      {/* App shell */}
      <div className="flex" style={{ height: 340 }}>
        {/* Sidebar */}
        <div className="w-36 bg-white border-r border-stone-100 p-3 shrink-0 flex flex-col">
          <div className="flex items-center gap-1.5 px-1.5 py-2 mb-3">
            <div className="w-5 h-5 rounded bg-stone-900 flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold text-stone-800">DocuExtract</span>
          </div>
          {[
            { label: "Dashboard",    active: false },
            { label: "Upload",       active: false },
            { label: "Review Queue", active: true },
          ].map((item) => (
            <div
              key={item.label}
              className={`px-2 py-1.5 rounded-md text-[11px] font-medium mb-0.5 ${
                item.active ? "bg-stone-900 text-white" : "text-stone-500"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 bg-stone-50 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-stone-900">Review Queue</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                1 needs review
              </span>
              <span className="text-[11px] bg-stone-900 text-white px-2.5 py-0.5 rounded-md font-semibold">
                + Upload
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
            <div
              className="grid gap-2 border-b border-stone-100 bg-stone-50 px-3 py-2"
              style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}
            >
              {["Document", "Vendor", "Amount", "Status"].map((h) => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{h}</span>
              ))}
            </div>
            {rows.map((row, i) => (
              <div
                key={i}
                className="grid gap-2 px-3 py-2.5 border-b border-stone-50 last:border-0"
                style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}
              >
                <span className="text-[11px] text-stone-700 truncate font-medium">{row.file}</span>
                <span className="text-[11px] text-stone-500 truncate">{row.vendor}</span>
                <span className="text-[11px] text-stone-800 font-mono font-semibold">{row.amount}</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border self-start ${badge[row.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot[row.status]}`} />
                  {statusLabel[row.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const features = [
  { title: "AI-Powered Extraction", desc: "Mistral AI extracts vendor, amounts, invoice numbers, dates, and line items — automatically from any document format.", icon: Cpu },
  { title: "Bulk Upload", desc: "Process hundreds of invoices simultaneously. Async pipeline handles any volume without blocking.", icon: Zap },
  { title: "Human Review", desc: "Side-by-side editor to validate and correct extracted data before approval.", icon: Users },
  { title: "Pipeline Analytics", desc: "Track processing volume, accuracy rates, and total invoice value in real time.", icon: BarChart3 },
  { title: "Smart Search", desc: "Search across all invoices by vendor, amount, date, or invoice number instantly.", icon: Search },
  { title: "Export & API", desc: "Export approved invoices as CSV. RESTful API for ERP and accounting system integration.", icon: Download },
];

const pricing = [
  {
    name: "Starter",
    price: "Free",
    desc: "Up to 50 invoices/month. 1 seat.",
    features: ["AI extraction", "Review queue", "CSV export"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49/mo",
    desc: "Up to 1,000 invoices/month. 5 seats.",
    features: ["Everything in Starter", "Bulk processing", "API access", "Analytics"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Unlimited volume. Unlimited seats.",
    features: ["Everything in Pro", "SSO / SAML", "Custom integrations", "Dedicated support"],
    cta: "Contact sales",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="bg-[#f7f5f3] min-h-screen">
      {/* Hero */}
      <section className="landing-bg pt-28 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 xl:gap-20 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 bg-white border border-stone-200 rounded-full px-3 py-1.5 mb-6 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Powered by Mistral AI
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="text-5xl xl:text-[56px] font-black text-stone-900 leading-[1.05] tracking-tight mb-5"
            >
              Invoice data
              <br />
              extraction,
              <br />
              <span className="text-stone-400">automated.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="text-lg text-stone-500 leading-relaxed max-w-md mb-8"
            >
              Upload any invoice. AI extracts structured data with 99%+ accuracy.
              Your team reviews, approves, and exports — in minutes, not hours.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="flex flex-wrap gap-3 mb-8"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
              >
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-50 hover:border-stone-300 transition-colors"
              >
                Upload an Invoice
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="flex flex-wrap gap-5"
            >
              {["No credit card required", "Free to start", "5-min setup"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-sm text-stone-400">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  {t}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="lg:pl-4">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white border-y border-stone-200 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-stone-400 mb-3">Features</p>
            <h2 className="text-3xl font-black text-stone-900 tracking-tight max-w-xl">
              Everything you need to automate invoice processing
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.05}>
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className="w-4 h-4 text-stone-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 mb-1.5">{f.title}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="landing-section py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-stone-400 mb-3">How it works</p>
            <h2 className="text-3xl font-black text-stone-900 tracking-tight">
              From raw document to structured data in 3 steps
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px border-t border-dashed border-stone-300" />
            {[
              { n: "01", title: "Upload", body: "Drag and drop any PDF, text, or image invoice. Batch uploads supported for any volume." },
              { n: "02", title: "AI Extracts", body: "Mistral AI reads the document and extracts vendor, amounts, dates, invoice number, and every line item." },
              { n: "03", title: "Review & Approve", body: "Your team validates the extracted data in a side-by-side editor, then approves with one click." },
            ].map((step, i) => (
              <FadeIn key={step.n} delay={i * 0.1} className="relative">
                <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center mb-5 relative z-10">
                  <span className="text-2xl font-black text-stone-300">{step.n}</span>
                </div>
                <h3 className="font-black text-stone-900 text-xl mb-2">{step.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{step.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-white border-y border-stone-200 py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12">
          {[
            { val: "50,000+", label: "Invoices Processed" },
            { val: "99.2%",   label: "Extraction Accuracy" },
            { val: "10×",     label: "Faster Than Manual" },
            { val: "$2M+",    label: "AP Value Managed" },
          ].map((m, i) => (
            <FadeIn key={m.label} delay={i * 0.07} className="text-center">
              <p className="text-4xl font-black text-stone-900 tabnum mb-1.5">{m.val}</p>
              <p className="text-sm text-stone-400 font-medium">{m.label}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="landing-section py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-stone-400 mb-3">Pricing</p>
            <h2 className="text-3xl font-black text-stone-900 tracking-tight">Simple, transparent pricing</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pricing.map((tier, i) => (
              <FadeIn key={tier.name} delay={i * 0.07}>
                <div className={`rounded-xl p-6 h-full flex flex-col shadow-sm ${
                  tier.highlight ? "bg-stone-900 text-white" : "bg-white border border-stone-200"
                }`}>
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 text-stone-400">{tier.name}</p>
                    <p className={`text-3xl font-black tracking-tight tabnum ${tier.highlight ? "text-white" : "text-stone-900"}`}>
                      {tier.price}
                    </p>
                    <p className={`text-sm mt-1 ${tier.highlight ? "text-stone-400" : "text-stone-500"}`}>
                      {tier.desc}
                    </p>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-7">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className={`w-3.5 h-3.5 shrink-0 ${tier.highlight ? "text-stone-400" : "text-green-600"}`} />
                        <span className={tier.highlight ? "text-stone-300" : "text-stone-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className={`inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      tier.highlight
                        ? "bg-white text-stone-900 hover:bg-stone-100"
                        : "bg-stone-900 text-white hover:bg-stone-800"
                    }`}
                  >
                    {tier.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-900 py-24 px-6">
        <FadeIn className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white tracking-tight mb-4 leading-tight">
            Start processing invoices today.
          </h2>
          <p className="text-stone-400 text-lg mb-10">
            Join finance teams saving 10+ hours per week with AI-powered extraction.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-stone-900 font-bold text-base hover:bg-stone-100 transition-colors"
          >
            Open Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
