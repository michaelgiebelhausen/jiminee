import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({ token: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  // Invitee isn't an org member yet, so RLS hides the invite — validate via admin client.
  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("id, org_id, role, accepted_at, expires_at")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (!invite || invite.accepted_at || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This invite is expired or already used — ask your administrator to re-invite you." },
      { status: 400 }
    );
  }

  const { error: memberError } = await admin
    .from("memberships")
    .insert({ org_id: invite.org_id, user_id: user.id, role: invite.role });

  if (memberError && !memberError.message.includes("duplicate")) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  await admin.from("invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  return NextResponse.json({ orgId: invite.org_id });
}
