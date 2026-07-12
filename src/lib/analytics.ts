"use client";

import posthog from "posthog-js";

// FR-020: pseudonymous product analytics. No input autocapture (PRD § Security).
export type AnalyticsEvent =
  | "card_created"
  | "claimed"
  | "tmh_generated"
  | "step_checked"
  | "nudge_confirmed"
  | "dispute_flagged"
  | "onboarding_completed";

export function track(event: AnalyticsEvent, props: Record<string, string | number> = {}) {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(event, props);
  }
}
