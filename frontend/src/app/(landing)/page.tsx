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
    <div className="min-h-screen bg-[var(--ag-surface-container)] pt-16">
      <AgHero />

      <AgSection bordered tone="surface">
        <AgFadeIn className="text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
            Trusted by finance teams
          </p>
          <h2 className="mx-auto mb-12 max-w-2xl text-3xl font-bold tracking-tight text-[var(--ag-on-surface)]">
            Built for finance ops, for the agent-first era
          </h2>
        </AgFadeIn>
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          {trustStats.map((s, i) => (
            <AgFadeIn key={s.label} delay={i * 0.06} className="text-center">
              <p className="tabnum mb-1.5 text-4xl font-bold text-[var(--ag-on-surface)]">{s.val}</p>
              <p className="text-sm text-[var(--ag-on-surface-variant)]">{s.label}</p>
            </AgFadeIn>
          ))}
        </div>
      </AgSection>

      <AgSection id="workflow" tone="muted">
        <AgVideoCarousel />
      </AgSection>

      <AgSection id="product" tone="surface">
        <AgProductTabs />
      </AgSection>

      <AgSection tone="muted">
        <AgFadeIn className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
            Get started
          </p>
          <h2 className="text-3xl font-bold text-[var(--ag-on-surface)]">Available at no charge</h2>
        </AgFadeIn>
        <AgCtaBand />
      </AgSection>

      <AgSection id="updates" bordered tone="surface">
        <AgFadeIn className="mb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
            Product updates
          </p>
          <h2 className="text-3xl font-bold text-[var(--ag-on-surface)]">Latest from DocuExtract</h2>
        </AgFadeIn>
        <div className="grid gap-4 md:grid-cols-3">
          {updates.map((post, i) => (
            <AgFadeIn key={post.title} delay={i * 0.06}>
              <AgGlassCard className="group flex h-full flex-col p-6 transition-shadow hover:shadow-md">
                <span className="ag-link mb-2 text-xs font-semibold">{post.tag}</span>
                <h3 className="mb-2 font-bold text-[var(--ag-on-surface)] group-hover:text-[var(--ag-accent)]">
                  {post.title}
                </h3>
                <p className="mt-auto text-xs text-[var(--ag-text-tertiary)]">{post.date}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--ag-on-surface-variant)]">
                  Read update <ArrowRight className="h-3 w-3" />
                </span>
              </AgGlassCard>
            </AgFadeIn>
          ))}
        </div>
      </AgSection>

      <AgSection tone="muted" className="py-28">
        <AgFadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-4xl font-bold text-[var(--ag-on-surface)]">
            Start processing invoices today.
          </h2>
          <p className="mb-10 text-lg text-[var(--ag-on-surface-variant)]">
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
