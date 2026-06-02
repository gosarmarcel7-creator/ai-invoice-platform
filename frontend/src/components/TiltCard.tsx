"use client";

import { useRef, type ReactNode } from "react";

/**
 * 3D tilt-on-hover wrapper. Tracks the pointer and rotates the child in
 * perspective space, with an optional glare highlight. Pure CSS transforms.
 */
export default function TiltCard({
  children,
  className = "",
  max = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * max * 2;
    const ry = (px - 0.5) * max * 2;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.18), transparent 55%)`;
    }
  };

  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "rotateX(0) rotateY(0)";
    if (glareRef.current) glareRef.current.style.background = "transparent";
  };

  return (
    <div className="scene-3d" onMouseMove={handleMove} onMouseLeave={reset}>
      <div ref={ref} className={`tilt relative ${className}`}>
        {children}
        {glare && (
          <div
            ref={glareRef}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
