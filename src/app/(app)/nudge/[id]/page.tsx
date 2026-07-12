import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NudgeRespond } from "@/components/features/nudge/NudgeRespond";

export default async function NudgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/nudge/${id}`);

  const { data: nudge } = await supabase
    .from("nudges")
    .select("id, status, task_id, user_id, tasks(title, status)")
    .eq("id", id)
    .maybeSingle();

  const task = nudge?.tasks as unknown as { title: string; status: string } | null;
  const actionable = nudge && nudge.user_id === user.id && nudge.status === "sent" && task?.status === "doing";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
      <span className="text-4xl" aria-hidden>
        🦗
      </span>
      {actionable ? (
        <>
          <h1 className="font-display text-xl font-extrabold leading-snug">
            Still on &ldquo;{task!.title}&rdquo;?
          </h1>
          <p className="text-ink-secondary">
            Tap to confirm — or drop the card back if something came up. No drama either way.
          </p>
          <NudgeRespond nudgeId={nudge!.id} taskId={nudge!.task_id} />
        </>
      ) : (
        <>
          <h1 className="font-display text-xl font-extrabold">Already handled</h1>
          <p className="text-ink-secondary">
            This check-in was taken care of — nothing more to do here.
          </p>
          <Link
            href="/board"
            className="rounded-sm bg-primary px-5 py-2.5 font-bold text-on-primary hover:bg-primary-hover"
          >
            Back to the board
          </Link>
        </>
      )}
    </main>
  );
}
