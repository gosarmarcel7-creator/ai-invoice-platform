"use client";

import { useRef, type ReactNode } from "react";

/**
 * Google Antigravity 3D Tilt Card
 * 
 * Enhanced 3D perspective effects with:
 * - Smooth tilt-on-hover with parallax layers
 * - Glare highlight that follows cursor
 * - Subtle 3D rotation with depth
 * - Configurable max tilt angle
 * - Preserves 3D transform style
 * 
 * This creates the signature "floating in space" effect of Google Antigravity UI.
 */
export default function TiltCard({
  children,
  className = "",
  max = 12,
  glare = true,
  perspective = 1400,
  speed = 0.3,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
  perspective?: number;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    // Calculate rotation with configurable max angle
    const rx = (0.5 - py) * max * 2 * speed;
    const ry = (px - 0.5) * max * 2 * speed;

    // Apply 3D transform
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;

    // Update glare position
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.25), transparent 45%)`;
    }
  };

  const reset = () => {
    const el = ref.current;
    if (el) {
      el.style.transform = "rotateX(0) rotateY(0)";
    }
    if (glareRef.current) {
      glareRef.current.style.background = "transparent";
    }
  };

  return (
    <div 
      className="scene-3d"
      style={{ perspective: `${perspective}px` }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      <div 
        ref={ref} 
        className={`tilt relative overflow-hidden ${className}`}
        style={{
          transformStyle: "preserve-3d",
          transition: `transform ${300 * speed}ms ease-out`,
        }}
      >
        {children}
        {glare && (
          <div
            ref={glareRef}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            aria-hidden
            style={{
              opacity: 0.8,
              transition: "background 0.2s ease",
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Floating Card - Enhanced with Antigravity animations
 * Adds floating animation and depth to the tilt effect
 */
export function FloatingCard({
  children,
  className = "",
  max = 10,
  glare = true,
  float = true,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
  float?: boolean;
  delay?: number;
}) {
  return (
    <div 
      className={`relative ${float ? "float-slow" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <TiltCard 
        className={`card card-glass ${className}`}
        max={max}
        glare={glare}
        perspective={1400}
        speed={0.4}
      >
        {children}
      </TiltCard>
    </div>
  );
}

/**
 * Hoverable Card - Simplified hover effect without 3D tilt
 * For elements that don't need full 3D but still want depth
 */
export function HoverCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div 
      className={`card card-hover ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
