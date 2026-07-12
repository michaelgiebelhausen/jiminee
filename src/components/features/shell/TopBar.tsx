"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useMembership, clearMembershipCache } from "@/hooks/useMembership";
import { can } from "@/lib/permissions";

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { membership } = useMembership();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearMembershipCache();
    router.push("/login");
    router.refresh();
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-sm px-3 py-1.5 text-sm font-bold ${
        pathname.startsWith(href)
          ? "bg-accent-soft text-ink"
          : "text-ink-secondary hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="flex items-center gap-3 px-4 py-3 md:px-6">
      <Link href="/board" className="flex items-center gap-2.5">
        <Image src="/icons/cricket.svg" alt="" width={32} height={32} priority />
        <span className="font-display text-xl font-extrabold tracking-tight">jiminee</span>
      </Link>

      {membership && (
        <span className="hidden rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-secondary sm:inline">
          {membership.orgName}
        </span>
      )}

      <nav className="ml-2 hidden items-center gap-1 md:flex">
        {membership && navLink("/board", "Board")}
        {can(membership?.role, "viewDashboard") && navLink("/dashboard", "Dashboard")}
        {can(membership?.role, "manageOrg") && navLink("/admin", "Admin")}
      </nav>

      <div className="grow" />

      <Link
        href="/settings"
        className="rounded-sm px-3 py-1.5 text-sm font-semibold text-ink-secondary hover:text-primary"
      >
        Settings
      </Link>
      <button
        onClick={signOut}
        className="rounded-sm border border-line-strong bg-surface px-3 py-1.5 text-sm font-bold text-ink-secondary hover:bg-surface-sunken"
      >
        Sign out
      </button>
    </header>
  );
}
