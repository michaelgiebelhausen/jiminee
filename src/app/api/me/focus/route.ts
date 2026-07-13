// .me focus sessions — the self-declared "I'm on this now" window.
// Starting a session is the .me substitute for a calendar block: it gives the
// screen-agent (and the web presence watcher) something concrete to hold you to.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logTaskEvent } from "@/lib/events";
import { getPersonalWorkspace } from "@/lib/me/workspace";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), taskId: z.string().uuid() }),
  z.object({
    action: z.literal("stop"),
    sessionId: z.string().uuid(),
    outcome: z.enum(["completed", "stopped"]),
  }),
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ws = await getPersonalWorkspace(supabase);
  if (!ws) return NextResponse.json({ error: "No personal workspace" }, { status: 404 });

  const now = new Date().toISOString();

  if (parsed.data.action === "start") {
    const { data: task } = await supabase
      .from("tasks")
      .select("id, status, task_type")
      .eq("id", parsed.data.taskId)
      .eq("org_id", ws.orgId)
      .maybeSingle();
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // One focus at a time: silently close any session left open (walked away).
    const { data: dangling } = await supabase
      .from("focus_sessions")
      .select("id")
      .eq("user_id", user.id)
      .is("ended_at", null);
    if (dangling && dangling.length > 0) {
      await supabase
        .from("focus_sessions")
        .update({ ended_at: now, outcome: "abandoned" })
        .in(
          "id",
          dangling.map((s) => s.id)
        );
    }

    const { data: session, error } = await supabase
      .from("focus_sessions")
      .insert({ org_id: ws.orgId, task_id: task.id, user_id: user.id })
      .select("id, started_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Focusing a card pulls it into Doing and refreshes activity.
    const updates: Record<string, string> = { last_activity_at: now };
    if (task.task_type !== "habit" && (task.status === "todo" || task.status === "backlog")) {
      updates.status = "doing";
    }
    await supabase.from("tasks").update(updates).eq("id", task.id);
    await logTaskEvent(supabase, ws.orgId, task.id, "focus_started");

    return NextResponse.json({ sessionId: session.id, startedAt: session.started_at });
  }

  // stop
  const { data: session } = await supabase
    .from("focus_sessions")
    .select("id, task_id, started_at, away_seconds, checkins_missed")
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "No open session" }, { status: 404 });

  const { error: endError } = await supabase
    .from("focus_sessions")
    .update({ ended_at: now, outcome: parsed.data.outcome })
    .eq("id", session.id);
  if (endError) return NextResponse.json({ error: endError.message }, { status: 500 });

  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(session.started_at as string).getTime()) / 60000)
  );
  await supabase.from("tasks").update({ last_activity_at: now }).eq("id", session.task_id);
  await logTaskEvent(supabase, ws.orgId, session.task_id as string, "focus_ended", {
    outcome: parsed.data.outcome,
    minutes,
    away_seconds: (session.away_seconds as number) ?? 0,
    checkins_missed: (session.checkins_missed as number) ?? 0,
  });

  return NextResponse.json({ ended: true, minutes });
}
