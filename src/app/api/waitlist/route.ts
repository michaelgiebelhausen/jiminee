import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "That doesn't look like an email." }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("me_waitlist")
    .upsert({ email: parsed.data.email.toLowerCase() }, { onConflict: "email" });
  if (error) return NextResponse.json({ error: "Try again in a moment." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
