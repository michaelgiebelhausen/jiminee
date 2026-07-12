import "server-only";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PushResult = "delivered" | "no_subscription" | "expired" | "failed" | "not_configured";

function configured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let vapidSet = false;
function ensureVapid() {
  if (!vapidSet && configured()) {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_CONTACT ?? "hello@jiminee.work"}`,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    vapidSet = true;
  }
}

/** Send a push to every subscription the user has. 410/404 → delete the row (PRD edge case). */
export async function sendPush(
  admin: SupabaseClient,
  userId: string,
  payload: { title: string; body: string; url: string; nudgeId?: string }
): Promise<PushResult> {
  if (!configured()) {
    console.log(`[push:dev] to=${userId} "${payload.title}" (VAPID not configured)`);
    return "not_configured";
  }
  ensureVapid();

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", userId);
  if (!subs || subs.length === 0) return "no_subscription";

  let delivered = false;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
        JSON.stringify(payload)
      );
      delivered = true;
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
  return delivered ? "delivered" : "expired";
}
