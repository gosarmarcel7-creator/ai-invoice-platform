"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  UploadCloud, X, CheckCircle2, AlertCircle,
  ArrowRight, Loader2, FileText, File,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
      <div>
        <h1 className="text-xl font-black text-stone-900">Upload Invoices</h1>
        <p className="text-sm text-stone-400 mt-0.5">Upload any invoice format. AI extracts all key data automatically.</p>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: drop zone + queue */}
        <div className="xl:col-span-2 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) add(e.dataTransfer.files); }}
            onClick={() => ref.current?.click()}
            className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-150 ${
              dragging ? "border-stone-400 bg-stone-100" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
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
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                dragging ? "bg-stone-200" : "bg-stone-100"
              }`}>
                <UploadCloud className={`w-7 h-7 ${dragging ? "text-stone-700" : "text-stone-400"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-700">
                  {dragging ? "Drop files to upload" : "Drag & drop invoices here"}
                </p>
                <p className="text-sm text-stone-400 mt-1">
                  or <span className="text-stone-700 font-semibold underline underline-offset-2">browse</span> to choose files
                </p>
              </div>
              <p className="text-xs text-stone-400">PDF, TXT, PNG, JPG — up to 20 MB each</p>
            </div>
          </div>

          {/* Queue */}
          <AnimatePresence>
            {queue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
                  <p className="text-sm font-bold text-stone-800">
                    {queue.length} file{queue.length !== 1 ? "s" : ""} selected
                  </p>
                  {!uploading && !allDone && (
                    <button
                      onClick={() => setQueue([])}
                      className="text-xs text-stone-400 hover:text-red-600 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <ul className="max-h-64 overflow-y-auto divide-y divide-stone-50">
                  {queue.map((item) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 px-5 py-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-stone-500">{ext(item.file.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{item.file.name}</p>
                        <p className="text-xs text-stone-400">{fmt(item.file.size)}</p>
                      </div>
                      <div className="shrink-0">
                        {item.status === "pending" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); remove(item.id); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-stone-100"
                          >
                            <X className="w-3.5 h-3.5 text-stone-400 hover:text-red-500" />
                          </button>
                        )}
                        {item.status === "uploading" && <Loader2 className="w-4 h-4 text-stone-500 animate-spin" />}
                        {item.status === "done"      && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        {item.status === "error"     && <AlertCircle  className="w-4 h-4 text-red-500" />}
                      </div>
                    </motion.li>
                  ))}
                </ul>

                <div className="px-5 py-3.5 border-t border-stone-100 flex items-center justify-between bg-stone-50">
                  <p className="text-xs text-stone-400">
                    {allDone
                      ? "All files uploaded — AI processing started."
                      : `${pendingCount} file${pendingCount !== 1 ? "s" : ""} ready to upload`}
                  </p>
                  {allDone ? (
                    <button
                      onClick={() => router.push("/review")}
                      className="btn btn-primary text-sm"
                    >
                      View Review Queue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={upload}
                      disabled={uploading || !pendingCount}
                      className="btn btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {uploading
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                        : <><UploadCloud className="w-3.5 h-3.5" /> Start AI Extraction</>}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: info panels */}
        <div className="space-y-4">
          {/* File specs */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-stone-800 mb-4">File Requirements</h3>
            <div className="space-y-3">
              {TIPS.map((tip) => (
                <div key={tip.title} className="flex items-start justify-between gap-3">
                  <span className="text-xs text-stone-400 font-medium">{tip.title}</span>
                  <span className="text-xs font-semibold text-stone-700 text-right">{tip.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-stone-800 mb-4">How it works</h3>
            <div className="space-y-4">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="flex gap-3">
                  <span className="text-xs font-black text-stone-300 mt-0.5 shrink-0 w-6">{item.step}</span>
                  <div>
                    <p className="text-xs font-bold text-stone-700 mb-0.5">{item.title}</p>
                    <p className="text-xs text-stone-400 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported formats */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-stone-800 mb-3">Supported Formats</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { ext: "PDF", desc: "Most common" },
                { ext: "TXT", desc: "Plain text" },
                { ext: "PNG", desc: "Scanned image" },
                { ext: "JPG", desc: "Photograph" },
              ].map((f) => (
                <div key={f.ext} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-100">
                  <div className="w-7 h-7 rounded-md bg-stone-200 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-stone-600">{f.ext}</span>
                  </div>
                  <span className="text-xs text-stone-500">{f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
