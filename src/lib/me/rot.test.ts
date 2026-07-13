import { describe, expect, it } from "vitest";
import { decideRotActions, type MeSweepTask } from "./rot";

const NOW = new Date("2026-07-12T20:00:00Z").getTime(); // 4pm America/New_York
const TODAY = "2026-07-12";

function task(over: Partial<MeSweepTask>): MeSweepTask {
  return {
    id: "t1",
    org_id: "o1",
    title: "Draft the grant budget section",
    status: "todo",
    task_type: "todo",
    committed_on: null,
    last_activity_at: "2026-07-12T10:00:00Z",
    ...over,
  };
}

describe("decideRotActions", () => {
  it("flags a card untouched past the stale threshold", () => {
    const stale = task({ last_activity_at: "2026-07-08T10:00:00Z" }); // 4+ days
    const actions = decideRotActions(NOW, TODAY, 16, [stale], []);
    expect(actions).toEqual([
      { kind: "stale_card", taskId: "t1", title: stale.title },
    ]);
  });

  it("leaves fresh cards alone", () => {
    const actions = decideRotActions(NOW, TODAY, 16, [task({})], []);
    expect(actions).toEqual([]);
  });

  it("chases a committed today-pick after the slip hour", () => {
    const pick = task({ committed_on: TODAY });
    const actions = decideRotActions(NOW, TODAY, 16, [pick], []);
    expect(actions[0]?.kind).toBe("today_slipping");
  });

  it("does not chase today-picks before the slip hour", () => {
    const pick = task({ committed_on: TODAY });
    const actions = decideRotActions(NOW, TODAY, 11, [pick], []);
    expect(actions).toEqual([]);
  });

  it("today_slipping wins over stale for the same card", () => {
    const both = task({ committed_on: TODAY, last_activity_at: "2026-07-07T10:00:00Z" });
    const actions = decideRotActions(NOW, TODAY, 17, [both], []);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.kind).toBe("today_slipping");
  });

  it("skips done, blocked, habits, and already-nudged cards", () => {
    const tasks = [
      task({ id: "a", status: "done", last_activity_at: "2026-07-01T00:00:00Z" }),
      task({ id: "b", status: "blocked", last_activity_at: "2026-07-01T00:00:00Z" }),
      task({ id: "c", task_type: "habit", last_activity_at: "2026-07-01T00:00:00Z" }),
      task({ id: "d", last_activity_at: "2026-07-01T00:00:00Z" }), // nudged below
    ];
    const actions = decideRotActions(NOW, TODAY, 16, tasks, [
      { task_id: "d", status: "sent", sent_at: "2026-07-12T15:00:00Z" },
    ]);
    expect(actions).toEqual([]);
  });

  it("an answered (confirmed) nudge no longer suppresses chasing", () => {
    const stale = task({ last_activity_at: "2026-07-01T00:00:00Z" });
    const actions = decideRotActions(NOW, TODAY, 16, [stale], [
      { task_id: "t1", status: "confirmed", sent_at: "2026-07-10T15:00:00Z" },
    ]);
    expect(actions).toHaveLength(1);
  });
});
