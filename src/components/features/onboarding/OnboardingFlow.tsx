"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/browser";
import { CURRENT_DISCLOSURE_VERSION, DISCLOSURE } from "@/lib/consent";
import { track } from "@/lib/analytics";

type StepId = "welcome" | "consent" | "reminders" | "done";

export function OnboardingFlow({ userId, orgName }: { userId: string; orgName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("welcome");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [needPhone, setNeedPhone] = useState(false);

  const dots: StepId[] = ["welcome", "consent", "reminders", "done"];

  async function acknowledge() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/consent/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disclosureVersion: CURRENT_DISCLOSURE_VERSION }),
      });
      if (!res.ok) throw new Error();
      setStep("reminders");
    } catch {
      setError("That didn't save — give it another tap.");
    } finally {
      setBusy(false);
    }
  }

  async function enableReminders() {
    setBusy(true);
    setError(null);
    try {
      // Desktop-first: browser push needs no install. Permission must come from this tap.
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setNeedPhone(true);
        setBusy(false);
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNeedPhone(true); // decline → SMS fallback capture, flow continues (US-011)
        setBusy(false);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        // Dev without VAPID keys: skip subscription, keep the flow moving.
        await finishReminders();
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapid,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });
      await finishReminders();
    } catch {
      setNeedPhone(true);
      setBusy(false);
    }
  }

  async function savePhoneAndContinue() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const e164 = phone.trim();
    if (!/^\+?[1-9]\d{9,14}$/.test(e164)) {
      setError("That doesn't look like a phone number — use the format +18645551234.");
      setBusy(false);
      return;
    }
    const { error } = await supabase
      .from("users")
      .update({ phone: e164.startsWith("+") ? e164 : `+1${e164}` })
      .eq("id", userId);
    if (error) {
      setError("Couldn't save the number — try again.");
      setBusy(false);
      return;
    }
    await finishReminders();
  }

  async function finishReminders() {
    // Seed the demo task (the supervised first magic moment, US-011).
    await fetch("/api/onboarding/demo-task", { method: "POST" }).catch(() => {});
    track("onboarding_completed");
    setStep("done");
    setBusy(false);
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex gap-2" aria-hidden>
        {dots.map((d) => (
          <span
            key={d}
            className={`h-2 w-2 rounded-full ${dots.indexOf(d) <= dots.indexOf(step) ? "bg-primary" : "bg-line"}`}
          />
        ))}
      </div>

      {step === "welcome" && (
        <>
          <Image src="/icons/cricket.svg" alt="" width={72} height={72} priority />
          <h1 className="font-display text-2xl font-extrabold">Hi! I&apos;m Jiminee.</h1>
          <p className="text-ink-secondary">
            Welcome to {orgName}. I&apos;ll show you how to do things — step by step, no dumb
            questions — and check in if a task goes quiet. Two quick things before the board.
          </p>
          <button
            onClick={() => setStep("consent")}
            className="h-11 w-full rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover"
          >
            Let&apos;s go
          </button>
        </>
      )}

      {step === "consent" && (
        <>
          <h1 className="font-display text-xl font-extrabold">{DISCLOSURE.heading}</h1>
          <ul className="flex flex-col gap-2.5 text-left text-[15px] text-ink-secondary">
            {DISCLOSURE.body.map((line, i) => (
              <li key={i} className="rounded-sm border border-line bg-surface p-3">
                {line}
              </li>
            ))}
          </ul>
          {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
          <button
            onClick={acknowledge}
            disabled={busy}
            className="h-11 w-full rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
          >
            {busy ? "Saving…" : DISCLOSURE.acknowledgment}
          </button>
        </>
      )}

      {step === "reminders" && !needPhone && (
        <>
          <h1 className="font-display text-xl font-extrabold">One tap for reminders</h1>
          <p className="text-ink-secondary">
            If a task you claimed goes quiet, I&apos;ll chirp — a small notification, never an
            alarm. Your browser will ask permission.
          </p>
          {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
          <button
            onClick={enableReminders}
            disabled={busy}
            className="h-11 w-full rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
          >
            {busy ? "Setting up…" : "Enable reminders"}
          </button>
          <button onClick={() => setNeedPhone(true)} className="text-[13px] text-ink-muted underline underline-offset-2">
            Prefer text messages instead?
          </button>
        </>
      )}

      {step === "reminders" && needPhone && (
        <>
          <h1 className="font-display text-xl font-extrabold">Texts it is</h1>
          <p className="text-ink-secondary">
            No notifications, no problem — drop your number and reminders arrive as texts instead.
          </p>
          <input
            type="tel"
            className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-center outline-none focus:ring-2 focus:ring-primary"
            placeholder="+1 864 555 1234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
          <button
            onClick={savePhoneAndContinue}
            disabled={busy || phone.trim().length < 10}
            className="h-11 w-full rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
          >
            {busy ? "Saving…" : "Save & continue"}
          </button>
        </>
      )}

      {step === "done" && (
        <>
          <Image src="/icons/cricket.svg" alt="" width={72} height={72} />
          <h1 className="font-display text-2xl font-extrabold">You&apos;re set.</h1>
          <p className="text-ink-secondary">
            There&apos;s a practice card waiting on the board with your name on it. Claim it, tap
            <b> Tell me how</b>, and check off your first steps.
          </p>
          <button
            onClick={() => {
              router.push("/board");
              router.refresh();
            }}
            className="h-11 w-full rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover"
          >
            To the board
          </button>
        </>
      )}
    </div>
  );
}
