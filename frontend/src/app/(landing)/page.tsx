import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AgHero from "@/components/ag/hero/AgHero";
import AgSection from "@/components/ag/layout/AgSection";
import AgFadeIn from "@/components/ag/motion/AgFadeIn";
import AgVideoCarousel from "@/components/ag/media/AgVideoCarousel";
import AgProductTabs from "@/components/ag/nav/AgProductTabs";
import AgCtaBand from "@/components/ag/cards/AgCtaBand";
import AgGlassCard from "@/components/ag/cards/AgGlassCard";

const trustStats = [
  { val: "50,000+", label: "Invoices processed" },
  { val: "99.2%", label: "Extraction accuracy" },
  { val: "10×", label: "Faster than manual" },
  { val: "$2M+", label: "AP value managed" },
];

const updates = [
  { date: "Jun 2026", title: "Bulk upload & async pipeline", tag: "Product" },
  { date: "May 2026", title: "Analytics dashboard refresh", tag: "Product" },
  { date: "Apr 2026", title: "Mistral extraction v2", tag: "Engine" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <AgHero />

      <AgSection bordered>
        <AgFadeIn className="text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
            Trusted by finance teams
          </p>
          <h2 className="mx-auto mb-12 max-w-2xl font-[family-name:var(--font-display)] text-3xl font-bold text-white">
            Built for finance ops, for the agent-first era
          </h2>
        </AgFadeIn>
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          {trustStats.map((s, i) => (
            <AgFadeIn key={s.label} delay={i * 0.06} className="text-center">
              <p className="ag-gradient-text tabnum mb-1.5 font-[family-name:var(--font-display)] text-4xl font-bold">
                {s.val}
              </p>
              <p className="text-sm text-[var(--ag-text-tertiary)]">{s.label}</p>
            </AgFadeIn>
          ))}
        </div>
      </AgSection>

      <AgSection id="workflow">
        <AgVideoCarousel />
      </AgSection>

      <AgSection id="product">
        <AgProductTabs />
      </AgSection>

      <AgSection>
        <AgFadeIn className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
            Get started
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white">
            Available at no charge
          </h2>
        </AgFadeIn>
        <AgCtaBand />
      </AgSection>

      <AgSection id="updates" bordered>
        <AgFadeIn className="mb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
            Product updates
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white">
            Latest from DocuExtract
          </h2>
        </AgFadeIn>
        <div className="grid gap-4 md:grid-cols-3">
          {updates.map((post, i) => (
            <AgFadeIn key={post.title} delay={i * 0.06}>
              <AgGlassCard className="group flex h-full flex-col p-6 transition-colors hover:border-[var(--ag-border-glow)]">
                <span className="mb-2 text-xs font-semibold text-[var(--ag-primary-400)]">{post.tag}</span>
                <h3 className="mb-2 font-bold text-white group-hover:text-[var(--ag-violet-400)]">{post.title}</h3>
                <p className="mt-auto text-xs text-[var(--ag-text-tertiary)]">{post.date}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--ag-text-secondary)]">
                  Read update <ArrowRight className="h-3 w-3" />
                </span>
              </AgGlassCard>
            </AgFadeIn>
          ))}
        </div>
      </AgSection>

      <AgSection className="py-28">
        <AgFadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-4xl font-bold text-white">
            Start processing invoices <span className="ag-gradient-text">today.</span>
          </h2>
          <p className="mb-10 text-lg text-[var(--ag-text-secondary)]">
            Join finance teams saving 10+ hours per week with AI-powered extraction.
          </p>
          <Link href="/dashboard" className="ag-btn-primary px-8 py-4 text-base">
            Open Dashboard <ArrowRight className="h-5 w-5" />
          </Link>
        </AgFadeIn>
      </AgSection>
    </div>
  );
}
