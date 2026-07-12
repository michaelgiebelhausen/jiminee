// The workplace brief: the org-specific grounding for every Tell Me How prompt (FR-009).

export type WorkplaceBrief = {
  locations?: string;
  systems?: string;
  supplies?: string;
  contacts?: string;
  notes?: string;
};

export const BRIEF_SECTIONS: { key: keyof WorkplaceBrief; label: string; hint: string }[] = [
  {
    key: "locations",
    label: "Locations",
    hint: "Buildings, rooms, where things live. e.g. \"Mail room: 3rd floor next to the elevator.\"",
  },
  {
    key: "systems",
    label: "Systems & equipment",
    hint: "Printers, scanners, software — and where codes/logins are kept (never the codes themselves).",
  },
  {
    key: "supplies",
    label: "Supplies",
    hint: "Where toner, paper, keys, and the label maker actually are.",
  },
  {
    key: "contacts",
    label: "Who to ask",
    hint: "Facilities ext., IT helpdesk, who handles mail questions.",
  },
  {
    key: "notes",
    label: "Anything else",
    hint: "Door lock times, parking quirks, the printer that always jams.",
  },
];

export function briefToPromptText(brief: WorkplaceBrief): string {
  return BRIEF_SECTIONS.filter((s) => brief[s.key]?.trim())
    .map((s) => `${s.label}:\n${brief[s.key]!.trim()}`)
    .join("\n\n");
}

export function briefCompleteness(brief: WorkplaceBrief): number {
  const filled = BRIEF_SECTIONS.filter((s) => brief[s.key]?.trim()).length;
  return filled / BRIEF_SECTIONS.length;
}
