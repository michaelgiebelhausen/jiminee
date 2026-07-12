"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { nudgeCopy } from "@/lib/voice";

export function SettingsClient({
  userId,
  initialName,
  initialPhone,
  initialVoiceMode,
}: {
  userId: string;
  initialName: string;
  initialPhone: string;
  initialVoiceMode: "default" | "tough_love";
}) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [voiceMode, setVoiceMode] = useState(initialVoiceMode);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: Record<string, string | null>, label: string) {
    setError(null);
    const { error } = await supabase.from("users").update(patch).eq("id", userId);
    if (error) setError("That didn't save — try again.");
    else {
      setSaved(label);
      setTimeout(() => setSaved(null), 2000);
    }
  }

  async function toggleVoice() {
    const next = voiceMode === "default" ? "tough_love" : "default";
    setVoiceMode(next);
    await save({ voice_mode: next }, "voice");
  }

  const preview = nudgeCopy(voiceMode, "first", "the mail run");

  return (
    <div className="mt-6 flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Profile</h2>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Your name {saved === "name" && <span className="text-success">saved ✓</span>}
          <input
            className="h-10 rounded-sm border border-line bg-surface px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && save({ display_name: name.trim() }, "name")}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Phone (for text reminders) {saved === "phone" && <span className="text-success">saved ✓</span>}
          <input
            type="tel"
            className="h-10 rounded-sm border border-line bg-surface px-3 font-normal outline-none focus:ring-2 focus:ring-primary"
            placeholder="+1 864 555 1234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => save({ phone: phone.trim() || null }, "phone")}
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          The cricket&apos;s voice
        </h2>
        <label className="flex items-start gap-3 rounded-md border border-line bg-surface p-4">
          <input
            type="checkbox"
            checked={voiceMode === "tough_love"}
            onChange={toggleVoice}
            className="mt-1 h-5 w-5 accent-primary"
          />
          <span>
            <span className="block font-bold">Tough Love mode</span>
            <span className="block text-sm text-ink-secondary">
              Your reminders get Triumph-the-Insult-Comic-Dog energy. Only you ever see this —
              managers can&apos;t see it, set it, or read your roasts. Flip it off anytime.
            </span>
          </span>
        </label>
        <div className="rounded-md bg-ink p-4 text-background">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-accent-soft">
            Preview
          </span>
          <p className="mt-1 text-[15px] font-bold">{preview.title}</p>
          <p className="mt-0.5 text-sm text-accent-soft">{preview.body}</p>
        </div>
      </section>

      {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
    </div>
  );
}
