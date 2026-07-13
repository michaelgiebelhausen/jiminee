import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cross-tenant RLS suite (TASK-053, PRD § NFR Security): org A accounts attempt
// reads and writes against org B rows across the core tables; role rules hold.

const URL = "http://127.0.0.1:54341";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const ORG_A = "10000000-0000-0000-0000-000000000001";
const ORG_B = "10000000-0000-0000-0000-000000000002";

async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(URL, ANON);
  const { error } = await client.auth.signInWithPassword({ email, password: "password123" });
  expect(error, `${email} signs in`).toBeNull();
  return client;
}

const TABLES = [
  "organizations",
  "memberships",
  "boards",
  "tasks",
  "task_steps",
  "task_messages",
  "task_events",
  "disputes",
  "nudges",
  "instruction_corrections",
  "consent_records",
];

test("cross-tenant reads return zero org-B rows for every table", async () => {
  const tyler = await signIn("tyler@jiminee.test");
  for (const table of TABLES) {
    const col = table === "organizations" ? "id" : "org_id";
    const { data } = await tyler.from(table).select(col).eq(col, ORG_B);
    expect(data ?? [], `${table} leaks org B rows`).toHaveLength(0);
  }
});

test("cross-tenant writes are denied", async () => {
  const otherAdmin = await signIn("admin@other.test");

  // Org B admin cannot insert a task into org A.
  const { data: aBoard } = await createClient(URL, ANON).from("boards").select("id").limit(1);
  expect(aBoard ?? []).toHaveLength(0); // anon sees nothing either

  const insert = await otherAdmin.from("tasks").insert({
    org_id: ORG_A,
    board_id: "00000000-0000-0000-0000-00000000dead",
    title: "cross-org write attempt",
    created_by: "00000000-0000-0000-0000-000000000011",
  });
  expect(insert.error, "cross-org task insert must fail").toBeTruthy();

  // Org B admin cannot update org A's organization row.
  const update = await otherAdmin
    .from("organizations")
    .update({ name: "hijacked" })
    .eq("id", ORG_A)
    .select("id");
  expect(update.data ?? []).toHaveLength(0);
});

test("role rules: workers cannot create tasks, rule disputes, or edit others' rows", async () => {
  const tyler = await signIn("tyler@jiminee.test");

  const { data: board } = await tyler.from("boards").select("id, org_id").limit(1).single();
  if (!board) throw new Error("seeded board missing");
  const taskInsert = await tyler.from("tasks").insert({
    org_id: board.org_id,
    board_id: board.id,
    title: "worker cannot create",
    created_by: "00000000-0000-0000-0000-000000000003",
  });
  expect(taskInsert.error, "worker task creation denied").toBeTruthy();

  const disputeRule = await tyler
    .from("disputes")
    .update({ status: "dismissed" })
    .eq("org_id", board.org_id)
    .select("id");
  expect(disputeRule.data ?? []).toHaveLength(0);

  // Workers cannot update another user's profile.
  const profileHack = await tyler
    .from("users")
    .update({ display_name: "hacked" })
    .eq("id", "00000000-0000-0000-0000-000000000002")
    .select("id");
  expect(profileHack.data ?? []).toHaveLength(0);

  // Consent records are append-only even for their owner.
  const consentEdit = await tyler
    .from("consent_records")
    .update({ disclosure_version: "forged" })
    .eq("user_id", "00000000-0000-0000-0000-000000000003")
    .select("id");
  expect(consentEdit.data ?? []).toHaveLength(0);
});
