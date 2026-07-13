import { test, expect, type Page } from "@playwright/test";

// .me core accountability loop on /today:
//   morning ritual commit → habit check w/ streak bump → focus session → done.
// Requires the local Supabase stack seeded via `npx supabase db reset`
// (me@jiminee.test's personal workspace ships with a 3-day meditation streak).

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/board");
}

test("ritual commit, habit streak, focus session to done", async ({ page }) => {
  await login(page, "me@jiminee.test");
  await page.goto("/today");

  // Morning ritual proposes the seeded to-dos; commit the pre-checked picks.
  await expect(page.getByTestId("ritual")).toBeVisible({ timeout: 10_000 });
  const commit = page.getByTestId("commit-button");
  await expect(commit).toBeEnabled();
  await commit.click();

  // Committed picks replace the ritual.
  await expect(page.getByTestId("today-card").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("ritual")).toHaveCount(0);

  // Habit strip: the seeded 3-day meditation streak bumps to 4 on check-off.
  const meditate = page.getByTestId("habit-row").filter({ hasText: "Meditate" });
  await expect(meditate.getByTestId("streak-badge")).toHaveText(/3/);
  await meditate.getByTestId("habit-check").click();
  await expect(meditate.getByTestId("streak-badge")).toHaveText(/4/, { timeout: 10_000 });

  // Focus a committed pick, then finish it from the focus bar.
  await page.getByTestId("focus-start").first().click();
  await expect(page.getByTestId("focus-bar")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("focus-done").click();
  await expect(page.getByTestId("focus-bar")).toHaveCount(0, { timeout: 10_000 });

  // The finished pick shows struck-through in today's list.
  await expect(
    page.getByTestId("today-card").filter({ hasText: "✓" }).first()
  ).toBeVisible({ timeout: 10_000 });
});
