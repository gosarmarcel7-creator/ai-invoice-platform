"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadZone({
  onUpload,
  busy,
}: {
  onUpload: (files: FileList) => void;
  busy?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files?.length) onUpload(e.dataTransfer.files);
      }}
      className={cn(
        "glass grain group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-6 py-8 text-center transition-all duration-300",
        drag ? "border-brand/70 bg-brand/5" : "border-line-strong hover:border-ink-faint"
      )}
    >
      <motion.div
        animate={drag ? { scale: 1.1 } : { scale: 1 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-gradient-to-b from-black/[0.05] to-transparent text-brand-bright"
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
        {drag && (
          <span className="absolute inset-0 animate-pulse-ring rounded-2xl border border-brand/50" />
        )}
      </motion.div>

      <h3 className="mt-4 text-sm font-semibold text-ink">
        {busy ? "Uploading…" : drag ? "Drop to upload" : "Drag invoices here"}
      </h3>
      <p className="mt-1 text-xs text-ink-mute">
        PDF, PNG, or JPG — or{" "}
        <button
          onClick={() => inputRef.current?.click()}
          className="focus-ring rounded font-medium text-brand-bright hover:underline"
        >
          browse files
        </button>
      </p>

      <div className="mt-4 flex items-center gap-2 text-[0.68rem] text-ink-faint">
        <FileText className="h-3.5 w-3.5" /> Extraction starts automatically
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onUpload(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
