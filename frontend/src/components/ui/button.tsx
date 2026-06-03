"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "focus-ring relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 cursor-pointer whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_10px_28px_-10px_rgba(10,10,10,0.45)] hover:bg-brand-deep hover:shadow-[0_14px_38px_-12px_rgba(10,10,10,0.55)]",
  secondary:
    "bg-surface text-ink border border-line shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:bg-surface-2 hover:border-line-strong",
  outline:
    "border border-line-strong text-ink-soft hover:text-ink hover:border-ink-faint hover:bg-black/[0.03]",
  ghost: "text-ink-soft hover:text-ink hover:bg-black/[0.04]",
  danger:
    "bg-rejected/12 text-rejected border border-rejected/25 hover:bg-rejected/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.82rem]",
  md: "h-11 px-5 text-[0.92rem]",
  lg: "h-[3.25rem] px-7 text-[1rem]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: CommonProps & { href: string } & React.ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
