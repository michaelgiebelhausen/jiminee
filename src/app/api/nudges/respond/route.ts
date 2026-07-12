import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logTaskEvent } from "@/lib/events";

const Body = z.object({
  nudgeId: z.string().uuid(),
  action: z.enum(["confirm", "release"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // RLS: the target reads their own nudge.
  const { data: nudge } = await supabase
    .from("nudges")
    .select("id, org_id, task_id, user_id, status")
    .eq("id", parsed.data.nudgeId)
    .maybeSingle();
  if (!nudge || nudge.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotent: a stale nudge (already handled / task moved on) gets a friendly no-op.
  if (nudge.status !== "sent") {
    return NextResponse.json({ status: nudge.status, stale: true });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (parsed.data.action === "confirm") {
    await admin
      .from("nudges")
      .update({ status: "confirmed", responded_at: now })
      .eq("id", nudge.id);
    await admin.from("tasks").update({ last_activity_at: now }).eq("id", nudge.task_id);
    await logTaskEvent(supabase, nudge.org_id, nudge.task_id, "nudge_confirmed");
    return NextResponse.json({ status: "confirmed" });
  }

  // release: card back to To Do, assignee cleared.
  await admin.from("nudges").update({ status: "released", responded_at: now }).eq("id", nudge.id);
  await admin
    .from("tasks")
    .update({ assignee_id: null, status: "todo", claimed_at: null })
    .eq("id", nudge.task_id);
  await logTaskEvent(supabase, nudge.org_id, nudge.task_id, "released");
  return NextResponse.json({ status: "released" });
}
