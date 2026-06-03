"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface AgBackgroundProps {
  variant?: "full" | "dimmed";
}

export default function AgBackground({ variant = "full" }: AgBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars = reduced ? 80 : 160;
    for (let i = 0; i < stars; i++) {
      const x = ((i * 7919) % 1000) / 1000 * w;
      const y = ((i * 6271) % 1000) / 1000 * h;
      const r = ((i * 3) % 7) / 7 * 1.2 + 0.3;
      const a = 0.15 + ((i * 5) % 10) / 30;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", onMove);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [draw]);

  const opacity = variant === "dimmed" ? 0.5 : 1;
  const mx = mouse.x;
  const my = mouse.y;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ opacity }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(6,182,212,0.1), transparent 50%), #07080f",
        }}
      />
      <div
        className="absolute h-[520px] w-[520px] rounded-full blur-[100px] transition-transform duration-[2000ms] ease-out"
        style={{
          left: `${15 + mx * 8}%`,
          top: `${5 + my * 6}%`,
          background: "radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)",
        }}
      />
      <div
        className="absolute h-[400px] w-[400px] rounded-full blur-[90px] transition-transform duration-[2000ms] ease-out"
        style={{
          right: `${10 + (1 - mx) * 6}%`,
          bottom: `${15 + (1 - my) * 5}%`,
          background: "radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.03] opacity-40"
        style={{ boxShadow: "inset 0 0 80px rgba(139,92,246,0.05)" }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
