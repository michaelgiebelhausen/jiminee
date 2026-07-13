import { describe, expect, it } from "vitest";
import { escalate, inQuietHours, localClock } from "./escalation";

describe("escalate", () => {
  it("always starts warm on the first nudge", () => {
    expect(escalate("tough_love", 0)).toBe("warm");
    expect(escalate("warm", 0)).toBe("warm");
  });

  it("climbs one rung per ignored nudge", () => {
    expect(escalate("tough_love", 1)).toBe("firm");
    expect(escalate("tough_love", 2)).toBe("tough_love");
  });

  it("never climbs past the user's cap", () => {
    expect(escalate("warm", 5)).toBe("warm");
    expect(escalate("firm", 5)).toBe("firm");
    expect(escalate("tough_love", 99)).toBe("tough_love");
  });
});

describe("inQuietHours", () => {
  it("handles a window wrapping midnight (default 22→7)", () => {
    expect(inQuietHours(23, 22, 7)).toBe(true);
    expect(inQuietHours(3, 22, 7)).toBe(true);
    expect(inQuietHours(7, 22, 7)).toBe(false);
    expect(inQuietHours(12, 22, 7)).toBe(false);
  });

  it("handles a same-day window (13→15)", () => {
    expect(inQuietHours(14, 13, 15)).toBe(true);
    expect(inQuietHours(15, 13, 15)).toBe(false);
  });

  it("equal start/end means no quiet window", () => {
    expect(inQuietHours(10, 9, 9)).toBe(false);
  });
});

describe("localClock", () => {
  it("converts UTC to the user's local hour and date", () => {
    // 2026-07-13T02:30Z = 2026-07-12 22:30 in New York (EDT, UTC-4)
    const { hour, todayIso } = localClock(new Date("2026-07-13T02:30:00Z"), "America/New_York");
    expect(hour).toBe(22);
    expect(todayIso).toBe("2026-07-12");
  });
});
