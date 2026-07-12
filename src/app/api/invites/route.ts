import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/notify/email";

const Body = z.object({
  email: z.string().email(),
  role: z.enum(["manager", "administrator", "worker"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Caller must be an administrator (RLS also enforces this on insert).
  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role, organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle(); // filtered to the caller — RLS also exposes co-members' rows

  if (!membership || membership.role !== "administrator") {
    return NextResponse.json({ error: "Only administrators can invite" }, { status: 403 });
  }

  const { data: invite, error } = await supabase
    .from("invites")
    .insert({
      org_id: membership.org_id,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: user.id,
    })
    .select("id, token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const orgName =
    (membership.organizations as unknown as { name: string } | null)?.name ?? "your team";
  await sendInviteEmail(parsed.data.email, orgName, parsed.data.role, invite.token);

  return NextResponse.json({ id: invite.id }, { status: 201 });
}
