import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AgFadeIn from "../motion/AgFadeIn";
import AgGlassCard from "./AgGlassCard";

const cards = [
  {
    eyebrow: "For finance teams",
    title: "Achieve new heights",
    body: "Start free with 50 invoices per month. Scale to Pro when your AP volume grows.",
    cta: "Get started free",
    href: "/dashboard",
    highlight: true,
  },
  {
    eyebrow: "For enterprises",
    title: "Level up your entire team",
    body: "SSO, custom integrations, unlimited volume, and dedicated support for global AP.",
    cta: "Contact sales",
    href: "/login",
    highlight: false,
  },
];

export default function AgCtaBand() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {cards.map((card, i) => (
        <AgFadeIn key={card.title} delay={i * 0.08}>
          <AgGlassCard glow={card.highlight} className="flex h-full flex-col p-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ag-text-tertiary)]">
              {card.eyebrow}
            </p>
            <h3 className="mb-3 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
              {card.title}
            </h3>
            <p className="mb-6 flex-1 text-sm leading-relaxed text-[var(--ag-text-secondary)]">
              {card.body}
            </p>
            <Link
              href={card.href}
              className={card.highlight ? "ag-btn-primary w-fit" : "ag-btn-secondary w-fit"}
            >
              {card.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </AgGlassCard>
        </AgFadeIn>
      ))}
    </div>
  );
}
