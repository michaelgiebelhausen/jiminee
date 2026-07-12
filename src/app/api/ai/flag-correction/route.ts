import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logTaskEvent } from "@/lib/events";
import { sendCorrectionFlagEmail } from "@/lib/notify/email";

const Body = z.object({
  taskId: z.string().uuid(),
  generationId: z.string().uuid(),
  note: z.string().min(3).max(2000),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Caller must be the task's assignee (US-006).
  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id, title, assignee_id, created_by")
    .eq("id", parsed.data.taskId)
    .maybeSingle();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 403 });
  if (task.assignee_id !== user.id) {
    return NextResponse.json({ error: "Only the assignee can flag steps" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("instruction_corrections")
    .insert({
      org_id: task.org_id,
      task_id: task.id,
      generation_id: parsed.data.generationId,
      flagged_by: user.id,
      flag_note: parsed.data.note,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logTaskEvent(supabase, task.org_id, task.id, "correction_flagged");

  // Notify the card's creator with a one-tap path to store the correction.
  const { data: creator } = await admin
    .from("users")
    .select("id")
    .eq("id", task.created_by)
    .single();
  if (creator) {
    const { data: authUser } = await admin.auth.admin.getUserById(creator.id);
    const email = authUser?.user?.email;
    if (email) {
      await sendCorrectionFlagEmail(
        email,
        task.title,
        parsed.data.note,
        `${process.env.NEXT_PUBLIC_APP_URL}/task/${task.id}`
      );
    }
  }

  return NextResponse.json({ id: row.id }, { status: 201 });
}
