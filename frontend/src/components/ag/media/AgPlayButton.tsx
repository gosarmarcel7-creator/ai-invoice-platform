"use client";

import { Play } from "lucide-react";

export default function AgPlayButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-all hover:scale-105 hover:border-[var(--ag-primary-500)] hover:bg-[var(--ag-primary-500)]/20"
      aria-label="Play video"
    >
      <Play className="h-6 w-6 fill-white text-white transition-transform group-hover:scale-110" />
    </button>
  );
}
