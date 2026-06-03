"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const fade = { 
  initial: { opacity: 0, y: 20, scale: 0.97 }, 
  animate: { opacity: 1, y: 0, scale: 1 } 
};

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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-sm"
      {...fade}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 flex flex-col items-center"
      >
        <div className="relative mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ag-gradient-primary)] shadow-[0_0_28px_-4px_rgba(139,92,246,0.9)]">
          <div className="absolute inset-0 rounded-2xl bg-[var(--ag-gradient-primary)] opacity-50 blur-xl" />
          <Sparkles className="relative h-6 w-6 text-white" />
        </div>
        <h1 className="font-[var(--font-display)] text-xl font-bold text-white">DocuExtract</h1>
        <p className="mt-0.5 text-sm text-[var(--ag-text-tertiary)]">AI-powered invoice processing</p>
      </motion.div>

      {/* Auth Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card card-glow p-6"
      >
        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex gap-1 rounded-xl border border-[var(--ag-border)] bg-[var(--ag-surface-glass)] p-1"
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-[var(--ag-gradient-primary)] text-white shadow-[0_4px_14px_-4px_rgba(139,92,246,0.8)]"
                  : "text-[var(--ag-text-tertiary)] hover:text-white"
              }`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div {...fade} transition={{ delay: 0.25 }}>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--ag-text-secondary)]">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="field-input"
            />
          </motion.div>

          <motion.div {...fade} transition={{ delay: 0.3 }}>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--ag-text-secondary)]">
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
                className="field-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ag-text-tertiary)] hover:text-white"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>

          {/* Messages */}
          <motion.div {...fade} transition={{ delay: 0.35 }}>
            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {success}
              </p>
            )}
          </motion.div>

          {/* Submit */}
          <motion.button
            {...fade}
            transition={{ delay: 0.4 }}
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />
                {mode === "signin" ? "Signing in…" : "Creating account…"}</>
            ) : (
              mode === "signin" ? "Sign in" : "Create account"
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Footer */}
      <motion.p 
        {...fade}
        transition={{ delay: 0.45 }}
        className="mt-4 text-center text-xs text-[var(--ag-text-tertiary)]"
      >
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          className="font-semibold text-white hover:text-[var(--ag-violet-400)]"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </motion.p>
    </motion.div>
  );
}
