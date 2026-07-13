import { describe, expect, it } from "vitest";
import { computeStreak, isDueOn } from "./streaks";

// 2026-07-12 is a Sunday; 2026-07-10 Friday, 2026-07-13 Monday.

describe("isDueOn", () => {
  it("daily habits are always due", () => {
    expect(isDueOn("2026-07-12", "daily")).toBe(true);
  });
  it("weekday habits skip weekends", () => {
    expect(isDueOn("2026-07-12", "weekdays")).toBe(false); // Sunday
    expect(isDueOn("2026-07-10", "weekdays")).toBe(true); // Friday
  });
});

describe("computeStreak — daily", () => {
  it("counts consecutive days ending yesterday, at risk today", () => {
    const s = computeStreak(["2026-07-09", "2026-07-10", "2026-07-11"], "2026-07-12", "daily");
    expect(s.current).toBe(3);
    expect(s.doneToday).toBe(false);
    expect(s.atRisk).toBe(true);
  });

  it("includes today once completed and clears risk", () => {
    const s = computeStreak(
      ["2026-07-10", "2026-07-11", "2026-07-12"],
      "2026-07-12",
      "daily"
    );
    expect(s.current).toBe(3);
    expect(s.doneToday).toBe(true);
    expect(s.atRisk).toBe(false);
  });

  it("a gap resets the chain", () => {
    const s = computeStreak(["2026-07-08", "2026-07-09", "2026-07-11"], "2026-07-12", "daily");
    expect(s.current).toBe(1); // only the 11th survives the gap on the 10th
  });

  it("no completions → zero, no risk (nothing on the line)", () => {
    const s = computeStreak([], "2026-07-12", "daily");
    expect(s.current).toBe(0);
    expect(s.atRisk).toBe(false);
  });
});

describe("computeStreak — weekdays", () => {
  it("Friday→Monday chain survives the weekend", () => {
    // Thu 9th + Fri 10th done; today is Monday the 13th, not yet done.
    const s = computeStreak(["2026-07-09", "2026-07-10"], "2026-07-13", "weekdays");
    expect(s.current).toBe(2);
    expect(s.atRisk).toBe(true);
  });

  it("weekend day is never at risk for a weekday habit", () => {
    const s = computeStreak(["2026-07-09", "2026-07-10"], "2026-07-12", "weekdays"); // Sunday
    expect(s.atRisk).toBe(false);
    expect(s.current).toBe(2);
  });
});
