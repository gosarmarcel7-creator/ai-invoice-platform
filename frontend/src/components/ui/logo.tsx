import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl",
        className
      )}
    >
      <svg viewBox="0 0 40 40" fill="none" className="h-full w-full">
        <defs>
          <linearGradient id="docuextract-surface" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f766e" />
            <stop offset="0.58" stopColor="#0ea5a4" />
            <stop offset="1" stopColor="#67e8f9" />
          </linearGradient>
          <linearGradient id="docuextract-page" x1="13" y1="10" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.96" />
            <stop offset="1" stopColor="white" stopOpacity="0.82" />
          </linearGradient>
        </defs>
        <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" fill="#072f33" />
        <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" fill="url(#docuextract-surface)" fillOpacity="0.92" />
        <path
          d="M12.5 10.5h11.5l4.5 4.4v13.6c0 1.1-.9 2-2 2h-14c-1.1 0-2-.9-2-2v-16c0-1.1.9-2 2-2Z"
          fill="url(#docuextract-page)"
        />
        <path d="M24 10.5v4.2c0 1 .8 1.8 1.8 1.8H30" fill="white" fillOpacity="0.45" />
        <path
          d="M15 18.2h9.7M15 22h6.5M15 25.8h4.6"
          stroke="#0f766e"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="m28.8 11.3.8 1.7 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8.8-1.7Z"
          fill="#cffafe"
        />
      </svg>
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
