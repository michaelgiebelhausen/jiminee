// .me nudge copy — the cricket chasing *you*, at the intensity you chose.
// Same rules as .work's voice.ts: never shaming about outcomes you can't
// control, never referencing other people; tough_love is a gift you gave
// yourself. Copy escalates warm → firm → tough_love via escalation.ts.

import type { Intensity } from "./escalation";

export type MeNudgeKind =
  | "stale_card" // card rotting in todo/doing
  | "today_slipping" // committed today-pick, late afternoon, not done
  | "focus_away" // mid focus-session, user gone/idle
  | "streak_risk"; // habit streak about to break tonight

export type MeNudgeCopy = { title: string; body: string };

function trunc(s: string): string {
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
}

const COPY: Record<MeNudgeKind, Record<Intensity, (t: string, n?: number) => MeNudgeCopy>> = {
  stale_card: {
    warm: (t) => ({
      title: "Gentle chirp",
      body: `"${t}" has been sitting quietly for a few days. Still yours? Do it, schedule it, or let it go.`,
    }),
    firm: (t) => ({
      title: "That card isn't moving",
      body: `"${t}" hasn't budged in days. Decide right now: do it today, or drop it. Parking lots are for cars.`,
    }),
    tough_love: (t) => ({
      title: "It's compost now",
      body: `"${t}" has rotted so long it's basically compost. You made this list. Do the thing or delete it — pick one, champ.`,
    }),
  },
  today_slipping: {
    warm: (t) => ({
      title: "Today's pick check-in",
      body: `You picked "${t}" for today this morning. There's still time — want to give it 20 minutes?`,
    }),
    firm: (t) => ({
      title: "You promised yourself",
      body: `This morning you said "${t}" mattered today. The day's getting thin. Start it now.`,
    }),
    tough_love: (t) => ({
      title: "Remember this morning?",
      body: `Morning-you swore "${t}" was happening today. Evening-you is about to make morning-you a liar. Go.`,
    }),
  },
  focus_away: {
    warm: (t) => ({
      title: "Still with me?",
      body: `You started "${t}" and then wandered off. No judgment — tap back in when you're ready.`,
    }),
    firm: (t) => ({
      title: "You left your own focus session",
      body: `You hit start on "${t}" and vanished. Get back to the tab or stop the session — half-focus is worse than none.`,
    }),
    tough_love: (t) => ({
      title: "Cool story, where'd you go?",
      body: `You declared, out loud, to a cricket, that you were doing "${t}". That was minutes ago. Back to work.`,
    }),
  },
  streak_risk: {
    warm: (t, n) => ({
      title: "Your streak's still open",
      body: `"${t}" would make it ${(n ?? 0) + 1} days in a row. There's still today — small version counts.`,
    }),
    firm: (t, n) => ({
      title: `${n ?? 0}-day streak on the line`,
      body: `"${t}": ${n ?? 0} straight days, and today's still blank. Don't hand back a streak you paid for.`,
    }),
    tough_love: (t, n) => ({
      title: "About to torch the streak?",
      body: `${n ?? 0} days of "${t}" and you're going to bail tonight? The chain doesn't care how tired you are. Neither do I. Go.`,
    }),
  },
};

export function meNudgeCopy(
  intensity: Intensity,
  kind: MeNudgeKind,
  taskTitle: string,
  streak?: number
): MeNudgeCopy {
  return COPY[kind][intensity](trunc(taskTitle), streak);
}
