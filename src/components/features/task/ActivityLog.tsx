import type { TaskEventRow } from "@/lib/events";
import { format } from "date-fns";

function describe(e: TaskEventRow): string {
  const who = e.actor?.display_name ?? "Jiminee";
  const p = e.payload as Record<string, string>;
  switch (e.event_type) {
    case "created":
      return `${who} posted this card`;
    case "claimed":
      return `${who} claimed it`;
    case "released":
      return `${who} dropped the card back`;
    case "moved":
      return `${who} moved it from ${p.from} to ${p.to}`;
    case "step_checked":
      return `${who} checked off step ${p.step ?? ""}`.trim();
    case "steps_generated":
      return `${who} asked Jiminee how`;
    case "chat_message":
      return `${who} asked Jiminee a question`;
    case "nudge_sent":
      return `Jiminee sent a ${p.channel ?? "push"} nudge`;
    case "nudge_confirmed":
      return `${who} confirmed they're still on it`;
    case "nudge_expired":
      return `A nudge went unanswered`;
    case "flagged":
      return `${who} disputed this task`;
    case "ruled":
      return `${who} ruled: ${p.ruling ?? ""}`.trim();
    case "completed":
      return `${who} marked it done`;
    case "correction_flagged":
      return `${who} flagged the steps as wrong`;
    case "manager_chase":
      return `${who} had to chase this one personally`;
    default:
      return `${who} · ${e.event_type}`;
  }
}

export function ActivityLog({ events }: { events: TaskEventRow[] }) {
  if (events.length === 0) {
    return <p className="px-1 text-sm italic text-ink-muted">No activity yet — quiet as a garden.</p>;
  }
  return (
    <ul className="flex flex-col gap-2 px-0.5">
      {events.map((e) => (
        <li key={e.id} className="flex items-baseline gap-2.5 text-[13px] text-ink-secondary">
          <span className="min-w-16 text-xs text-ink-muted">
            {format(new Date(e.created_at), "MMM d, p")}
          </span>
          <span>{describe(e)}</span>
        </li>
      ))}
    </ul>
  );
}
