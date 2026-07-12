import Image from "next/image";
import Link from "next/link";
import { WaitlistForm } from "@/components/features/marketing/WaitlistForm";

export const metadata = {
  title: "Jiminee — Delegation that costs one sentence",
  description:
    "Type the task. Jiminee writes the instructions, coaches the worker, and chirps when things stall.",
};

// FR-018: landing page. Copy verbatim from product-vision § Messaging Framework.
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center px-6 py-16 text-center">
      <div className="flex items-center gap-3">
        <Image src="/icons/cricket.svg" alt="" width={56} height={56} priority />
        <span className="font-display text-4xl font-extrabold tracking-tight">jiminee</span>
      </div>

      <h1 className="mt-10 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
        Type the task. Jiminee writes the instructions, coaches the worker, and chirps when things
        stall.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-ink-secondary">
        For teams whose workers need a guide, not another empty board.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="h-11 rounded-sm bg-primary px-6 font-bold leading-[44px] text-on-primary hover:bg-primary-hover"
        >
          Sign in
        </Link>
        <Link
          href="/setup"
          className="h-11 rounded-sm border border-line-strong bg-surface px-6 font-bold leading-[44px] text-primary hover:bg-success-soft"
        >
          Set up your team
        </Link>
      </div>

      <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
        <div className="rounded-md border border-line bg-surface p-5 shadow-rest">
          <h2 className="font-bold">Stop writing instructions</h2>
          <p className="mt-1.5 text-sm text-ink-secondary">
            One sentence becomes a novice-proof, site-specific checklist.
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface p-5 shadow-rest">
          <h2 className="font-bold">Stop chasing follow-through</h2>
          <p className="mt-1.5 text-sm text-ink-secondary">
            Activity-based check-ins nudge stalled work before you ever hear about it.
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface p-5 shadow-rest">
          <h2 className="font-bold">Stop replaying &ldquo;not my job&rdquo;</h2>
          <p className="mt-1.5 text-sm text-ink-secondary">
            Disputes get a referee, a ruling, and a record.
          </p>
        </div>
      </div>

      <section className="mt-16 max-w-xl">
        <h2 className="font-display text-xl font-extrabold">Isn&apos;t this surveillance?</h2>
        <p className="mt-2 text-ink-secondary">
          No screenshots, no camera, no location. Jiminee reads task activity only — claims,
          checkoffs, completions — and workers see the same disclosure you do.
        </p>
      </section>

      <section className="mt-16 w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-rest">
        <h2 className="font-display text-lg font-extrabold">
          Want the cricket for your own goals?
        </h2>
        <p className="mt-1.5 text-sm text-ink-secondary">
          jiminee<b>.me</b> — the self-accountability version — is coming. Get on the list.
        </p>
        <WaitlistForm />
      </section>

      <footer className="mt-16 text-[13px] text-ink-muted">
        Your workers aren&apos;t lazy. Delegating is just too expensive. We fixed the price. 🦗
      </footer>
    </main>
  );
}
