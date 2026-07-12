import "server-only";
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Jiminee <onboarding@resend.dev>";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null; // dev without Resend: emails are logged, not sent
  return new Resend(key);
}

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = client();
  if (!resend) {
    console.log(`[email:dev] to=${to} subject="${subject}"`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendInviteEmail(to: string, orgName: string, role: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
  await sendEmail(
    to,
    `You're invited to ${orgName} on Jiminee`,
    `<p>Hi! ${orgName} uses Jiminee — a task board with a friendly conscience.</p>
     <p>You've been invited as a <b>${role}</b>. This link is yours alone and works for 7 days:</p>
     <p><a href="${url}">${url}</a></p>
     <p>— Jiminee 🦗</p>`
  );
}

export async function sendDisputeRaisedEmail(
  to: string,
  taskTitle: string,
  reason: string,
  taskUrl: string
) {
  await sendEmail(
    to,
    `Dispute raised: "${taskTitle}"`,
    `<p>A worker flagged a task as out of scope.</p>
     <p><b>Task:</b> ${taskTitle}<br/><b>Their reason:</b> ${reason}</p>
     <p>Nothing happens without your ruling: <a href="${taskUrl}">review and rule</a>.</p>
     <p>— Jiminee 🦗</p>`
  );
}

export async function sendDisputeRuledEmail(
  to: string,
  taskTitle: string,
  ruling: string,
  note: string,
  taskUrl: string
) {
  await sendEmail(
    to,
    `Dispute ruled: "${taskTitle}"`,
    `<p>The administrator ruled on the flagged task.</p>
     <p><b>Task:</b> ${taskTitle}<br/><b>Ruling:</b> ${ruling}<br/><b>Note:</b> ${note}</p>
     <p><a href="${taskUrl}">See the card</a>.</p>
     <p>— Jiminee 🦗</p>`
  );
}

export async function sendCorrectionFlagEmail(
  to: string,
  taskTitle: string,
  note: string,
  taskUrl: string
) {
  await sendEmail(
    to,
    `Steps flagged as wrong: "${taskTitle}"`,
    `<p>A worker flagged the AI-generated steps on your task as wrong:</p>
     <p><b>What didn't match reality:</b> ${note}</p>
     <p>One tap to store the correction so the next checklist is smarter: <a href="${taskUrl}">open the card</a>.</p>
     <p>— Jiminee 🦗</p>`
  );
}
