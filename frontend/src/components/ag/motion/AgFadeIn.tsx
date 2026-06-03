"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Direction = "bottom" | "top" | "left" | "right";

const variants = {
  bottom: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } },
  top: { initial: { opacity: 0, y: -24 }, animate: { opacity: 1, y: 0 } },
  left: { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 } },
  right: { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 } },
} as const;

export default function AgFadeIn({
  children,
  delay = 0,
  className = "",
  from = "bottom",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  from?: Direction;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-48px" });
  const v = variants[from];

  return (
    <motion.div
      ref={ref}
      initial={v.initial}
      animate={inView ? v.animate : v.initial}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
