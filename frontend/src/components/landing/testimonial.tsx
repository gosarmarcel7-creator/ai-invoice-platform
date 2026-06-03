"use client";

import { Reveal } from "@/components/ui/reveal";

export function Testimonial() {
  return (
    <section className="relative mx-auto max-w-4xl px-5 py-16">
      <Reveal>
        <figure className="glass grain relative overflow-hidden rounded-[1.6rem] px-7 py-12 text-center sm:px-14">
          <div
            className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent"
            aria-hidden
          />
          <span className="font-display text-6xl font-semibold leading-none text-accent/35" aria-hidden>
            “
          </span>
          <blockquote className="-mt-4 text-balance text-xl font-medium leading-relaxed tracking-tight text-ink sm:text-2xl">
            We closed our month-end two days early. Sift reads our messiest vendor PDFs
            better than the people who used to key them in — and we finally trust the
            numbers.
          </blockquote>
          <figcaption className="mt-7 flex items-center justify-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-mono text-sm font-semibold text-white">
              DR
            </span>
            <div className="text-left">
              <div className="text-sm font-medium text-ink">Dana Reyes</div>
              <div className="text-xs text-ink-mute">Controller, Atlas Freight</div>
            </div>
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}
