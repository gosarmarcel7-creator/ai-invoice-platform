"use client";

import { Check } from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/mo",
    blurb: "For trying DocuExtract on real documents.",
    cta: "Start free",
    href: "/login?mode=signup",
    featured: false,
    features: ["100 invoices / month", "AI extraction + confidence", "Manual review queue", "CSV export"],
  },
  {
    name: "Growth",
    price: "$49",
    cadence: "/mo",
    blurb: "For teams automating accounts payable.",
    cta: "Start 14-day trial",
    href: "/login?mode=signup",
    featured: true,
    features: [
      "2,500 invoices / month",
      "Bulk upload & auto-clear",
      "Line-item analytics",
      "Role-based access",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    blurb: "For volume, controls, and compliance.",
    cta: "Talk to us",
    href: "/login",
    featured: false,
    features: ["Unlimited volume", "SSO & audit logs", "Dedicated model tuning", "SLA & onboarding"],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-brand-bright">
          Pricing
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-[2.6rem]">
          Simple plans that scale with volume
        </h2>
        <p className="mt-4 text-ink-soft">Start free. Upgrade when the invoices pile up.</p>
      </Reveal>

      <StaggerGroup className="mt-14 grid gap-4 lg:grid-cols-3">
        {tiers.map((t) => (
          <StaggerItem key={t.name}>
            <div
              className={cn(
                "glass grain relative flex h-full flex-col overflow-hidden rounded-[1.4rem] p-7 transition-transform duration-300 hover:-translate-y-1",
                t.featured && "border-brand/40 glow-brand"
              )}
            >
              {t.featured && (
                <span className="absolute right-5 top-5 rounded-full bg-brand/20 px-2.5 py-1 text-[0.66rem] font-medium text-brand-bright">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold tracking-tight">{t.name}</h3>
              <p className="mt-1 text-sm text-ink-mute">{t.blurb}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-mono text-4xl font-semibold tracking-tight text-ink">
                  {t.price}
                </span>
                <span className="mb-1 text-sm text-ink-mute">{t.cadence}</span>
              </div>

              <ButtonLink
                href={t.href}
                variant={t.featured ? "primary" : "secondary"}
                className="mt-6 w-full"
              >
                {t.cta}
              </ButtonLink>

              <ul className="mt-7 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        t.featured ? "text-brand-bright" : "text-approved"
                      )}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
