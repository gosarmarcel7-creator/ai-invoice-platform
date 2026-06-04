"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Aurora } from "@/components/landing/aurora";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

const benefits = [
  "AI extraction with confidence scoring",
  "Human-in-the-loop review queue",
  "Real-time spend & volume analytics",
  "Line-item detail, ready to export",
];

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOST ?? "a-app.docuextract.xyz";
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowser();
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Authentication unavailable", {
        description: "Add your Supabase keys to .env.local to sign in.",
      });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created", { description: "Welcome to DocuExtract." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      const explicitNext = params.get("next");
      const isAdminHost = window.location.hostname.toLowerCase() === adminHost.toLowerCase();
      router.push(isAdminHost ? "/admin" : explicitNext || "/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="focus-ring rounded-lg">
            <Logo />
          </Link>
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-ink-mute transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-ink-mute">
              {mode === "signup"
                ? "Start turning invoices into structured data."
                : "Sign in to your DocuExtract workspace."}
            </p>

            {!isSupabaseConfigured && (
              <div className="mt-5 rounded-xl border border-review/30 bg-review/10 px-4 py-3 text-[0.8rem] leading-relaxed text-review">
                Supabase isn’t configured yet. Add your keys to{" "}
                <code className="font-mono">.env.local</code> to enable sign in.
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <Field
                icon={<Mail className="h-4 w-4" />}
                label="Work email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
              <div>
                <label className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">
                  Password
                </label>
                <div className="group relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    minLength={6}
                    className="focus-ring h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-11 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-mute hover:text-ink"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" loading={loading} className="group w-full">
                {mode === "signup" ? "Create account" : "Sign in"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>

            {mode === "signin" && (
              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="focus-ring rounded text-sm font-medium text-brand-bright hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-ink-mute">
              {mode === "signup" ? "Already have an account?" : "New to DocuExtract?"}{" "}
              <button
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="focus-ring rounded font-medium text-brand-bright hover:underline"
              >
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>

          </motion.div>
        </div>
        <div className="h-6" />
      </div>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden border-l border-line bg-base-2 lg:block">
        <Aurora />
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(80%_70%_at_60%_30%,black,transparent)]" />
        <div className="relative flex h-full flex-col justify-center px-14">
          <AnimatePresence mode="wait">
            <motion.h2
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="max-w-md text-balance text-4xl font-semibold leading-tight tracking-tight"
            >
              Invoices in.{" "}
              <span className="text-accent">
                Clean data out.
              </span>
            </motion.h2>
          </AnimatePresence>
          <p className="mt-4 max-w-sm text-ink-soft">
            DocuExtract reads, structures, and verifies every document — so your team reviews
            exceptions instead of typing rows.
          </p>
          <ul className="mt-8 space-y-3">
            {benefits.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3 text-sm text-ink-soft"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-approved/15 text-approved">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {b}
              </motion.li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="focus-ring h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent/50"
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-base" />}>
      <LoginInner />
    </Suspense>
  );
}
