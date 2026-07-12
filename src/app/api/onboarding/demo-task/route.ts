import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSystemEvent } from "@/lib/events";

// Seeds the supervised first-magic-moment card at the end of onboarding (US-011).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "No membership" }, { status: 403 });

  const admin = createAdminClient();
  const title = "Try Jiminee: claim this card and check off its steps";

  // One demo card per worker — don't stack duplicates on re-runs.
  const { data: existing } = await admin
    .from("tasks")
    .select("id")
    .eq("org_id", membership.org_id)
    .eq("title", title)
    .eq("created_by", user.id)
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ id: existing.id });

  const { data: board } = await admin
    .from("boards")
    .select("id")
    .eq("org_id", membership.org_id)
    .limit(1)
    .single();

  const { data: task, error } = await admin
    .from("tasks")
    .insert({
      org_id: membership.org_id,
      board_id: board!.id,
      title,
      description:
        "This is a practice card. Claim it, tap Tell me how, check off the steps, then mark it done. That's the whole loop.",
      status: "todo",
      priority: "low",
      estimated_minutes: 5,
      created_by: user.id,
      sort_order: 0.5,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logSystemEvent(admin, membership.org_id, task.id, "created", { demo: true });
  return NextResponse.json({ id: task.id }, { status: 201 });
}
