import { describe, it, expect } from "vitest";
import { parseSteps } from "./parse";

describe("parseSteps", () => {
  it("parses numbered lines into clean steps", () => {
    expect(parseSteps("1. First thing\n2. Second thing\n3) Third thing")).toEqual([
      "First thing",
      "Second thing",
      "Third thing",
    ]);
  });
  it("ignores preamble and non-numbered lines", () => {
    expect(parseSteps("Here are the steps:\n1. Go\nDone!")).toEqual(["Go"]);
  });
  it("returns empty for unusable output", () => {
    expect(parseSteps("I cannot help with that.")).toEqual([]);
  });
  it("caps at 20 steps", () => {
    const many = Array.from({ length: 30 }, (_, i) => `${i + 1}. Step ${i + 1}`).join("\n");
    expect(parseSteps(many)).toHaveLength(20);
  });
});
