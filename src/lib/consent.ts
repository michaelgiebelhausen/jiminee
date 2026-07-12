// FR-013: disclosure copy (vision § Voice & Tone, consent row) and versioning.
// Bumping the version forces re-acknowledgment before board access.

export const CURRENT_DISCLOSURE_VERSION = "v1-tier1";

export const DISCLOSURE = {
  heading: "What Jiminee sees — and what it never looks at",
  body: [
    "Jiminee records when you claim and finish tasks, which checklist steps you complete, and when you respond to reminders.",
    "If a task you've claimed goes quiet for a while, Jiminee may send you a reminder — a browser notification or a text message.",
    "Your manager sees task activity: what was claimed, finished, and when. Never your screen, camera, location, or anything on your device.",
    "This record also protects you — it's proof of the work you did.",
  ],
  acknowledgment: "I understand what Jiminee records and who can see it.",
};
