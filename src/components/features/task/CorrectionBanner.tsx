"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CorrectionRow = {
  id: string;
  flag_note: string | null;
  correction: string | null;
  flagged_by_name?: string;
};

// Manager-facing: open flags on this card's steps, with an inline correction form (US-006).
export function CorrectionBanner({ corrections }: { corrections: CorrectionRow[] }) {
  const router = useRouter();
  const open = corrections.filter((c) => !c.correction);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (open.length === 0) return null;
  const current = open[0];

  async function resolve() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/corrections/${current.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correction: text }),
      });
      if (!res.ok) throw new Error();
      setText("");
      router.refresh();
    } catch {
      setError("Couldn't save the correction — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-md border border-warning/40 bg-warning-soft p-4">
      <p className="text-sm font-bold text-warning">The steps on this card were flagged as wrong</p>
      <p className="mt-1 text-sm text-ink">
        &ldquo;{current.flag_note}&rdquo;
      </p>
      <textarea
        className="mt-3 min-h-16 w-full rounded-sm border border-line bg-surface p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        placeholder="What's actually true? Your correction is stored so future checklists get it right."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <button
        onClick={resolve}
        disabled={text.trim().length < 3 || busy}
        className="mt-2 h-9 rounded-sm bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
      >
        {busy ? "Saving…" : "Store correction"}
      </button>
    </div>
  );
}
