import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logTaskEvent } from "@/lib/events";
import { sendEmail } from "@/lib/notify/email";
import { sendPush } from "@/lib/notify/push";

const Body = z.object({
  taskId: z.string().uuid(),
  reason: z.string().min(10).max(2000), // reason required, min 10 chars (US-009)
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Give the referee a real reason — at least 10 characters." },
      { status: 400 }
    );
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id, title, status")
    .eq("id", parsed.data.taskId)
    .maybeSingle();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 403 });

  // RLS also enforces: raised_by = caller, member of org, reason length.
  const { data: dispute, error } = await supabase
    .from("disputes")
    .insert({
      org_id: task.org_id,
      task_id: task.id,
      raised_by: user.id,
      reason: parsed.data.reason,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("tasks").update({ status: "blocked" }).eq("id", task.id);
  await logTaskEvent(supabase, task.org_id, task.id, "flagged");

  // Notify every administrator (email + push).
  const { data: admins } = await admin
    .from("memberships")
    .select("user_id")
    .eq("org_id", task.org_id)
    .eq("role", "administrator");
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/task/${task.id}`;
  for (const a of admins ?? []) {
    await sendPush(admin, a.user_id, {
      title: "A task was disputed",
      body: `"${task.title}" — nothing happens without your ruling.`,
      url: taskUrl,
    });
    const { data: authUser } = await admin.auth.admin.getUserById(a.user_id);
    if (authUser?.user?.email) {
      await sendEmail(
        authUser.user.email,
        `Dispute raised: "${task.title}"`,
        `<p>A worker flagged a task as out of scope.</p>
         <p><b>Task:</b> ${task.title}<br/><b>Their reason:</b> ${parsed.data.reason}</p>
         <p>Nothing happens without your ruling: <a href="${taskUrl}">review and rule</a>.</p>
         <p>— Jiminee 🦗</p>`
      );
    }
  }

  return NextResponse.json({ id: dispute.id }, { status: 201 });
}
