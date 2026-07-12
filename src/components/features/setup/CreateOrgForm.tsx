"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { clearMembershipCache } from "@/hooks/useMembership";

export function CreateOrgForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("organizations").insert({ name });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    clearMembershipCache();
    router.push("/board");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-sm flex-col gap-3 rounded-md border border-line bg-surface p-6 shadow-rest"
    >
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Organization name
        <input
          className="h-10 rounded-sm border border-line px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Marketing Dept"
          required
          maxLength={255}
        />
      </label>
      {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="h-10 rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
      >
        {busy ? "Creating…" : "Create organization"}
      </button>
    </form>
  );
}
