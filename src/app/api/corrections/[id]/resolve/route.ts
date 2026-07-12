import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({ correction: z.string().min(3).max(4000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Manager/admin in the correction's org (visible to caller via RLS = flagger or manager+).
  const { data: correction } = await supabase
    .from("instruction_corrections")
    .select("id, org_id")
    .eq("id", id)
    .maybeSingle();
  if (!correction) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", correction.org_id)
    .maybeSingle();
  if (!membership || !["manager", "administrator"].includes(membership.role)) {
    return NextResponse.json({ error: "Only managers can store corrections" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("instruction_corrections")
    .update({ correction: parsed.data.correction, corrected_by: user.id })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ id });
}
