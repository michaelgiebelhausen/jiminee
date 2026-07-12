/** Parse the model's numbered output into clean step strings. (No server-only: unit-testable.) */
export function parseSteps(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+[.)]\s+/.test(l))
    .map((l) => l.replace(/^\d+[.)]\s+/, "").trim())
    .filter((l) => l.length > 0)
    .slice(0, 20);
}
