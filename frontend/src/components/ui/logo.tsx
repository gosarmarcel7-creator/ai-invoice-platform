import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl",
        className
      )}
    >
      <Image
        src="/brand/logo-icon.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="40px"
        className="object-contain"
      />
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/15" />
    </span>
  );
}

export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWord && (
        <span className="inline-flex items-baseline gap-1">
          <span className="text-[1.35rem] font-semibold tracking-tight text-ink">DocuExtract</span>
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-brand-bright/80">
            AI
          </span>
        </span>
      )}
    </span>
  );
}
