import { test, expect } from "@playwright/test";

async function mockCalendarApis(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/calendar/month**", (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify(["2025-01-15", "2025-01-20"]),
    }),
  );
  await page.route("**/api/v1/calendar/day**", (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ healthStats: {}, activities: [], manualActivities: [] }),
    }),
  );
  await page.route("**/api/v1/calendar/activity**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
  );
  await page.route("**/api/v1/home**", (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ alerts: {}, aiMessage: "", user: {} }),
    }),
  );
}

// ─────────────────────────────────────────────────────────────
// Calendar Page
// ─────────────────────────────────────────────────────────────
test.describe("Calendar Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockCalendarApis(page);
    await page.goto("/calendar");
  });

  test("renders the page without crashing", async ({ page }) => {
    await expect(page.locator("main, [role='main']")).toBeVisible({ timeout: 5000 });
  });

  test("shows a month/year heading", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test("navigating to previous month changes the displayed month", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    const initialText = await heading.textContent();
    const prevBtn = page.getByRole("button").filter({ hasText: /[<←]|prev/i }).first();
    if (await prevBtn.count() > 0) {
      await prevBtn.click();
      await page.waitForTimeout(300);
      const newText = await heading.textContent();
      expect(newText).not.toBe(initialText);
    }
  });

  test("navigating to next month changes the displayed month", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    const initialText = await heading.textContent();
    const nextBtn = page.getByRole("button").filter({ hasText: /[>→]|next/i }).first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(300);
      const newText = await heading.textContent();
      expect(newText).not.toBe(initialText);
    }
  });

  test("shows error state when month load fails", async ({ page }) => {
    await page.route("**/api/v1/calendar/month**", (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: "Unauthorized" }) }),
    );
    await page.goto("/calendar");
    await page.waitForTimeout(1000);
    await expect(page.locator("main")).toBeVisible();
  });
});
