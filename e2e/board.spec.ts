import { test, expect, type Page } from "@playwright/test";

// Board happy path across two browser contexts (US-001/002/003).
// Requires the local Supabase stack seeded via `npx supabase db reset`.

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/board");
}

test("manager posts, worker claims, realtime syncs, worker completes", async ({ browser }) => {
  const title = `Courier run E2E ${Date.now()}`;

  const managerCtx = await browser.newContext();
  const workerCtx = await browser.newContext();
  const manager = await managerCtx.newPage();
  const worker = await workerCtx.newPage();

  await login(manager, "reyes@jiminee.test");
  await login(worker, "tyler@jiminee.test");

  // Manager posts a one-sentence card (US-001).
  await manager.getByRole("button", { name: "New card" }).click();
  await manager.getByPlaceholder("Type the task in one sentence…").fill(title);
  await manager.getByRole("button", { name: "Post card" }).click();
  await expect(manager.getByText(title)).toBeVisible({ timeout: 10_000 });

  // Worker sees it live without reloading (US-003, < a few seconds via Realtime/poll).
  await expect(worker.getByText(title)).toBeVisible({ timeout: 15_000 });

  // Worker claims it (US-002).
  const workerCard = worker.getByTestId("task-card").filter({ hasText: title });
  await workerCard.getByRole("button", { name: "Claim this task" }).click();

  // Claim reflects on the manager's board within the realtime window (US-003).
  const managerCard = manager.getByTestId("task-card").filter({ hasText: title });
  await expect(managerCard.getByTitle("Tyler Worker")).toBeVisible({ timeout: 15_000 });

  // Worker opens the card and completes it (activity log shows the lifecycle).
  await worker.getByText(title).first().click();
  await worker.waitForURL("**/task/**");
  await worker.getByRole("button", { name: "✓ Mark done" }).click();
  await expect(worker.getByText("marked it done")).toBeVisible({ timeout: 10_000 });

  await managerCtx.close();
  await workerCtx.close();
});
