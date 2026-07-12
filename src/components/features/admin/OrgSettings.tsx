"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function OrgSettings({
  orgId,
  initialName,
  initialBaseline,
  initialQuietStart,
  initialQuietEnd,
}: {
  orgId: string;
  initialName: string;
  initialBaseline: number | null;
  initialQuietStart: number;
  initialQuietEnd: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState(initialName);
  const [baseline, setBaseline] = useState(initialBaseline?.toString() ?? "");
  const [quietStart, setQuietStart] = useState(initialQuietStart);
  const [quietEnd, setQuietEnd] = useState(initialQuietEnd);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        baseline_tasks_per_week: baseline ? parseFloat(baseline) : null,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
      })
      .eq("id", orgId);
    if (error) setError("That didn't save — try again.");
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Organization name
        <input
          className="h-10 rounded-sm border border-line bg-surface px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-semibold">
        Baseline: tasks delegated per manager per week, before Jiminee
        <span className="text-[13px] font-normal text-ink-muted">
          From the onboarding survey — gate metric 1 compares against this number.
        </span>
        <input
          type="number"
          min={0}
          step={0.5}
          className="h-10 w-40 rounded-sm border border-line bg-surface px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
          value={baseline}
          onChange={(e) => setBaseline(e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-1 text-sm font-semibold">
        Reminder hours (Mon–Fri)
        <span className="text-[13px] font-normal text-ink-muted">
          Nudges only fire inside this window; the idle clock pauses outside it.
        </span>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-sm border border-line bg-surface px-2 font-normal"
            value={quietStart}
            onChange={(e) => setQuietStart(parseInt(e.target.value, 10))}
            aria-label="Reminders start"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {h}:00
              </option>
            ))}
          </select>
          <span className="font-normal text-ink-secondary">to</span>
          <select
            className="h-10 rounded-sm border border-line bg-surface px-2 font-normal"
            value={quietEnd}
            onChange={(e) => setQuietEnd(parseInt(e.target.value, 10))}
            aria-label="Reminders end"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h + 1} value={h + 1}>
                {h + 1}:00
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
      <button
        onClick={save}
        className="h-10 w-40 rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover"
      >
        {saved ? "Saved ✓" : "Save settings"}
      </button>
    </div>
  );
}
