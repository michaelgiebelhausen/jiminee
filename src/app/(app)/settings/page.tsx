import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/features/settings/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, phone, voice_mode")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-xl px-5 pb-16 md:px-8">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Settings</h1>
      <SettingsClient
        userId={user.id}
        initialName={profile?.display_name ?? ""}
        initialPhone={profile?.phone ?? ""}
        initialVoiceMode={(profile?.voice_mode ?? "default") as "default" | "tough_love"}
      />
    </main>
  );
}
