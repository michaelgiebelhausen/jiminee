import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logTaskEvent } from "@/lib/events";
import { sendEmail } from "@/lib/notify/email";

const Body = z.object({
  ruling: z.enum(["reassigned", "upheld", "dismissed"]),
  note: z.string().min(3).max(2000), // note required (US-010)
  reassignTo: z.string().uuid().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A ruling needs a note — it's the paper trail." }, { status: 400 });
  }

  const { data: dispute } = await supabase
    .from("disputes")
    .select("id, org_id, task_id, raised_by, status, tasks(title, status, assignee_id)")
    .eq("id", id)
    .maybeSingle();
  if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dispute.status !== "open") {
    return NextResponse.json({ error: "This dispute was already ruled." }, { status: 409 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", dispute.org_id)
    .maybeSingle();
  if (membership?.role !== "administrator") {
    return NextResponse.json({ error: "Only the administrator rules on disputes" }, { status: 403 });
  }

  const task = dispute.tasks as unknown as { title: string; status: string; assignee_id: string | null };
  const admin = createAdminClient();
  const { ruling, note, reassignTo } = parsed.data;

  await admin
    .from("disputes")
    .update({ status: ruling, ruled_by: user.id, ruling_note: note, ruled_at: new Date().toISOString() })
    .eq("id", dispute.id);

  // Route the card (US-010) — unless it already finished (PRD edge case: ruled-after-done).
  if (task.status !== "done") {
    if (ruling === "reassigned") {
      await admin
        .from("tasks")
        .update(
          reassignTo
            ? { assignee_id: reassignTo, status: "doing", claimed_at: new Date().toISOString() }
            : { assignee_id: null, status: "todo", claimed_at: null }
        )
        .eq("id", dispute.task_id);
    } else if (ruling === "upheld") {
      await admin.from("tasks").update({ status: "doing" }).eq("id", dispute.task_id);
    } else {
      await admin
        .from("tasks")
        .update({ assignee_id: null, status: "backlog", claimed_at: null })
        .eq("id", dispute.task_id);
    }
  }

  await logTaskEvent(supabase, dispute.org_id, dispute.task_id, "ruled", { ruling });

  // Notify the worker who raised it.
  const { data: raiser } = await admin.auth.admin.getUserById(dispute.raised_by);
  if (raiser?.user?.email) {
    await sendEmail(
      raiser.user.email,
      `Dispute ruled: "${task.title}"`,
      `<p>The administrator ruled on the task you flagged.</p>
       <p><b>Ruling:</b> ${ruling}<br/><b>Note:</b> ${note}</p>
       <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/task/${dispute.task_id}">See the card</a>.</p>
       <p>— Jiminee 🦗</p>`
    );
  }

  return NextResponse.json({ status: ruling });
}
