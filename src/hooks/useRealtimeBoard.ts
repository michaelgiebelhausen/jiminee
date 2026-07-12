"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";

// Live board sync (FR-004): org-filtered postgres_changes on tasks.
// Any change → onChange (full refetch — cheap at pilot scale, immune to
// reconciliation bugs). Falls back to 30s polling while disconnected and
// refetches on tab focus.
export function useRealtimeBoard(orgId: string, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const supabase = createClient();
    let connected = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!poll) poll = setInterval(() => onChangeRef.current(), 30_000);
    };
    const stopPolling = () => {
      if (poll) {
        clearInterval(poll);
        poll = null;
      }
    };

    // Subscribe only after auth is hydrated (PRD gotcha) — getUser() awaits the session.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(() => {
      channel = supabase
        .channel(`board-${orgId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks", filter: `org_id=eq.${orgId}` },
          () => onChangeRef.current()
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            connected = true;
            stopPolling();
            onChangeRef.current(); // reconcile anything missed while connecting
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            connected = false;
            startPolling();
          }
        });
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") onChangeRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    if (!connected) startPolling();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      stopPolling();
      if (channel) supabase.removeChannel(channel);
    };
  }, [orgId]);
}
