import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logTaskEvent, countRecentGenerations } from "@/lib/events";
import { generateStepsStream } from "@/lib/ai/steps";
import { parseSteps } from "@/lib/ai/prompts";
import type { WorkplaceBrief } from "@/lib/brief";

const Body = z.object({ taskId: z.string().uuid() });
const RATE_LIMIT = 10; // generations/user/hour

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // RLS scopes this read — a task outside the caller's org comes back null.
  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id, title, description, location, estimated_minutes")
    .eq("id", parsed.data.taskId)
    .maybeSingle();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 403 });

  const { data: org } = await supabase
    .from("organizations")
    .select("workplace_brief, brief_completed_at")
    .eq("id", task.org_id)
    .single();
  if (!org?.brief_completed_at) {
    return NextResponse.json(
      { error: "Workplace brief not completed — ask your administrator to finish it." },
      { status: 409 }
    );
  }

  if ((await countRecentGenerations(supabase, user.id)) >= RATE_LIMIT) {
    return NextResponse.json(
      { error: "You've hit the hourly limit — the button rests for a bit." },
      { status: 429 }
    );
  }

  const ctx = {
    title: task.title,
    description: task.description,
    location: task.location,
    estimatedMinutes: task.estimated_minutes,
    brief: (org.workplace_brief ?? {}) as WorkplaceBrief,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of generateStepsStream(ctx)) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }

        // Persist-on-complete: partial streams are discarded (PRD edge case).
        const steps = parseSteps(full);
        if (steps.length === 0) throw new Error("Model returned no parseable steps");

        // task_steps has no client INSERT policy — persistence is server-side by design.
        const generationId = randomUUID();
        const admin = createAdminClient();
        const { error: insertError } = await admin.from("task_steps").insert(
          steps.map((content, i) => ({
            org_id: task.org_id,
            task_id: task.id,
            step_number: i + 1,
            content,
            generation_id: generationId,
          }))
        );
        if (insertError) throw insertError;

        await supabase
          .from("tasks")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", task.id);
        await logTaskEvent(supabase, task.org_id, task.id, "steps_generated", {
          generation_id: generationId,
          steps: steps.length,
        });

        controller.enqueue(encoder.encode(`\n__DONE__:${generationId}`));
        controller.close();
      } catch (err) {
        const msg =
          (err as { message?: string })?.message ?? (typeof err === "string" ? err : "generation failed");
        console.error("ai/steps failed:", err);
        controller.enqueue(encoder.encode(`\n__ERROR__:${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
