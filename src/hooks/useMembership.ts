"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { Role } from "@/lib/permissions";

export type Membership = {
  orgId: string;
  orgName: string;
  role: Role;
  briefCompleted: boolean;
};

// Single-org assumption for the MVP: the first membership is "the" org.
let cached: Membership | null | undefined;

export function useMembership() {
  const [membership, setMembership] = useState<Membership | null>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined || cached === null);

  useEffect(() => {
    if (cached !== undefined) {
      setMembership(cached);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { data: null as null };
      return supabase
        .from("memberships")
        .select("org_id, role, organizations(name, brief_completed_at)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
    })().then(({ data }) => {
        if (data) {
          const org = data.organizations as unknown as {
            name: string;
            brief_completed_at: string | null;
          };
          cached = {
            orgId: data.org_id,
            orgName: org?.name ?? "",
            role: data.role as Role,
            briefCompleted: Boolean(org?.brief_completed_at),
          };
        } else {
          cached = null;
        }
        setMembership(cached);
        setLoading(false);
      });
  }, []);

  return { membership, loading };
}

export function clearMembershipCache() {
  cached = undefined;
}
