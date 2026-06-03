"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  UploadCloud, X, CheckCircle2, AlertCircle,
  ArrowRight, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { HoverCard } from "@/components/TiltCard";

type FileStatus = "pending" | "uploading" | "done" | "error";
interface QueueItem { file: File; id: string; status: FileStatus; }

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function ext(name: string) {
  return name.split(".").pop()?.toUpperCase() ?? "FILE";
}

const fade = { 
  initial: { opacity: 0, y: 14 }, 
  animate: { opacity: 1, y: 0 } 
};

const TIPS = [
  { title: "Accepted formats", value: "PDF, TXT, PNG, JPG" },
  { title: "Max file size", value: "20 MB per file" },
  { title: "Processing time", value: "~5 seconds / file" },
  { title: "Batch uploads", value: "Unlimited files at once" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Upload", body: "Drop any invoice format — PDF, image, or text. Multiple files supported." },
  { step: "02", title: "AI Extracts", body: "Mistral AI reads the document and pulls vendor, amounts, dates, and line items." },
  { step: "03", title: "Review", body: "Validate extracted data in the review queue, then approve with one click." },
];

export default function UploadPage() {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const add = useCallback((files: FileList | File[]) => {
    const items = Array.from(files).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      status: "pending" as FileStatus,
    }));
    setQueue((q) => [...q, ...items]);
    setAllDone(false);
  }, []);

  const remove = (id: string) => setQueue((q) => q.filter((i) => i.id !== id));

  const upload = async () => {
    const pending = queue.filter((i) => i.status === "pending");
    if (!pending.length) return;
    setUploading(true);
    for (const item of pending) {
      setQueue((q) => q.map((i) => i.id === item.id ? { ...i, status: "uploading" } : i));
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        await api.post("/api/invoices/", fd);
        setQueue((q) => q.map((i) => i.id === item.id ? { ...i, status: "done" } : i));
      } catch {
        setQueue((q) => q.map((i) => i.id === item.id ? { ...i, status: "error" } : i));
        toast.error(`Failed: ${item.file.name}`);
      }
    }
    setUploading(false);
    const hasErrors = queue.some((i) => i.status === "error");
    if (!hasErrors) {
      setAllDone(true);
      toast.success(`${pending.length} file${pending.length !== 1 ? "s" : ""} queued for AI processing.`);
    }
  };

  const pendingCount = queue.filter((i) => i.status === "pending").length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <motion.div {...fade} className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">
            Upload Invoices
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ag-text-tertiary)]">
            Upload any invoice format. AI extracts all key data automatically.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left: drop zone + queue */}
        <div className="space-y-4 xl:col-span-2">
          {/* Drop zone - Antigravity style */}
          <motion.div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) add(e.dataTransfer.files); }}
            onClick={() => ref.current?.click()}
            whileHover={{ scale: 1.01 }}
            className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300 ${
              dragging
                ? "border-[var(--ag-primary-500)] bg-[var(--ag-primary-500)]/10 shadow-[var(--ag-shadow-glow)]"
                : "border-[var(--ag-border-strong)] bg-[var(--ag-surface-glass)] hover:border-[var(--ag-border-glow)] hover:bg-white/[0.04]"
            }`}
          >
            <input
              ref={ref}
              type="file"
              multiple
              className="sr-only"
              accept=".pdf,.txt,.png,.jpg,.jpeg"
              onChange={(e) => e.target.files && add(e.target.files)}
            />
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className={`grid h-16 w-16 place-items-center rounded-2xl transition-all ${
                  dragging 
                    ? "bg-[var(--ag-gradient-primary)] scale-110" 
                    : "border border-[var(--ag-border)] bg-[var(--ag-gradient-surface)]"
                }`}
                animate={dragging ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <UploadCloud className={`h-7 w-7 ${dragging ? "text-white" : "text-[var(--ag-primary-400)]"}`} />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {dragging ? "Drop files to upload" : "Drag & drop invoices here"}
                </p>
                <p className="mt-1 text-sm text-[var(--ag-text-tertiary)]">
                  or <span className="font-semibold text-[var(--ag-violet-400)] underline underline-offset-2">browse</span> to choose files
                </p>
              </div>
              <p className="text-xs text-[var(--ag-text-disabled)]">PDF, TXT, PNG, JPG — up to 20 MB each</p>
            </div>
          </motion.div>

          {/* Queue */}
          <AnimatePresence>
            {queue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card card-glow overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-[var(--ag-border)] px-5 py-3.5">
                  <p className="text-sm font-bold text-white">
                    {queue.length} file{queue.length !== 1 ? "s" : ""} selected
                  </p>
                  {!uploading && !allDone && (
                    <button onClick={() => setQueue([])} className="text-xs text-[var(--ag-text-tertiary)] transition-colors hover:text-rose-400">
                      Clear all
                    </button>
                  )}
                </div>

                <ul className="max-h-64 divide-y divide-white/5 overflow-y-auto">
                  {queue.map((item) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="group flex items-center gap-3 px-5 py-3"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--ag-border)] bg-[var(--ag-gradient-surface)]">
                        <span className="text-[10px] font-black text-[var(--ag-text-secondary)]">{ext(item.file.name)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{item.file.name}</p>
                        <p className="text-xs text-[var(--ag-text-tertiary)]">{fmt(item.file.size)}</p>
                      </div>
                      <div className="shrink-0">
                        {item.status === "pending" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); remove(item.id); }}
                            className="rounded p-1 opacity-0 transition-opacity hover:bg-white/5 group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5 text-[var(--ag-text-tertiary)] hover:text-rose-400" />
                          </button>
                        )}
                        {item.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-[var(--ag-violet-400)]" />}
                        {item.status === "done"      && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        {item.status === "error"     && <AlertCircle className="h-4 w-4 text-rose-400" />}
                      </div>
                    </motion.li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-[var(--ag-border)] bg-[var(--ag-surface-glass)] px-5 py-3.5">
                  <p className="text-xs text-[var(--ag-text-tertiary)]">
                    {allDone
                      ? "All files uploaded — AI processing started."
                      : `${pendingCount} file${pendingCount !== 1 ? "s" : ""} ready to upload`}
                  </p>
                  {allDone ? (
                    <button onClick={() => router.push("/review")} className="btn btn-primary">
                      View Review Queue <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button onClick={upload} disabled={uploading || !pendingCount} className="btn btn-primary">
                      {uploading
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                        : <><UploadCloud className="h-3.5 w-3.5" /> Start AI Extraction</>}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: info panels */}
        <div className="space-y-4">
          {/* File Requirements */}
          <motion.div {...fade} transition={{ delay: 0.1 }}>
            <HoverCard className="p-5">
              <h3 className="mb-4 text-sm font-bold text-white">File Requirements</h3>
              <div className="space-y-3">
                {TIPS.map((tip, i) => (
                  <div key={tip.title} className="flex items-start justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--ag-text-tertiary)]">{tip.title}</span>
                    <span className="text-right text-xs font-semibold text-white">{tip.value}</span>
                  </div>
                ))}
              </div>
            </HoverCard>
          </motion.div>

          {/* How it works */}
          <motion.div {...fade} transition={{ delay: 0.15 }}>
            <HoverCard className="p-5">
              <h3 className="mb-4 text-sm font-bold text-white">How it works</h3>
              <div className="space-y-4">
                {HOW_IT_WORKS.map((item, i) => (
                  <div key={item.step} className="flex gap-3">
                    <span className="gradient-text mt-0.5 w-6 shrink-0 font-[var(--font-display)] text-xs font-black">
                      {item.step}
                    </span>
                    <div>
                      <p className="mb-0.5 text-xs font-bold text-white">{item.title}</p>
                      <p className="text-xs leading-relaxed text-[var(--ag-text-tertiary)]">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </HoverCard>
          </motion.div>

          {/* Supported Formats */}
          <motion.div {...fade} transition={{ delay: 0.2 }}>
            <HoverCard className="p-5">
              <h3 className="mb-3 text-sm font-bold text-white">Supported Formats</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { ext: "PDF", desc: "Most common" },
                  { ext: "TXT", desc: "Plain text" },
                  { ext: "PNG", desc: "Scanned image" },
                  { ext: "JPG", desc: "Photograph" },
                ].map((f, i) => (
                  <motion.div 
                    key={f.ext}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-2 rounded-lg border border-[var(--ag-border)] bg-[var(--ag-surface-glass)] p-2"
                  >
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--ag-gradient-surface)]">
                      <span className="text-[9px] font-black text-[var(--ag-text-secondary)]">{f.ext}</span>
                    </div>
                    <span className="text-xs text-[var(--ag-text-tertiary)]">{f.desc}</span>
                  </motion.div>
                ))}
              </div>
            </HoverCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
