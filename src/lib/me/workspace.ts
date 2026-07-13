// .me personal workspace lookup — a personal workspace IS an organization
// with is_personal = true (0006), so all board queries/mutations/RLS reuse.

import type { SupabaseClient } from "@supabase/supabase-js";

export type PersonalWorkspace = {
  orgId: string;
  boardId: string;
  timezone: string;
};

/** The caller's personal workspace, or null if they haven't created one. */
export async function getPersonalWorkspace(
  supabase: SupabaseClient
): Promise<PersonalWorkspace | null> {
  const { data: org } = await supabase
    .from("organizations")
    .select("id, timezone")
    .eq("is_personal", true)
    .limit(1)
    .maybeSingle();
  if (!org) return null;

  const { data: board } = await supabase
    .from("boards")
    .select("id")
    .eq("org_id", org.id)
    .limit(1)
    .maybeSingle();
  if (!board) return null;

  return {
    orgId: org.id,
    boardId: board.id,
    timezone: org.timezone ?? "America/New_York",
  };
}

/** Create-if-missing via the idempotent RPC (0006), then return it. */
export async function ensurePersonalWorkspace(
  supabase: SupabaseClient
): Promise<PersonalWorkspace | null> {
  const existing = await getPersonalWorkspace(supabase);
  if (existing) return existing;
  const { error } = await supabase.rpc("create_personal_workspace");
  if (error) {
    console.error("create_personal_workspace failed:", error.message);
    return null;
  }
  return getPersonalWorkspace(supabase);
}
