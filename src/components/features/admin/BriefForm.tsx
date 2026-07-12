"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { BRIEF_SECTIONS, briefCompleteness, type WorkplaceBrief } from "@/lib/brief";

export function BriefForm({
  orgId,
  initialBrief,
  completedAt,
}: {
  orgId: string;
  initialBrief: WorkplaceBrief;
  completedAt: string | null;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [brief, setBrief] = useState<WorkplaceBrief>(initialBrief);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const completeness = briefCompleteness(brief);

  // Autosave per-section with a short debounce (US-013).
  function update(key: keyof WorkplaceBrief, value: string) {
    const next = { ...brief, [key]: value };
    setBrief(next);
    setSaved(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("organizations")
        .update({ workplace_brief: next })
        .eq("id", orgId);
      if (error) setError("Autosave hiccuped — your text is still here, keep going.");
      else {
        setError(null);
        setSaved(key);
      }
    }, 800);
  }

  async function complete() {
    setCompleting(true);
    setError(null);
    const { error } = await supabase
      .from("organizations")
      .update({ workplace_brief: brief, brief_completed_at: new Date().toISOString() })
      .eq("id", orgId);
    if (error) setError(error.message);
    else router.refresh();
    setCompleting(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.round(completeness * 100)}%` }}
          />
        </div>
        <span className="text-[13px] font-bold text-ink-secondary">
          {Math.round(completeness * 100)}%
        </span>
      </div>

      {completedAt ? (
        <p className="rounded-sm bg-success-soft px-3 py-2 text-sm text-success">
          The brief is live — every Tell Me How checklist knows your building. Edits autosave.
        </p>
      ) : (
        <p className="rounded-sm bg-warning-soft px-3 py-2 text-sm text-warning">
          Tell Me How is locked until the brief is complete — it&apos;s what keeps the AI&apos;s
          steps site-specific instead of confidently generic.
        </p>
      )}

      {BRIEF_SECTIONS.map((s) => (
        <label key={s.key} className="flex flex-col gap-1.5">
          <span className="flex items-baseline gap-2 text-sm font-bold">
            {s.label}
            {saved === s.key && <span className="text-[12px] font-semibold text-success">saved ✓</span>}
          </span>
          <span className="text-[13px] text-ink-muted">{s.hint}</span>
          <textarea
            className="min-h-20 rounded-sm border border-line bg-surface p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            value={brief[s.key] ?? ""}
            onChange={(e) => update(s.key, e.target.value)}
          />
        </label>
      ))}

      {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}

      {!completedAt && (
        <button
          onClick={complete}
          disabled={completing || completeness < 0.6}
          className="h-11 rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
          title={completeness < 0.6 ? "Fill at least three sections first" : undefined}
        >
          {completing ? "Unlocking…" : "Complete the brief — unlock Tell Me How 🎉"}
        </button>
      )}
    </div>
  );
}
