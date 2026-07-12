import { describe, it, expect } from "vitest";
import { sortBetween, needsRebalance, rebalance, SORT_STEP, MIN_GAP } from "./sort";

describe("sortBetween", () => {
  it("returns the base step for an empty column", () => {
    expect(sortBetween(null, null)).toBe(SORT_STEP);
  });
  it("places before the first card", () => {
    expect(sortBetween(null, 1024)).toBe(0);
  });
  it("places after the last card", () => {
    expect(sortBetween(2048, null)).toBe(2048 + SORT_STEP);
  });
  it("returns the midpoint between neighbors", () => {
    expect(sortBetween(1024, 2048)).toBe(1536);
  });
});

describe("needsRebalance", () => {
  it("is false at the edges", () => {
    expect(needsRebalance(null, 5)).toBe(false);
    expect(needsRebalance(5, null)).toBe(false);
  });
  it("detects gap underflow", () => {
    expect(needsRebalance(1, 1 + MIN_GAP)).toBe(true);
    expect(needsRebalance(1, 2)).toBe(false);
  });
});

describe("rebalance", () => {
  it("re-spaces ids on a fresh scale preserving order", () => {
    expect(rebalance(["a", "b", "c"])).toEqual([
      ["a", 1024],
      ["b", 2048],
      ["c", 3072],
    ]);
  });
});
