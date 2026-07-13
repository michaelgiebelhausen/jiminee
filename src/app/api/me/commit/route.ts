// .me daily ritual commit — "every morning I decide what matters."
// Stamps committed_on = today on the chosen cards; backlog picks move to todo.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logTaskEvent } from "@/lib/events";
import { getPersonalWorkspace } from "@/lib/me/workspace";
import { localClock } from "@/lib/me/escalation";

const Body = z.object({
  taskIds: z.array(z.string().uuid()).min(1).max(5),
});

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

  const { todayIso } = localClock(new Date(), ws.timezone);

  // RLS scopes the update to the caller's org; the org filter keeps the
  // ritual from ever stamping .work cards.
  const { data: updated, error } = await supabase
    .from("tasks")
    .update({ committed_on: todayIso, last_activity_at: new Date().toISOString() })
    .in("id", parsed.data.taskIds)
    .eq("org_id", ws.orgId)
    .neq("task_type", "habit")
    .select("id, status");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // A committed backlog card is real now — surface it in To Do.
  const backlogIds = (updated ?? []).filter((t) => t.status === "backlog").map((t) => t.id);
  if (backlogIds.length > 0) {
    await supabase.from("tasks").update({ status: "todo" }).in("id", backlogIds);
  }

  await Promise.all(
    (updated ?? []).map((t) =>
      logTaskEvent(supabase, ws.orgId, t.id, "committed_today", { date: todayIso })
    )
  );

  return NextResponse.json({ committed: (updated ?? []).length, date: todayIso });
}
