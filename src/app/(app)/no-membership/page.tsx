import Link from "next/link";

export default function NoMembershipPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-2xl font-bold">You need an invite</h1>
      <p className="max-w-md text-ink-secondary">
        Jiminee boards are invite-only. Ask your administrator to send you an invite link — or if
        you&apos;re setting up a new organization, you can create one now.
      </p>
      <Link
        href="/setup"
        className="rounded-sm bg-primary px-5 py-2.5 font-bold text-on-primary hover:bg-primary-hover"
      >
        Create an organization
      </Link>
    </main>
  );
}
