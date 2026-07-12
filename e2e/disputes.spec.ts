import { test, expect, type Page } from "@playwright/test";

// Dispute round-trip (US-009/US-010): worker flags with a reason → card goes to
// Blocked → administrator rules → card routes + paper trail records it.

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/board");
}

test("worker disputes, admin rules dismissed, events recorded", async ({ browser }) => {
  const title = `Fridge cleanout E2E ${Date.now()}`;

  // Manager posts.
  const managerCtx = await browser.newContext();
  const manager = await managerCtx.newPage();
  await login(manager, "reyes@jiminee.test");
  await manager.getByRole("button", { name: "New card" }).click();
  await manager.getByPlaceholder("Type the task in one sentence…").fill(title);
  await manager.getByRole("button", { name: "Post card" }).click();
  await expect(manager.getByText(title)).toBeVisible({ timeout: 10_000 });
  await managerCtx.close();

  // Worker claims and disputes with a required reason.
  const workerCtx = await browser.newContext();
  const worker = await workerCtx.newPage();
  await login(worker, "tyler@jiminee.test");
  const card = worker.getByTestId("task-card").filter({ hasText: title });
  await card.getByRole("button", { name: "Claim this task" }).click();
  await worker.getByText(title).first().click();
  await worker.waitForURL("**/task/**");
  await worker.getByRole("button", { name: "Dispute" }).click();
  await worker
    .getByPlaceholder("Why isn't this yours to do? (at least 10 characters)")
    .fill("Cleaning the grad fridge was never part of the front-desk job description.");
  await worker.getByRole("button", { name: "Send to the referee" }).click();
  await expect(worker.getByText("Blocked / Flagged")).toBeVisible({ timeout: 10_000 });
  await workerCtx.close();

  // Administrator rules: dismissed → card back to Backlog, unassigned.
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, "pat@jiminee.test");
  await admin.goto("/admin");
  const disputeCard = admin.locator("div").filter({ hasText: title }).last();
  await expect(admin.getByText("flagged it:", { exact: false }).first()).toBeVisible({
    timeout: 10_000,
  });
  await disputeCard.getByLabel("Ruling").selectOption("dismissed");
  await disputeCard
    .getByPlaceholder("Your note — required. This is the record everyone sees.")
    .fill("Fair point — that one goes back to the pool.");
  await disputeCard.getByRole("button", { name: "Rule", exact: true }).click();
  await expect(admin.getByText("No open disputes", { exact: false })).toBeVisible({
    timeout: 10_000,
  });

  // Paper trail on the card.
  await admin.goto("/board");
  await admin.getByText(title).first().click();
  await admin.waitForURL("**/task/**");
  await expect(admin.getByText("disputed this task")).toBeVisible();
  await expect(admin.getByText("ruled: dismissed")).toBeVisible();
  await adminCtx.close();
});
