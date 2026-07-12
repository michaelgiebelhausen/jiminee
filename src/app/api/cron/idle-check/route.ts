import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSystemEvent } from "@/lib/events";
import { decideSweepActions, type SweepTask, type OpenNudge } from "@/lib/nudges/sweep";
import { sendPush } from "@/lib/notify/push";
import { sendSms } from "@/lib/notify/sms";
import { nudgeCopy, type VoiceMode } from "@/lib/voice";

// The idle-detection sweep (FR-010/FR-011). Vercel Cron every 5 minutes.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  // O(doing tasks) via the partial index idx_tasks_idle.
  const { data: doing } = await admin
    .from("tasks")
    .select("id, org_id, title, assignee_id, estimated_minutes, last_activity_at, claimed_at")
    .eq("status", "doing")
    .not("assignee_id", "is", null);
  const tasks = (doing ?? []) as SweepTask[];

  const taskIds = tasks.map((t) => t.id);
  const { data: nudgeRows } = taskIds.length
    ? await admin
        .from("nudges")
        .select("id, task_id, channel, status, sent_at")
        .in("task_id", taskIds)
        .gte("sent_at", dayStart.toISOString())
    : { data: [] };
  const nudges = (nudgeRows ?? []) as OpenNudge[];

  // Per-org quiet hours (TASK-047): decide separately per organization's settings.
  const orgIds = [...new Set(tasks.map((t) => t.org_id))];
  const { data: orgRows } = orgIds.length
    ? await admin
        .from("organizations")
        .select("id, timezone, quiet_hours_start, quiet_hours_end")
        .in("id", orgIds)
    : { data: [] };
  const orgSettings = new Map(
    (orgRows ?? []).map((o) => [
      o.id,
      { tz: o.timezone as string, workStart: o.quiet_hours_start as number, workEnd: o.quiet_hours_end as number },
    ])
  );

  const actions = orgIds.flatMap((orgId) =>
    decideSweepActions(
      now,
      tasks.filter((t) => t.org_id === orgId),
      nudges,
      orgSettings.get(orgId) ?? {}
    )
  );

  let nudgesSent = 0;
  let smsEscalated = 0;
  let expired = 0;

  for (const action of actions) {
    const task = tasks.find((t) => t.id === action.taskId);
    if (!task) continue;

    if (action.kind === "expire") {
      await admin.from("nudges").update({ status: "expired" }).eq("id", action.nudgeId);
      await logSystemEvent(admin, task.org_id, task.id, "nudge_expired");
      expired++;
      continue;
    }

    const { data: worker } = await admin
      .from("users")
      .select("voice_mode, phone")
      .eq("id", task.assignee_id)
      .single();
    const mode = (worker?.voice_mode ?? "default") as VoiceMode;

    if (action.kind === "send_first") {
      const { data: nudge } = await admin
        .from("nudges")
        .insert({ org_id: task.org_id, task_id: task.id, user_id: task.assignee_id, channel: "push" })
        .select("id")
        .single();
      if (!nudge) continue;

      const copy = nudgeCopy(mode, "first", task.title);
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/nudge/${nudge.id}`;
      const pushResult = await sendPush(admin, task.assignee_id, { ...copy, url, nudgeId: nudge.id });

      if (pushResult === "no_subscription" || pushResult === "expired") {
        // No push channel: try SMS immediately; if that's impossible too, expire
        // loudly (dashboard exception) — never silent (PRD edge case).
        const smsCopy = nudgeCopy(mode, "sms_fallback", task.title);
        const smsResult = await sendSms(worker?.phone ?? null, `${smsCopy.body} ${url}`);
        if (smsResult === "delivered" || smsResult === "not_configured") {
          await admin.from("nudges").update({ channel: "sms" }).eq("id", nudge.id);
          await logSystemEvent(admin, task.org_id, task.id, "nudge_sent", { channel: "sms" });
          nudgesSent++;
        } else {
          await admin.from("nudges").update({ status: "expired" }).eq("id", nudge.id);
          await logSystemEvent(admin, task.org_id, task.id, "nudge_expired", { reason: "no_channel" });
          expired++;
        }
      } else {
        await logSystemEvent(admin, task.org_id, task.id, "nudge_sent", { channel: "push" });
        nudgesSent++;
      }
    }

    if (action.kind === "sms_fallback") {
      const copy = nudgeCopy(mode, "sms_fallback", task.title);
      const { data: smsNudge } = await admin
        .from("nudges")
        .insert({ org_id: task.org_id, task_id: task.id, user_id: task.assignee_id, channel: "sms" })
        .select("id")
        .single();
      if (!smsNudge) continue;
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/nudge/${smsNudge.id}`;
      const result = await sendSms(worker?.phone ?? null, `${copy.body} ${url}`);
      // Close out the unanswered push either way.
      await admin.from("nudges").update({ status: "expired" }).eq("id", action.pushNudgeId);
      if (result === "delivered" || result === "not_configured") {
        await logSystemEvent(admin, task.org_id, task.id, "nudge_sent", { channel: "sms" });
        smsEscalated++;
      } else {
        await admin.from("nudges").update({ status: "expired" }).eq("id", smsNudge.id);
        await logSystemEvent(admin, task.org_id, task.id, "nudge_expired", { reason: "sms_failed" });
        expired++;
      }
    }
  }

  return NextResponse.json({ checked: tasks.length, nudgesSent, smsEscalated, expired });
}
