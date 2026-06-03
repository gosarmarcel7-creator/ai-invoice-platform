"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Google Antigravity Cosmic Background
 * 
 * Features:
 * - Deep space radial nebula gradients
 * - Animated floating gradient orbs
 * - 3D Ring Particles using Houdini PaintWorklet (with CSS fallback)
 * - Canvas-based starfield with parallax depth
 * - Respects prefers-reduced-motion
 * 
 * This creates the signature "Zero Gravity" look of Google Antigravity
 * with modern CSS and Houdini PaintWorklet.
 */
export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workletRef = useRef<boolean>(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Register Houdini PaintWorklet for 3D ring particles
    const registerWorklet = () => {
      // Type assertion for CSS.paintWorklet which may not be in all TypeScript libs
      const cssPaintWorklet = (CSS as any).paintWorklet;
      if (typeof CSS !== 'undefined' && cssPaintWorklet) {
        try {
          // Define the worklet inline as a string
          const workletCode = `
            class RingParticles {
              static get inputProperties() {
                return ['--ring-density', '--ring-rotate-z', '--ring-speed'];
              }
              static get contextOptions() { return { pixelFormat: 'rgba8' }; }
              constructor() { this.rings = []; this.time = 0; }
              initRings(width, height, density = 0.5) {
                const count = Math.floor(density * 15);
                this.rings = [];
                for (let i = 0; i < count; i++) {
                  this.rings.push({
                    radius: Math.random() * 0.3 + 0.15,
                    thickness: Math.random() * 0.008 + 0.004,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                    color: this.getRingColor(i, count),
                  });
                }
              }
              getRingColor(index) {
                const colors = [[139/255,92/255,246/255],[168/255,85/255,247/255],[6/255,182/255,212/255],[59/255,130/255,246/255],[212/255,184/255,1],[99/255,102/255,241/255]];
                const color = colors[index % colors.length];
                return { r: color[0], g: color[1], b: color[2], a: 0.3 + Math.random() * 0.4 };
              }
              paint(ctx, geom, props) {
                const w = geom.width, h = geom.height, cx = w/2, cy = h/2;
                const density = parseFloat(props.get('--ring-density') || '0.5');
                const rotateZ = parseFloat(props.get('--ring-rotate-z') || '0');
                const speed = parseFloat(props.get('--ring-speed') || '1');
                if (this.rings.length === 0) this.initRings(w, h, density);
                this.time += 0.016 * speed;
                ctx.fillStyle = 'rgba(0,0,0,0)';
                ctx.fillRect(0,0,w,h);
                for (const ring of this.rings) {
                  const scale = Math.min(w,h) * ring.radius * 0.8;
                  const lw = scale * ring.thickness * 2;
                  const rot = ring.rotation + this.time * ring.rotationSpeed;
                  const alpha = ring.color.a * 0.6;
                  ctx.save();
                  ctx.translate(cx,cy);
                  ctx.rotate((rotateZ * Math.PI)/180);
                  ctx.rotate(rot);
                  ctx.strokeStyle = \`rgba(\${Math.floor(ring.color.r*255)},\${Math.floor(ring.color.g*255)},\${Math.floor(ring.color.b*255)},\${alpha})\`;
                  ctx.lineWidth = lw;
                  ctx.setLineDash([lw*0.5, lw*1.5]);
                  ctx.beginPath();
                  ctx.arc(0,0,scale*0.5,0,Math.PI*2);
                  ctx.stroke();
                  ctx.restore();
                }
              }
            }
            registerPaint('ring-particles', RingParticles);
          `;
          const blob = new Blob([workletCode], { type: 'text/javascript' });
          const url = URL.createObjectURL(blob);
          cssPaintWorklet.addModule(url).then(() => {
            workletRef.current = true;
          }).catch(() => {
            workletRef.current = false;
          });
        } catch {
          workletRef.current = false;
        }
      } else {
        workletRef.current = false;
      }
    };

    registerWorklet();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Star definition
    type Star = {
      x: number;
      y: number;
      z: number;
      r: number;
      hue: number;
      color: string;
    };

    let stars: Star[] = [];

    // Google Antigravity color palette for stars
    const COLORS = [
      "#d4b8ff", // Primary 300
      "#c4b5fd", // Violet 300
      "#99f6e4", // Cyan 200
      "#f0abfc", // Pink 300
      "#ffffff", // White
      "#8b5cf6", // Primary 500 (brighter stars)
      "#06b6d4", // Cyan 500
      "#a78bfa", // Violet 400
    ];

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Calculate star count based on viewport size
      const count = Math.min(200, Math.floor((w * h) / 8000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2, // depth 0.2..1.0
        r: Math.random() * 1.8 + 0.4,
        hue: Math.random(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };

    // Mouse tracking for parallax
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x: mouse.tx, y: mouse.ty });
    };

    let t = 0;
    let raf = 0;

    const render = () => {
      t += 0.003;
      
      // Smooth mouse following
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        // Parallax: deeper stars (higher z) move more with mouse + slow drift
        const px = s.x + mouse.x * 30 * s.z + Math.sin(t + s.x * 0.01) * 3 * s.z;
        const py = s.y + mouse.y * 30 * s.z + Math.cos(t + s.y * 0.01) * 3 * s.z;
        
        // Twinkle effect
        const twinkle = 0.3 + Math.abs(Math.sin(t * 2 + s.x * 0.1)) * 0.7;
        
        ctx.beginPath();
        ctx.globalAlpha = (0.4 + s.z * 0.5) * twinkle * s.r;
        ctx.fillStyle = s.color;
        
        // Glow effect
        ctx.shadowBlur = 12 * s.z * s.r;
        ctx.shadowColor = s.color;
        
        ctx.arc(px, py, s.r * s.z, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      
      // Draw some connecting lines between close stars for constellations
      if (!reduced && stars.length > 50) {
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = "rgba(212, 184, 255, 0.3)";
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < Math.min(i + 20, stars.length); j++) {
            const dx = stars[j].x - stars[i].x;
            const dy = stars[j].y - stars[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(
                stars[i].x + mouse.x * 30 * stars[i].z,
                stars[i].y + mouse.y * 30 * stars[i].z
              );
              ctx.lineTo(
                stars[j].x + mouse.x * 30 * stars[j].z,
                stars[j].y + mouse.y * 30 * stars[j].z
              );
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      
      raf = requestAnimationFrame(render);
    };

    build();
    
    if (!reduced) {
      window.addEventListener("mousemove", onMove);
      render();
    } else {
      // Draw static stars
      render();
      cancelAnimationFrame(raf);
    }

    const onResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      build();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      {/* Layer 1: Deep space base */}
      <div className="antigravity-space" aria-hidden />
      
      {/* Layer 2: Radial nebula clouds */}
      <div className="cosmos" aria-hidden />
      
      {/* Layer 3: Floating gradient orbs */}
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />
      <div className="orb orb-3" aria-hidden />
      
      {/* Layer 4: Houdini PaintWorklet Ring Particles (with CSS fallback) */}
      <div 
        className="ring-particles-container"
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        {/* PaintWorklet will paint here if supported */}
        <div 
          className="ring-particles-worklet"
          style={{
            position: 'absolute',
            inset: 0,
            // These custom properties control the worklet
            '--ring-color': '212, 184, 255',
            '--ring-density': '1',
            '--ring-rotate-x': mousePosition.x * 10,
            '--ring-rotate-y': mousePosition.y * 10,
            '--ring-rotate-z': '0',
            '--ring-size': '1',
            '--ring-speed': '1',
          } as React.CSSProperties}
        />
        
        {/* CSS Fallback for browsers without PaintWorklet */}
        {!workletRef.current && <RingParticlesCSS />}
      </div>
      
      {/* Layer 5: Canvas starfield with parallax */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[1] h-full w-full"
      />
    </>
  );
}

/**
 * CSS-based Ring Particles fallback
 * Creates animated ring particles using pure CSS
 * for browsers that don't support Houdini PaintWorklet
 */
function RingParticlesCSS() {
  return (
    <>
      {/* Generate multiple ring particles with CSS */}
      {Array.from({ length: 18 }).map((_, i) => {
        const size = Math.random() * 200 + 100;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const duration = Math.random() * 20 + 20;
        const delay = Math.random() * 10;
        
        return (
          <div
            key={i}
            className="ring-particle-css"
            style={{
              position: "absolute",
              width: `${size}px`,
              height: `${size}px`,
              top: `${top}%`,
              left: `${left}%`,
              border: `1px solid rgba(212, 184, 255, ${Math.random() * 0.3 + 0.15})`,
              borderRadius: "50%",
              animation: `spin-slow ${duration}s linear infinite`,
              animationDelay: `${delay}s`,
              opacity: Math.random() * 0.4 + 0.2,
              transformOrigin: "center",
              transformStyle: "preserve-3d",
            }}
          />
        );
      })}
      
      {/* Large pulsing ring in center */}
      <div 
        className="pulse-ring"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "500px",
          height: "500px",
          border: "1px solid rgba(139, 92, 246, 0.15)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          animation: "pulse 5s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      
      {/* Additional rotating rings */}
      <div 
        className="ring-particle-css"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "300px",
          height: "300px",
          border: "1px solid rgba(6, 182, 212, 0.25)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%) rotateX(70deg) rotateY(30deg)",
          animation: "spin-slow 40s linear infinite reverse",
          pointerEvents: "none",
          transformStyle: "preserve-3d",
        }}
      />
      
      <div 
        className="ring-particle-css"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "350px",
          height: "350px",
          border: "1px solid rgba(168, 85, 247, 0.2)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%) rotateX(45deg) rotateY(-20deg)",
          animation: "spin-slow 35s linear infinite",
          pointerEvents: "none",
          transformStyle: "preserve-3d",
        }}
      />
    </>
  );
}
