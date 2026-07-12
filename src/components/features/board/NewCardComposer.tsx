"use client";

import { useState } from "react";

export type NewCardValues = {
  title: string;
  description?: string;
  priority: "low" | "normal" | "high";
  dueAt?: string | null;
  estimatedMinutes?: number | null;
  location?: string | null;
};

export function NewCardComposer({ onCreate }: { onCreate: (v: NewCardValues) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [dueAt, setDueAt] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [location, setLocation] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (title.length > 500) {
      setError("Keep it under 500 characters — one sentence is the whole idea.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
        location: location.trim() || null,
      });
      setTitle("");
      setDescription("");
      setDueAt("");
      setEstimatedMinutes("");
      setLocation("");
      setPriority("normal");
      setExpanded(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post the card — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-20 flex h-11 items-center gap-2 rounded-sm bg-primary px-5 font-bold text-on-primary shadow-raised transition-all hover:bg-primary-hover"
      >
        <span className="text-lg leading-none">+</span> New card
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="fixed bottom-6 right-6 z-20 flex w-[360px] flex-col gap-2.5 rounded-md border border-line bg-surface p-4 shadow-overlay"
    >
      <input
        autoFocus
        className="h-10 rounded-sm border border-line px-3 outline-none focus:ring-2 focus:ring-primary"
        placeholder="Type the task in one sentence…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={500}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />

      {expanded && (
        <>
          <textarea
            className="min-h-16 rounded-sm border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="Anything else worth knowing (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              className="h-9 flex-1 rounded-sm border border-line bg-surface px-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "normal" | "high")}
              aria-label="Priority"
            >
              <option value="low">Low priority</option>
              <option value="normal">Normal priority</option>
              <option value="high">High priority</option>
            </select>
            <input
              type="number"
              min={5}
              max={480}
              className="h-9 w-24 rounded-sm border border-line px-2 text-sm"
              placeholder="Est. min"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              aria-label="Estimated minutes"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              className="h-9 flex-1 rounded-sm border border-line px-2 text-sm"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              aria-label="Due date"
            />
            <input
              className="h-9 flex-1 rounded-sm border border-line px-2 text-sm"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Location"
            />
          </div>
        </>
      )}

      {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="h-9 flex-1 rounded-sm bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
        >
          {busy ? "Posting…" : "Post card"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="h-9 rounded-sm border border-line-strong px-3 text-sm font-semibold text-ink-secondary hover:bg-surface-sunken"
        >
          {expanded ? "Less" : "More"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 rounded-sm px-2 text-sm text-ink-muted hover:text-ink"
          aria-label="Close composer"
        >
          ✕
        </button>
      </div>
    </form>
  );
}
