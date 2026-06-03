"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AgGlassCard from "@/components/ag/cards/AgGlassCard";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSuccess("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative z-10 w-full max-w-sm"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ag-accent)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor" aria-hidden>
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[var(--ag-on-surface)]">DocuExtract</h1>
        <p className="mt-0.5 text-sm text-[var(--ag-text-tertiary)]">AI-powered invoice processing</p>
      </div>

      <AgGlassCard glow className="p-6">
        <div className="mb-6 flex gap-1 rounded-xl border border-[var(--ag-outline)] bg-[var(--ag-surface-container)] p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-[var(--ag-primary)] text-white"
                  : "text-[var(--ag-text-tertiary)] hover:text-[var(--ag-on-surface)]"
              }`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--ag-on-surface-variant)]">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="ag-field-input"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--ag-on-surface-variant)]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="ag-field-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ag-text-tertiary)] hover:text-[var(--ag-on-surface)]"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {success}
            </p>
          )}

          <button type="submit" disabled={loading} className="ag-btn-primary w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "signin" ? "Signing in…" : "Creating account…"}
              </>
            ) : (
              mode === "signin" ? "Sign in" : "Create account"
            )}
          </button>
        </form>
      </AgGlassCard>

      <p className="mt-4 text-center text-xs text-[var(--ag-text-tertiary)]">
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          className="ag-link"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </motion.div>
  );
}
