"use client";

import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { Aurora } from "./aurora";

export function CTA() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-16">
      <Reveal>
        <div className="grain relative overflow-hidden rounded-[2rem] border border-line bg-surface/50 px-6 py-16 text-center sm:px-12 sm:py-20">
          <Aurora className="opacity-80" />
          <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-[2.8rem] sm:leading-[1.05]">
              Stop typing invoices.{" "}
              <span className="text-accent">
                Start approving them.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-ink-soft">
              Join finance teams turning hours of data entry into a few seconds of review.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/login?mode=signup" size="lg" className="group">
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink href="/login" size="lg" variant="secondary">
                Sign in
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
