import { describe, it, expect } from "vitest";
import { nudgeCopy, type NudgeKind, type VoiceMode } from "./voice";

const KINDS: NudgeKind[] = ["first", "sms_fallback"];
const MODES: VoiceMode[] = ["default", "tough_love"];

describe("nudgeCopy", () => {
  it("renders both modes for every nudge kind", () => {
    for (const mode of MODES) {
      for (const kind of KINDS) {
        const copy = nudgeCopy(mode, kind, "Restock the printer");
        expect(copy.title.length).toBeGreaterThan(0);
        expect(copy.body).toContain("Restock the printer");
      }
    }
  });

  it("default mode asks, never accuses", () => {
    const copy = nudgeCopy("default", "first", "Mail run");
    expect(copy.body).toMatch(/Still on/);
    expect(copy.body).not.toMatch(/inactive|unproductive|violation/i);
  });

  it("tough love roasts the user but never references the manager or consequences", () => {
    for (const kind of KINDS) {
      const copy = nudgeCopy("tough_love", kind, "Mail run");
      expect(copy.body + copy.title).not.toMatch(/manager|boss|supervisor|report|fired|write.?up/i);
    }
  });

  it("truncates very long task titles", () => {
    const copy = nudgeCopy("default", "first", "x".repeat(100));
    expect(copy.body.length).toBeLessThan(220);
  });
});
