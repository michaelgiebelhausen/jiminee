import { describe, it, expect } from "vitest";
import {
  decideSweepActions,
  idleWindowMinutes,
  isWorkingHours,
  type SweepTask,
  type OpenNudge,
} from "./sweep";

// Tue 2026-07-14 15:00 UTC = 11:00 America/New_York (working hours).
const NOW = new Date("2026-07-14T15:00:00Z");
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60000).toISOString();

function task(over: Partial<SweepTask> = {}): SweepTask {
  return {
    id: "t1",
    org_id: "o1",
    title: "Mail run",
    assignee_id: "u1",
    estimated_minutes: 30,
    last_activity_at: minutesAgo(5),
    claimed_at: minutesAgo(60),
    ...over,
  };
}

describe("idleWindowMinutes", () => {
  it("clamps to [15, 120] with a 30-minute default", () => {
    expect(idleWindowMinutes(null)).toBe(30);
    expect(idleWindowMinutes(5)).toBe(15);
    expect(idleWindowMinutes(300)).toBe(120);
    expect(idleWindowMinutes(45)).toBe(45);
  });
});

describe("isWorkingHours", () => {
  it("true on a weekday late morning ET", () => {
    expect(isWorkingHours(NOW)).toBe(true);
  });
  it("false late at night and on weekends", () => {
    expect(isWorkingHours(new Date("2026-07-14T03:00:00Z"))).toBe(false); // 11pm ET Mon
    expect(isWorkingHours(new Date("2026-07-12T15:00:00Z"))).toBe(false); // Sunday
  });
});

describe("decideSweepActions", () => {
  it("does nothing for an active task", () => {
    expect(decideSweepActions(NOW, [task()], [])).toEqual([]);
  });

  it("sends the first nudge when idle past the window", () => {
    const t = task({ last_activity_at: minutesAgo(45) });
    expect(decideSweepActions(NOW, [t], [])).toEqual([{ kind: "send_first", taskId: "t1" }]);
  });

  it("is idempotent: an open push nudge suppresses re-sending", () => {
    const t = task({ last_activity_at: minutesAgo(45) });
    const open: OpenNudge[] = [
      { id: "n1", task_id: "t1", channel: "push", status: "sent", sent_at: minutesAgo(2) },
    ];
    expect(decideSweepActions(NOW, [t], open)).toEqual([]);
  });

  it("escalates to SMS after 15 unanswered minutes", () => {
    const t = task({ last_activity_at: minutesAgo(60) });
    const open: OpenNudge[] = [
      { id: "n1", task_id: "t1", channel: "push", status: "sent", sent_at: minutesAgo(16) },
    ];
    expect(decideSweepActions(NOW, [t], open)).toEqual([
      { kind: "sms_fallback", taskId: "t1", pushNudgeId: "n1" },
    ]);
  });

  it("expires an SMS unanswered for 30 minutes", () => {
    const t = task({ last_activity_at: minutesAgo(90) });
    const open: OpenNudge[] = [
      { id: "n2", task_id: "t1", channel: "sms", status: "sent", sent_at: minutesAgo(31) },
    ];
    expect(decideSweepActions(NOW, [t], open)).toEqual([
      { kind: "expire", taskId: "t1", nudgeId: "n2" },
    ]);
  });

  it("stops after 3 nudge cycles in a day (fatigue cap)", () => {
    const t = task({ last_activity_at: minutesAgo(300) });
    const today: OpenNudge[] = [1, 2, 3].map((i) => ({
      id: `n${i}`,
      task_id: "t1",
      channel: "push",
      status: "expired",
      sent_at: minutesAgo(i * 60),
    }));
    expect(decideSweepActions(NOW, [t], today)).toEqual([]);
  });

  it("stays silent outside working hours", () => {
    const t = task({ last_activity_at: minutesAgo(300) });
    expect(decideSweepActions(new Date("2026-07-12T15:00:00Z"), [t], [])).toEqual([]);
  });

  it("answered nudges do not block a later cycle", () => {
    const t = task({ last_activity_at: minutesAgo(45) });
    const confirmed: OpenNudge[] = [
      { id: "n1", task_id: "t1", channel: "push", status: "confirmed", sent_at: minutesAgo(120) },
    ];
    expect(decideSweepActions(NOW, [t], confirmed)).toEqual([{ kind: "send_first", taskId: "t1" }]);
  });
});
