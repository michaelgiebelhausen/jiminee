"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { clearMembershipCache } from "@/hooks/useMembership";

export function InviteAcceptFlow({ token }: { token: string }) {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  async function accept() {
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Could not accept the invite.");
    }
    clearMembershipCache();
    router.push("/board");
    router.refresh();
  }

  async function signupAndAccept(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;
      await accept();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went sideways — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function acceptExisting() {
    setBusy(true);
    setError(null);
    try {
      await accept();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept the invite.");
    } finally {
      setBusy(false);
    }
  }

  if (hasSession === null) return null;

  if (hasSession) {
    return (
      <div className="flex flex-col gap-3">
        {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
        <button
          onClick={acceptExisting}
          disabled={busy}
          className="h-10 rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
        >
          {busy ? "Joining…" : "Accept invite"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={signupAndAccept}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface p-5 shadow-rest"
    >
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Your name
        <input
          className="h-10 rounded-sm border border-line px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          maxLength={120}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Email
        <input
          type="email"
          className="h-10 rounded-sm border border-line px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Password
        <input
          type="password"
          className="h-10 rounded-sm border border-line px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="h-10 rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
      >
        {busy ? "Creating your account…" : "Sign up & join"}
      </button>
    </form>
  );
}
