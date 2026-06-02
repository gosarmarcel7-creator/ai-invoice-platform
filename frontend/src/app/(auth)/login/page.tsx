"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center mb-8">
        <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center mb-3">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-stone-900">DocuExtract</h1>
        <p className="text-sm text-stone-400 mt-0.5">AI-powered invoice processing</p>
      </div>

      <div className="card p-6">
        <div className="flex gap-1 p-1 bg-stone-100 rounded-lg mb-6">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />
                {mode === "signin" ? "Signing in…" : "Creating account…"}</>
            ) : (
              mode === "signin" ? "Sign in" : "Create account"
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-stone-400 mt-4">
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          className="text-stone-700 font-semibold hover:text-stone-900"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
