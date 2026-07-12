// The cricket's voice (FR-016). Two modes:
// - default: warm conscience — asks, never accuses.
// - tough_love: opt-in roast (self-selected only; never references the manager,
//   coworkers, or consequences — the roast is a gift you give yourself).

export type VoiceMode = "default" | "tough_love";

export type NudgeKind = "first" | "sms_fallback";

export type NudgeCopy = { title: string; body: string };

export function nudgeCopy(mode: VoiceMode, kind: NudgeKind, taskTitle: string): NudgeCopy {
  const t = taskTitle.length > 60 ? taskTitle.slice(0, 57) + "…" : taskTitle;

  if (mode === "tough_love") {
    switch (kind) {
      case "first":
        return {
          title: "Riveting pace out there.",
          body: `"${t}" has seen zero action in a while. Tap if you're actually alive — or drop the card and stop holding it hostage.`,
        };
      case "sms_fallback":
        return {
          title: "Jiminee (still) chirping",
          body: `Jiminee: "${t}" is aging like milk. Tap the link to confirm you exist, champ.`,
        };
    }
  }

  switch (kind) {
    case "first":
      return {
        title: "Still on it?",
        body: `Still on "${t}"? Tap to confirm — or drop the card back if something came up.`,
      };
    case "sms_fallback":
      return {
        title: "Jiminee check-in",
        body: `Jiminee: still on "${t}"? Tap to confirm or drop the card — no drama either way.`,
      };
  }
}
