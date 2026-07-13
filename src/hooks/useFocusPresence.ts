"use client";

// .me screen-agent v1 (web-observable half): while a focus session is open,
// watch Page Visibility and run periodic "still on it?" check-ins. What a web
// app can honestly see: tab hidden/shown + whether the user answers pings.
// The native active-window agent (agent/ scaffold) supersedes this later.

import { useCallback, useEffect, useRef, useState } from "react";

export const CHECKIN_INTERVAL_MS = 10 * 60_000; // ping every 10 min of focus
export const CHECKIN_GRACE_MS = 60_000; // 60s to answer before it counts as missed

async function report(
  sessionId: string,
  event: "away" | "back" | "pong" | "missed",
  awaySeconds?: number
) {
  try {
    await fetch("/api/me/focus/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, event, awaySeconds }),
    });
  } catch {
    // Presence reporting is best-effort; never break the session over it.
  }
}

export function useFocusPresence(sessionId: string | null): {
  checkinDue: boolean;
  answerCheckin: () => void;
} {
  const [checkinDue, setCheckinDue] = useState(false);
  const awayStartRef = useRef<number | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Visibility watcher: hidden → clock starts; visible → report the gap.
  useEffect(() => {
    if (!sessionId) return;
    const onVisibility = () => {
      if (document.hidden) {
        awayStartRef.current = Date.now();
        void report(sessionId, "away");
      } else if (awayStartRef.current !== null) {
        const awaySeconds = Math.round((Date.now() - awayStartRef.current) / 1000);
        awayStartRef.current = null;
        void report(sessionId, "back", awaySeconds);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [sessionId]);

  // Periodic check-in: banner appears; unanswered within grace = missed.
  useEffect(() => {
    if (!sessionId) {
      setCheckinDue(false);
      return;
    }
    const interval = setInterval(() => {
      setCheckinDue(true);
      graceTimerRef.current = setTimeout(() => {
        setCheckinDue(false);
        void report(sessionId, "missed");
      }, CHECKIN_GRACE_MS);
    }, CHECKIN_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    };
  }, [sessionId]);

  const answerCheckin = useCallback(() => {
    if (!sessionId) return;
    if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    setCheckinDue(false);
    void report(sessionId, "pong");
  }, [sessionId]);

  return { checkinDue, answerCheckin };
}
