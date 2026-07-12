import "server-only";

export type SmsResult = "delivered" | "failed" | "not_configured" | "no_phone";

// Telnyx REST v2 (PAYG; A2P 10DLC number from TASK-002). One retry, then the
// caller marks the nudge expired and surfaces it — never silent (PRD edge case).
export async function sendSms(to: string | null, body: string): Promise<SmsResult> {
  if (!to) return "no_phone";
  if (!process.env.TELNYX_API_KEY || !process.env.TELNYX_FROM_NUMBER) {
    console.log(`[sms:dev] to=${to} "${body}" (Telnyx not configured)`);
    return "not_configured";
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://api.telnyx.com/v2/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: process.env.TELNYX_FROM_NUMBER, to, text: body }),
      });
      if (res.ok) return "delivered";
    } catch {
      // retry once
    }
  }
  return "failed";
}
