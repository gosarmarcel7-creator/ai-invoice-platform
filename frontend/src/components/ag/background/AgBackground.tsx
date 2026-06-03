"use client";

import { useEffect, useRef, useCallback } from "react";

interface AgBackgroundProps {
  variant?: "hero" | "light" | "none";
}

export default function AgBackground({ variant = "none" }: AgBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = variant === "hero" ? (reduced ? 60 : 120) : reduced ? 30 : 50;
    const isHero = variant === "hero";

    for (let i = 0; i < count; i++) {
      const x = (((i * 7919) % 1000) / 1000) * w;
      const y = (((i * 6271) % 1000) / 1000) * h;
      const r = (((i * 3) % 7) / 7) * (isHero ? 1.4 : 0.8) + 0.2;
      const a = isHero ? 0.08 + ((i * 5) % 10) / 80 : 0.04 + ((i * 5) % 10) / 120;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHero
        ? `rgba(255,255,255,${a})`
        : `rgba(33,34,38,${a})`;
      ctx.fill();
    }
  }, [variant]);

  useEffect(() => {
    if (variant === "none") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw, variant]);

  if (variant === "none") return null;

  if (variant === "light") {
    return (
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--ag-surface-container)" }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-black" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-90" />
    </div>
  );
}
