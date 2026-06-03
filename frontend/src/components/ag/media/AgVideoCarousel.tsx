"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AgFadeIn from "../motion/AgFadeIn";
import AgGlassCard from "../cards/AgGlassCard";
import AgPlayButton from "./AgPlayButton";

const slides = [
  { title: "Upload", subtitle: "Drag & drop any invoice format", step: "01" },
  { title: "Extract", subtitle: "Mistral AI pulls vendor, amounts, line items", step: "02" },
  { title: "Review", subtitle: "Side-by-side validation before approval", step: "03" },
  { title: "Approve", subtitle: "One-click sign-off and CSV export", step: "04" },
];

export default function AgVideoCarousel() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const slide = slides[index];

  const prev = () => setIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === slides.length - 1 ? 0 : i + 1));

  return (
    <AgFadeIn>
      <div className="mb-10 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--ag-text-tertiary)]">
          See it in action
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-[var(--ag-on-surface)]">
          From upload to approval
        </h2>
      </div>

      <AgGlassCard glow className="relative overflow-hidden">
        <div className="flex aspect-video items-center justify-center bg-[var(--ag-surface-container-high)]">
          <div className="text-center">
            <AgPlayButton
              onClick={() => {
                setPlaying(true);
                next();
              }}
            />
            {playing && (
              <p className="mt-2 text-xs font-medium text-[var(--ag-accent)]">Walkthrough preview</p>
            )}
            <p className="mt-6 text-2xl font-bold text-[var(--ag-on-surface)]">{slide.title}</p>
            <p className="mt-1 text-sm text-[var(--ag-on-surface-variant)]">{slide.subtitle}</p>
            <p className="mt-4 text-xs font-bold text-[var(--ag-on-surface-variant)]">Step {slide.step}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--ag-outline)] px-4 py-3">
          <button type="button" onClick={prev} className="ag-btn-secondary px-2.5 py-2" aria-label="Previous step">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-[var(--ag-primary)]" : "w-1.5 bg-[var(--ag-outline-strong)]"
                }`}
                aria-label={`Go to step ${i + 1}`}
                aria-current={i === index ? "step" : undefined}
              />
            ))}
          </div>
          <button type="button" onClick={next} className="ag-btn-secondary px-2.5 py-2" aria-label="Next step">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </AgGlassCard>
    </AgFadeIn>
  );
}
