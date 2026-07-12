import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logTaskEvent } from "@/lib/events";
import { cardChatStream, type ChatTurn } from "@/lib/ai/chat";
import type { WorkplaceBrief } from "@/lib/brief";

const Body = z.object({
  taskId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id, title, description, location, estimated_minutes")
    .eq("id", parsed.data.taskId)
    .maybeSingle();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 403 });

  const { data: org } = await supabase
    .from("organizations")
    .select("workplace_brief")
    .eq("id", task.org_id)
    .single();

  const [{ data: stepRows }, { data: msgRows }] = await Promise.all([
    supabase
      .from("task_steps")
      .select("content, generation_id, step_number")
      .eq("task_id", task.id)
      .order("step_number"),
    supabase
      .from("task_messages")
      .select("role, content")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  // Only the latest generation's steps go into context.
  const latestGen = stepRows?.[stepRows.length - 1]?.generation_id;
  const steps = (stepRows ?? []).filter((s) => s.generation_id === latestGen).map((s) => s.content);
  const history = (msgRows ?? []) as ChatTurn[];

  const ctx = {
    title: task.title,
    description: task.description,
    location: task.location,
    estimatedMinutes: task.estimated_minutes,
    brief: (org?.workplace_brief ?? {}) as WorkplaceBrief,
  };

  const admin = createAdminClient(); // task_messages inserts are server-side only
  const userMessage = parsed.data.message;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of cardChatStream(ctx, steps, history, userMessage)) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        await admin.from("task_messages").insert([
          { org_id: task.org_id, task_id: task.id, role: "user", content: userMessage },
          { org_id: task.org_id, task_id: task.id, role: "assistant", content: full.trim() },
        ]);
        await supabase
          .from("tasks")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", task.id);
        await logTaskEvent(supabase, task.org_id, task.id, "chat_message");
        controller.enqueue(encoder.encode("\n__DONE__"));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(`\n__ERROR__:${err instanceof Error ? err.message : "chat failed"}`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
