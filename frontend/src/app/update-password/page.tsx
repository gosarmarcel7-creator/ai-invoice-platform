"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { Aurora } from "@/components/landing/aurora";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!isSupabaseConfigured || !supabase) return;

    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setReady(Boolean(data.session));
    });

    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password too short", { description: "Use at least 8 characters." });
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const supabase = getSupabaseBrowser();
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Authentication unavailable", {
        description: "Add your Supabase keys to .env.local to change passwords.",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password updated", {
        description: "You can now sign in with your new password.",
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh lg:grid-cols-2">
      <div className="relative flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="focus-ring rounded-lg">
            <Logo />
          </Link>
          <Link
            href="/login"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-ink-mute transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-semibold tracking-tight">Set a new password</h1>
            <p className="mt-2 text-sm text-ink-mute">
              This page opens from your password reset email. If the session is missing, request a
              fresh reset link.
            </p>

            {!isSupabaseConfigured && (
              <div className="mt-5 rounded-xl border border-review/30 bg-review/10 px-4 py-3 text-[0.8rem] leading-relaxed text-review">
                Supabase is not configured yet. Add your keys to{" "}
                <code className="font-mono">.env.local</code> to enable password updates.
              </div>
            )}

            {!ready && isSupabaseConfigured && (
              <div className="mt-5 rounded-xl border border-review/30 bg-review/10 px-4 py-3 text-[0.8rem] leading-relaxed text-review">
                No recovery session was detected. Open the link from your email again or request a
                new reset link.
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">
                  New password
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="focus-ring h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent/50"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">
                  Confirm password
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="focus-ring h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent/50"
                  />
                </div>
              </label>

              <Button type="submit" size="lg" loading={loading} className="group w-full" disabled={!ready}>
                Update password
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-mute">
              Need a new link?{" "}
              <Link href="/forgot-password" className="focus-ring rounded font-medium text-brand-bright hover:underline">
                Reset again
              </Link>
            </p>
          </div>
        </div>
        <div className="h-6" />
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-base-2 lg:block">
        <Aurora />
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(80%_70%_at_60%_30%,black,transparent)]" />
        <div className="relative flex h-full flex-col justify-center px-14">
          <h2 className="max-w-md text-balance text-4xl font-semibold leading-tight tracking-tight">
            Secure recovery. <span className="text-accent">No extra workflow.</span>
          </h2>
          <p className="mt-4 max-w-sm text-ink-soft">
            The recovery link is generated by the app, delivered by Mailjet, and finalized by
            Supabase Auth when the link is opened.
          </p>
        </div>
      </aside>
    </main>
  );
}
