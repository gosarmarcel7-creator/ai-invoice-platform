"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed full-screen cosmic backdrop:
 *  - CSS radial nebula + grid (.cosmos)
 *  - three drifting gradient orbs (.orb)
 *  - a canvas star/particle field with parallax depth (gives a 3D feel)
 * Lightweight — no WebGL dependency, respects prefers-reduced-motion.
 */
export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Star = { x: number; y: number; z: number; r: number; hue: number };
    let stars: Star[] = [];

    const COLORS = ["#a5b4fc", "#c4b5fd", "#67e8f9", "#f0abfc", "#ffffff"];

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(170, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 1 + 0.2, // depth 0.2..1.2
        r: Math.random() * 1.6 + 0.3,
        hue: Math.random(),
      }));
    };

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    let t = 0;
    let raf = 0;
    const render = () => {
      t += 0.0025;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        // parallax: deeper stars (higher z) move more with mouse + slow drift
        const px = s.x + mouse.x * 26 * s.z + Math.sin(t + s.x) * 2 * s.z;
        const py = s.y + mouse.y * 26 * s.z + Math.cos(t + s.y) * 2 * s.z;
        const twinkle = 0.4 + Math.abs(Math.sin(t * 3 + s.x)) * 0.6;
        const color = COLORS[Math.floor(s.hue * COLORS.length)];
        ctx.beginPath();
        ctx.globalAlpha = (0.25 + s.z * 0.55) * twinkle;
        ctx.fillStyle = color;
        ctx.shadowBlur = 8 * s.z;
        ctx.shadowColor = color;
        ctx.arc(px, py, s.r * s.z, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(render);
    };

    build();
    if (!reduced) {
      window.addEventListener("mousemove", onMove);
      render();
    } else {
      // draw a static frame
      render();
      cancelAnimationFrame(raf);
    }
    const onResize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); build(); };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <div className="cosmos" aria-hidden />
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />
      <div className="orb orb-3" aria-hidden />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[1] h-full w-full"
      />
    </>
  );
}
