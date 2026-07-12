import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/features/onboarding/OnboardingFlow";
import { CURRENT_DISCLOSURE_VERSION } from "@/lib/consent";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/no-membership");

  // Already acknowledged the current disclosure? Straight to the board.
  const { data: consent } = await supabase
    .from("consent_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("disclosure_version", CURRENT_DISCLOSURE_VERSION)
    .limit(1)
    .maybeSingle();
  if (consent) redirect("/board");

  const orgName =
    (membership.organizations as unknown as { name: string } | null)?.name ?? "the team";

  return <OnboardingFlow userId={user.id} orgName={orgName} />;
}
