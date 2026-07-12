"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export function DisputeButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't send the flag — try again.");
      }
      track("dispute_flagged");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the flag — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 rounded-sm border border-line-strong bg-surface px-5 font-bold text-ink-secondary hover:border-error hover:bg-error-soft hover:text-error"
      >
        Dispute
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-overlay">
            <h3 className="font-body text-lg font-bold">Flag this task as out of scope?</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Your reason goes to the administrator with the card. Nothing happens without a ruling
              — and the whole exchange is on the record.
            </p>
            <textarea
              autoFocus
              className="mt-3 min-h-24 w-full rounded-sm border border-line p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Why isn't this yours to do? (at least 10 characters)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {error && <p className="mt-2 rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
            <div className="mt-3 flex gap-2">
              <button
                onClick={submit}
                disabled={reason.trim().length < 10 || busy}
                className="h-10 flex-1 rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
              >
                {busy ? "Sending…" : "Send to the referee"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="h-10 rounded-sm border border-line-strong px-4 font-bold text-ink-secondary hover:bg-surface-sunken"
              >
                Never mind
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
