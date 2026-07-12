import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchBoard } from "@/lib/board/queries";
import { BoardClient } from "@/components/features/board/BoardClient";
import type { Role } from "@/lib/permissions";

export default async function BoardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/board");

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/no-membership");

  // FR-013: workers can't reach the board without acknowledging the current disclosure.
  if (membership.role === "worker") {
    const { CURRENT_DISCLOSURE_VERSION } = await import("@/lib/consent");
    const { data: consent } = await supabase
      .from("consent_records")
      .select("id")
      .eq("user_id", user.id)
      .eq("disclosure_version", CURRENT_DISCLOSURE_VERSION)
      .limit(1)
      .maybeSingle();
    if (!consent) redirect("/onboarding");
  }

  const data = await fetchBoard(supabase);
  if (!data) redirect("/no-membership");

  return (
    <BoardClient
      initialTasks={data.tasks}
      boardId={data.board.id}
      orgId={membership.org_id}
      role={membership.role as Role}
      userId={user.id}
    />
  );
}
