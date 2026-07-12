"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export function NudgeRespond({ nudgeId, taskId }: { nudgeId: string; taskId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "confirm" | "release") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/nudges/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nudgeId, action }),
      });
      if (!res.ok) throw new Error();
      if (action === "confirm") track("nudge_confirmed");
      router.push(action === "confirm" ? `/task/${taskId}` : "/board");
      router.refresh();
    } catch {
      setError("That didn't go through — give it another tap.");
      setBusy(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
      <button
        onClick={() => respond("confirm")}
        disabled={busy !== null}
        className="h-12 rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
      >
        {busy === "confirm" ? "One sec…" : "Still on it"}
      </button>
      <button
        onClick={() => respond("release")}
        disabled={busy !== null}
        className="text-[13px] font-semibold text-ink-secondary underline underline-offset-2 hover:text-primary"
      >
        {busy === "release" ? "Dropping…" : "Drop the card"}
      </button>
    </div>
  );
}
