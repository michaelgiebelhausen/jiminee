// Fractional ordering within a column: new positions get the midpoint between
// neighbors; when the gap underflows, the column is rebalanced to a fresh scale.

export const SORT_STEP = 1024;
export const MIN_GAP = 1e-9;

export function sortBetween(prev: number | null, next: number | null): number {
  if (prev === null && next === null) return SORT_STEP;
  if (prev === null) return (next as number) - SORT_STEP;
  if (next === null) return prev + SORT_STEP;
  return (prev + next) / 2;
}

export function needsRebalance(prev: number | null, next: number | null): boolean {
  if (prev === null || next === null) return false;
  return Math.abs(next - prev) < MIN_GAP * 2;
}

/** Returns [taskId, newSortOrder] pairs on a fresh SORT_STEP scale, preserving order. */
export function rebalance(orderedIds: string[]): Array<[string, number]> {
  return orderedIds.map((id, i) => [id, (i + 1) * SORT_STEP]);
}
