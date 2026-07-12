import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logTaskEvent } from "@/lib/events";

// "I had to chase this" — gate metric 2's denominator instrument (TASK-046).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id")
    .eq("id", id)
    .maybeSingle();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 403 });

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", task.org_id)
    .maybeSingle();
  if (!membership || !["manager", "administrator"].includes(membership.role)) {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  await logTaskEvent(supabase, task.org_id, task.id, "manager_chase");
  return NextResponse.json({});
}
