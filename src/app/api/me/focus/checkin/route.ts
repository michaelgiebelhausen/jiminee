// .me screen-agent v1 (web-observable): presence events during a focus session.
// The browser reports visibility loss/return and answers periodic "still on
// it?" pings; missed pings escalate the cricket one rung per miss (capped at
// the user's self-chosen intensity) and fire an OS-level push.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logTaskEvent } from "@/lib/events";
import { sendPush } from "@/lib/notify/push";
import { escalate, type Intensity } from "@/lib/me/escalation";
import { meNudgeCopy } from "@/lib/me/voice";

const Body = z.object({
  sessionId: z.string().uuid(),
  event: z.enum(["away", "back", "pong", "missed"]),
  awaySeconds: z.number().int().min(0).max(86_400).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data: session } = await supabase
    .from("focus_sessions")
    .select("id, org_id, task_id, away_seconds, checkins_answered, checkins_missed, task:tasks(title)")
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "No open session" }, { status: 404 });

  const ev = parsed.data.event;

  if (ev === "pong" || ev === "back") {
    await supabase
      .from("focus_sessions")
      .update({
        checkins_answered: (session.checkins_answered as number) + (ev === "pong" ? 1 : 0),
        away_seconds:
          (session.away_seconds as number) + (ev === "back" ? (parsed.data.awaySeconds ?? 0) : 0),
      })
      .eq("id", session.id);
    // Presence is activity — keep the idle sweep off a task being worked.
    await supabase
      .from("tasks")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", session.task_id);
    return NextResponse.json({ ok: true });
  }

  if (ev === "away") {
    // Just note it; the client accumulates and reports the length on "back".
    return NextResponse.json({ ok: true });
  }

  // missed — the watcher pinged and nobody answered. Escalate and chase.
  const missed = (session.checkins_missed as number) + 1;
  await supabase.from("focus_sessions").update({ checkins_missed: missed }).eq("id", session.id);

  const { data: settings } = await supabase
    .from("me_settings")
    .select("nudge_intensity")
    .eq("user_id", user.id)
    .maybeSingle();
  const cap = ((settings?.nudge_intensity as Intensity) ?? "warm");
  const intensity = escalate(cap, missed - 1);

  const taskRow = session.task as { title: string } | { title: string }[] | null;
  const title = Array.isArray(taskRow) ? taskRow[0]?.title : taskRow?.title;
  const copy = meNudgeCopy(intensity, "focus_away", title ?? "your task");

  const admin = createAdminClient();
  await sendPush(admin, user.id, {
    title: copy.title,
    body: copy.body,
    url: "/today",
  });
  await logTaskEvent(supabase, session.org_id as string, session.task_id as string, "nudge_sent", {
    kind: "focus_away",
    intensity,
    missed,
  });

  return NextResponse.json({ ok: true, escalatedTo: intensity, missed });
}
