// .me accountability sweep (Vercel Cron): the conscience that won't let today's
// picks quietly rot. Per personal workspace: expire stale nudges, chase rotting
// cards + slipping today-picks (rot.ts), warn about streaks on the line in the
// evening, escalating one rung per ignored nudge up to the user's self-set cap.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSystemEvent } from "@/lib/events";
import { sendPush } from "@/lib/notify/push";
import { sendSms } from "@/lib/notify/sms";
import { decideRotActions, type MeSweepTask, type RotKind } from "@/lib/me/rot";
import { escalate, inQuietHours, localClock, type Intensity } from "@/lib/me/escalation";
import { meNudgeCopy, type MeNudgeKind } from "@/lib/me/voice";
import { computeStreak, isDueOn, type Recurrence } from "@/lib/me/streaks";

export const dynamic = "force-dynamic";

const NUDGE_EXPIRE_MINUTES = 30;
const MAX_NUDGES_PER_TASK_PER_DAY = 3;
const STREAK_WARN_HOUR = 19; // 7pm local: last call for tonight's habits

type SweepAction = { kind: MeNudgeKind; taskId: string; title: string; streak?: number };

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const nowMs = now.getTime();

  const { data: workspaces } = await admin
    .from("organizations")
    .select("id, owner_id, timezone")
    .eq("is_personal", true)
    .not("owner_id", "is", null);
  if (!workspaces || workspaces.length === 0) {
    return NextResponse.json({ workspaces: 0, nudgesSent: 0 });
  }

  // Unanswered .me nudges go stale fast — expire so escalation can re-fire.
  const expireBefore = new Date(nowMs - NUDGE_EXPIRE_MINUTES * 60_000).toISOString();
  await admin
    .from("nudges")
    .update({ status: "expired" })
    .eq("status", "sent")
    .lt("sent_at", expireBefore)
    .in(
      "org_id",
      workspaces.map((w) => w.id)
    );

  let nudgesSent = 0;
  let smsSent = 0;

  for (const ws of workspaces) {
    const tz = (ws.timezone as string) ?? "America/New_York";
    const { hour, todayIso } = localClock(now, tz);

    const { data: settings } = await admin
      .from("me_settings")
      .select("nudge_intensity, quiet_start, quiet_end, sms_enabled")
      .eq("user_id", ws.owner_id)
      .maybeSingle();
    const cap = ((settings?.nudge_intensity as Intensity) ?? "warm");
    if (inQuietHours(hour, settings?.quiet_start ?? 22, settings?.quiet_end ?? 7)) continue;

    const { data: tasks } = await admin
      .from("tasks")
      .select("id, org_id, title, status, task_type, recurrence, committed_on, last_activity_at")
      .eq("org_id", ws.id)
      .neq("status", "done");
    if (!tasks || tasks.length === 0) continue;

    // Today's nudges (this org): open ones suppress, the day's count escalates.
    const dayStart = new Date(nowMs - 24 * 3600_000).toISOString();
    const { data: recentNudges } = await admin
      .from("nudges")
      .select("task_id, status, sent_at")
      .eq("org_id", ws.id)
      .gte("sent_at", dayStart);
    const nudges = recentNudges ?? [];
    const sentToday = (taskId: string) => nudges.filter((n) => n.task_id === taskId).length;

    const actions: SweepAction[] = decideRotActions(
      nowMs,
      todayIso,
      hour,
      tasks as MeSweepTask[],
      nudges,
      {}
    ).map((a) => ({ kind: a.kind as RotKind, taskId: a.taskId, title: a.title }));

    // Evening streak protection: habits due today, unchecked, with a chain on the line.
    if (hour >= STREAK_WARN_HOUR) {
      const habits = tasks.filter((t) => t.task_type === "habit");
      if (habits.length > 0) {
        const since = new Date(nowMs - 120 * 86_400_000).toISOString().slice(0, 10);
        const { data: completions } = await admin
          .from("habit_completions")
          .select("task_id, completed_on")
          .eq("org_id", ws.id)
          .gte("completed_on", since);
        const open = new Set(nudges.filter((n) => n.status === "sent").map((n) => n.task_id));
        for (const h of habits) {
          if (open.has(h.id)) continue;
          const rec = (h.recurrence ?? "daily") as Recurrence;
          if (!isDueOn(todayIso, rec)) continue;
          const mine = (completions ?? [])
            .filter((c) => c.task_id === h.id)
            .map((c) => c.completed_on as string);
          const streak = computeStreak(mine, todayIso, rec);
          if (streak.atRisk) {
            actions.push({ kind: "streak_risk", taskId: h.id, title: h.title, streak: streak.current });
          }
        }
      }
    }

    if (actions.length === 0) continue;

    const { data: owner } = await admin
      .from("users")
      .select("id, phone")
      .eq("id", ws.owner_id)
      .maybeSingle();

    for (const action of actions) {
      const priorToday = sentToday(action.taskId);
      if (priorToday >= MAX_NUDGES_PER_TASK_PER_DAY) continue; // fatigue cap

      const intensity = escalate(cap, priorToday);
      const copy = meNudgeCopy(intensity, action.kind, action.title, action.streak);

      await admin.from("nudges").insert({
        org_id: ws.id,
        task_id: action.taskId,
        user_id: ws.owner_id,
        channel: "push",
      });
      await sendPush(admin, ws.owner_id as string, {
        title: copy.title,
        body: copy.body,
        url: "/today",
      });
      nudgesSent += 1;

      // Repeat offenders with SMS enabled get the text — the cricket in your pocket.
      if (settings?.sms_enabled && priorToday >= 1 && owner?.phone) {
        await admin.from("nudges").insert({
          org_id: ws.id,
          task_id: action.taskId,
          user_id: ws.owner_id,
          channel: "sms",
        });
        const res = await sendSms(owner.phone as string, `${copy.title} ${copy.body}`);
        if (res === "delivered") smsSent += 1;
      }

      await logSystemEvent(admin, ws.id as string, action.taskId, "nudge_sent", {
        kind: action.kind,
        intensity,
        cycle: priorToday + 1,
      });
    }
  }

  return NextResponse.json({ workspaces: workspaces.length, nudgesSent, smsSent });
}
