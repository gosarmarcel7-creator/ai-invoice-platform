"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/reveal";

const stats = [
  { value: 98.6, suffix: "%", label: "Extraction accuracy", decimals: 1 },
  { value: 1.8, suffix: "s", label: "Avg. parse time", decimals: 1 },
  { value: 92, suffix: "%", label: "Less manual entry", decimals: 0 },
  { value: 4.2, prefix: "$", suffix: "M", label: "Processed monthly", decimals: 1 },
];

export function Metrics() {
  return (
    <section id="metrics" className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-brand-bright">
          By the numbers
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-[2.6rem]">
          Built to remove the busywork
        </h2>
      </Reveal>

      <StaggerGroup className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <div className="glass grain group relative h-full overflow-hidden rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1">
              <div
                className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
              <div className="tnum font-mono text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {s.prefix}
                <AnimatedNumber
                  value={s.value}
                  format={(n) => n.toFixed(s.decimals)}
                />
                {s.suffix}
              </div>
              <p className="mt-2 text-sm text-ink-mute">{s.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
