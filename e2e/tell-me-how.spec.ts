import { test, expect, type Page } from "@playwright/test";

// Magic-moment path (US-004/005): post → claim → generate (AI_MOCK in dev) → check off → done.
// The dev server must run with AI_MOCK=1 for deterministic generation.

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/board");
}

test("worker generates steps, checks them off, and completes", async ({ browser }) => {
  const title = `Magic moment E2E ${Date.now()}`;

  const managerCtx = await browser.newContext();
  const manager = await managerCtx.newPage();
  await login(manager, "reyes@jiminee.test");
  await manager.getByRole("button", { name: "New card" }).click();
  await manager.getByPlaceholder("Type the task in one sentence…").fill(title);
  await manager.getByRole("button", { name: "Post card" }).click();
  await expect(manager.getByText(title)).toBeVisible({ timeout: 10_000 });
  await managerCtx.close();

  const workerCtx = await browser.newContext();
  const worker = await workerCtx.newPage();
  await login(worker, "tyler@jiminee.test");

  const card = worker.getByTestId("task-card").filter({ hasText: title });
  await card.getByRole("button", { name: "Claim this task" }).click();
  await worker.getByText(title).first().click();
  await worker.waitForURL("**/task/**");

  // Generate steps (mocked stream).
  await worker.getByRole("button", { name: "Tell me how" }).click();
  await expect(worker.getByRole("checkbox").first()).toBeVisible({ timeout: 20_000 });
  const boxes = worker.getByRole("checkbox");
  const count = await boxes.count();
  expect(count).toBeGreaterThanOrEqual(5);

  // Check off the first two steps.
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await expect(worker.getByText(/2 of \d+ done/)).toBeVisible();

  // Card chat replies (mocked).
  await worker.getByPlaceholder("Ask anything — no dumb questions here").fill("Where is the closet?");
  await worker.getByRole("button", { name: "Send" }).click();
  await expect(worker.getByText("You've got this", { exact: false })).toBeVisible({
    timeout: 20_000,
  });

  // Complete.
  await worker.getByRole("button", { name: "✓ Mark done" }).click();
  await expect(worker.getByText("marked it done")).toBeVisible({ timeout: 10_000 });

  await workerCtx.close();
});
