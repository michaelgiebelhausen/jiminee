"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { clearMembershipCache } from "@/hooks/useMembership";

type Mode = "signin" | "signup" | "magic";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/board";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}${next}` },
        });
        if (error) throw error;
        setMessage("Check your email — a sign-in link is on its way.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        clearMembershipCache();
        router.push(next);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        clearMembershipCache();
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went sideways — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-sm flex-col gap-3 rounded-md border border-line bg-surface p-6 shadow-rest"
    >
      <h1 className="font-display text-xl font-bold">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>

      {mode === "signup" && (
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Your name
          <input
            className="h-10 rounded-sm border border-line bg-surface px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={120}
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm font-semibold">
        Email
        <input
          type="email"
          className="h-10 rounded-sm border border-line bg-surface px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      {mode !== "magic" && (
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Password
          <input
            type="password"
            className="h-10 rounded-sm border border-line bg-surface px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
      )}

      {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
      {message && (
        <p className="rounded-sm bg-success-soft px-3 py-2 text-sm text-success">{message}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="h-10 rounded-sm bg-primary font-bold text-on-primary transition-colors hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
      >
        {busy
          ? "One moment…"
          : mode === "signup"
            ? "Sign up"
            : mode === "magic"
              ? "Email me a sign-in link"
              : "Sign in"}
      </button>

      <div className="flex justify-between text-sm text-ink-secondary">
        <button
          type="button"
          className="underline underline-offset-2 hover:text-primary"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "Have an account? Sign in" : "New here? Sign up"}
        </button>
        <button
          type="button"
          className="underline underline-offset-2 hover:text-primary"
          onClick={() => setMode(mode === "magic" ? "signin" : "magic")}
        >
          {mode === "magic" ? "Use a password" : "Magic link"}
        </button>
      </div>
    </form>
  );
}
