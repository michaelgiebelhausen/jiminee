import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteAcceptFlow } from "@/components/features/auth/InviteAcceptFlow";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invites")
    .select("role, accepted_at, expires_at, organizations(name)")
    .eq("token", token)
    .maybeSingle();

  const valid = invite && !invite.accepted_at && new Date(invite.expires_at) > new Date();
  const orgName = (invite?.organizations as unknown as { name: string } | null)?.name ?? "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-3">
        <Image src="/icons/cricket.svg" alt="" width={40} height={40} priority />
        <span className="font-display text-3xl font-extrabold tracking-tight">jiminee</span>
      </div>

      {valid ? (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div className="rounded-md border border-line bg-surface p-4 text-center shadow-rest">
            <p className="text-ink-secondary">You&apos;re invited to join</p>
            <p className="font-display text-xl font-bold">{orgName}</p>
            <p className="mt-1 text-sm text-ink-secondary">
              as <span className="font-bold uppercase tracking-wide">{invite.role}</span>
            </p>
          </div>
          <InviteAcceptFlow token={token} />
        </div>
      ) : (
        <div className="max-w-sm rounded-md border border-line bg-surface p-6 text-center shadow-rest">
          <h1 className="font-display text-xl font-bold">This invite has lapsed</h1>
          <p className="mt-2 text-ink-secondary">
            It&apos;s expired or already used — ask your administrator to re-invite you.
          </p>
        </div>
      )}
    </main>
  );
}
