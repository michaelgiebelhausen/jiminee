import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "./email";

// Daily manager digest (FR-019): yesterday's completions + open exceptions.
// Skip-if-quiet: managers with zero activity get nothing.
export async function sendDailyDigests(admin: SupabaseClient): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  let sent = 0;

  const { data: orgs } = await admin.from("organizations").select("id, name");
  for (const org of orgs ?? []) {
    const [{ data: completed }, { data: exceptions }, { data: disputes }, { data: managers }] =
      await Promise.all([
        admin
          .from("tasks")
          .select("title")
          .eq("org_id", org.id)
          .eq("status", "done")
          .gte("completed_at", since),
        admin
          .from("nudges")
          .select("id, tasks(title)")
          .eq("org_id", org.id)
          .eq("status", "expired")
          .gte("sent_at", since),
        admin.from("disputes").select("id, tasks(title)").eq("org_id", org.id).eq("status", "open"),
        admin
          .from("memberships")
          .select("user_id")
          .eq("org_id", org.id)
          .in("role", ["manager", "administrator"]),
      ]);

    const done = completed ?? [];
    const missed = exceptions ?? [];
    const open = disputes ?? [];
    if (done.length === 0 && missed.length === 0 && open.length === 0) continue; // skip-if-quiet

    const html = `
      <p>Yesterday at ${org.name}, by the numbers:</p>
      <p><b>${done.length} task${done.length === 1 ? "" : "s"} finished</b>${
        done.length ? ":<br/>" + done.map((t) => `· ${t.title}`).join("<br/>") : "."
      }</p>
      ${missed.length ? `<p><b>${missed.length} nudge${missed.length === 1 ? "" : "s"} went unanswered</b> — worth a glance on the dashboard.</p>` : ""}
      ${open.length ? `<p><b>${open.length} dispute${open.length === 1 ? "" : "s"} await a ruling.</b></p>` : ""}
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Open the dashboard</a></p>
      <p>— Jiminee 🦗</p>`;

    for (const m of managers ?? []) {
      const { data: authUser } = await admin.auth.admin.getUserById(m.user_id);
      if (authUser?.user?.email) {
        await sendEmail(authUser.user.email, `Jiminee digest — ${org.name}`, html);
        sent++;
      }
    }
  }
  return sent;
}
