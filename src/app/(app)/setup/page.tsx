import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "@/components/features/setup/CreateOrgForm";

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/setup");

  // Already in an org? There's nothing to set up.
  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existing) redirect("/board");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">Set up your organization</h1>
        <p className="mt-2 text-ink-secondary">
          You&apos;ll be the administrator — you can invite managers and workers right after.
        </p>
      </div>
      <CreateOrgForm />
    </main>
  );
}
